import { insertAgentLog } from "../_shared/agent-log.ts";
import { getOptionalSecret } from "../_shared/env.ts";
import {
  buildRawDataAggregate,
  parseCrawlWebhookEvent,
  pageUrlFromMetadata,
  verifyFirecrawlSignature,
  wordCountFromMarkdown,
  type FirecrawlPage,
} from "../_shared/firecrawl.ts";
import { handleCors } from "../_shared/cors.ts";
import { errorResponse, jsonResponse } from "../_shared/response.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";

console.info("firecrawl-webhook function started");

function normalizeEventType(type: string): string {
  if (!type) return "";
  return type.startsWith("crawl.") ? type : `crawl.${type}`;
}

async function loadPagesForCrawl(
  admin: ReturnType<typeof createServiceClient>,
  crawlId: string,
) {
  const { data, error } = await admin
    .from("brand_crawl_results")
    .select("markdown, page_url, title, description, status_code, raw_json")
    .eq("crawl_id", crawlId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`loadPagesForCrawl: ${error.message}`);

  return (data ?? []).map((row) => ({
    markdown: row.markdown ?? "",
    metadata: {
      title: row.title ?? undefined,
      description: row.description ?? undefined,
      statusCode: row.status_code ?? undefined,
      url: row.page_url ?? undefined,
      ...(typeof row.raw_json === "object" && row.raw_json
        ? (row.raw_json as { metadata?: Record<string, unknown> }).metadata
        : {}),
    },
  })) as FirecrawlPage[];
}

async function rebuildJobRawData(
  admin: ReturnType<typeof createServiceClient>,
  crawlId: string,
) {
  const pages = await loadPagesForCrawl(admin, crawlId);
  const raw_data = buildRawDataAggregate(pages);
  const { error } = await admin
    .from("brand_crawls")
    .update({ raw_data, updated_at: new Date().toISOString() })
    .eq("id", crawlId);
  if (error) throw new Error(`rebuildJobRawData: ${error.message}`);
}

async function upsertPage(
  admin: ReturnType<typeof createServiceClient>,
  crawlId: string,
  brandId: string,
  page: FirecrawlPage,
) {
  const meta = page.metadata;
  const pageUrl = pageUrlFromMetadata(meta);
  if (!pageUrl) return;

  const markdown = page.markdown ?? "";
  const scrapeId = meta?.scrapeId ?? null;

  const row = {
    brand_id: brandId,
    crawl_id: crawlId,
    page_url: pageUrl,
    title: meta?.title ?? null,
    description: meta?.description ?? null,
    status_code: meta?.statusCode ?? null,
    word_count: wordCountFromMarkdown(markdown),
    page_depth: meta?.depth ?? 0,
    markdown,
    raw_json: page,
    firecrawl_scrape_id: scrapeId,
  };

  const onConflict = scrapeId
    ? "crawl_id,firecrawl_scrape_id"
    : "crawl_id,page_url";

  const { error } = await admin
    .from("brand_crawl_results")
    .upsert(row, { onConflict });

  if (error) throw new Error(`upsertPage: ${error.message}`);
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") {
    return errorResponse("method_not_allowed", "Use POST", 405);
  }

  const secret = getOptionalSecret("FIRECRAWL_WEBHOOK_SECRET");
  if (!secret) {
    console.error("FIRECRAWL_WEBHOOK_SECRET not configured");
    return errorResponse("config_error", "Webhook not configured", 503);
  }

  const rawBody = await req.text();
  const signature = req.headers.get("X-Firecrawl-Signature");

  const valid = await verifyFirecrawlSignature(rawBody, signature, secret);
  if (!valid) {
    return errorResponse("unauthorized", "Invalid webhook signature", 401);
  }

  let payload: ReturnType<typeof parseCrawlWebhookEvent>;
  try {
    payload = parseCrawlWebhookEvent(JSON.parse(rawBody));
  } catch {
    return errorResponse("invalid_request", "Invalid JSON body", 400);
  }

  const firecrawlJobId = payload.id;
  if (!firecrawlJobId) {
    return jsonResponse({ received: true, ignored: true });
  }

  const admin = createServiceClient();
  const meta = payload.metadata ?? {};

  let crawlId = meta.crawl_id;
  let brandId = meta.brand_id;

  const { data: job } = await admin
    .from("brand_crawls")
    .select("id, brand_id, started_at, started_by, workflow_id")
    .eq("firecrawl_job_id", firecrawlJobId)
    .maybeSingle();

  if (job) {
    crawlId = job.id;
    brandId = job.brand_id;
  }

  if (!crawlId || !brandId) {
    console.warn("firecrawl-webhook: missing crawl mapping", firecrawlJobId);
    return jsonResponse({ received: true, ignored: true });
  }

  const eventType = normalizeEventType(payload.type ?? "");
  const now = new Date().toISOString();

  const logWebhook = async (
    output: Record<string, unknown>,
    durationMs?: number | null,
  ) => {
    if (!job?.started_by) return;
    try {
      await insertAgentLog(admin, {
        agentName: "firecrawl-webhook",
        userId: job.started_by,
        brandId,
        input: { eventType, firecrawlJobId, crawlId },
        output,
        durationMs: durationMs ?? null,
      });
    } catch (logErr) {
      console.warn("firecrawl-webhook: agent log insert failed", logErr);
    }
  };

  const process = async () => {
    if (eventType === "crawl.started") {
      const { error } = await admin
        .from("brand_crawls")
        .update({
          job_status: "running",
          pages_found: payload.data?.length ?? 0,
          updated_at: now,
        })
        .eq("id", crawlId);
      if (error) throw new Error(`crawl.started update: ${error.message}`);
      return;
    }

    if (eventType === "crawl.page" && payload.data?.length) {
      for (const page of payload.data) {
        await upsertPage(admin, crawlId, brandId, page);
      }

      const { count, error: countErr } = await admin
        .from("brand_crawl_results")
        .select("id", { count: "exact", head: true })
        .eq("crawl_id", crawlId);
      if (countErr) throw new Error(`crawl.page count: ${countErr.message}`);

      const { error: updateErr } = await admin
        .from("brand_crawls")
        .update({
          pages_crawled: count ?? payload.data.length,
          job_status: "running",
          updated_at: now,
        })
        .eq("id", crawlId);
      if (updateErr) throw new Error(`crawl.page update: ${updateErr.message}`);

      await rebuildJobRawData(admin, crawlId);
      return;
    }

    if (eventType === "crawl.completed") {
      if (payload.data?.length) {
        for (const page of payload.data) {
          await upsertPage(admin, crawlId, brandId, page);
        }
      }

      const startedAt = job?.started_at
        ? new Date(job.started_at).getTime()
        : null;
      const duration_ms = startedAt
        ? Math.max(0, Date.now() - startedAt)
        : null;

      const pages = await loadPagesForCrawl(admin, crawlId);
      const raw_data = buildRawDataAggregate(pages);

      const { error: jobUpdateErr } = await admin
        .from("brand_crawls")
        .update({
          job_status: "complete",
          pipeline_state: "crawl_only",
          pages_crawled: pages.length,
          duration_ms,
          raw_payload: payload,
          raw_data,
          completed_at: now,
          updated_at: now,
        })
        .eq("id", crawlId);
      if (jobUpdateErr) {
        throw new Error(`crawl.completed job update: ${jobUpdateErr.message}`);
      }

      const { error: brandUpdateErr } = await admin
        .from("brands")
        .update({ intake_status: "crawl_complete" })
        .eq("id", brandId);
      if (brandUpdateErr) {
        throw new Error(`crawl.completed brand update: ${brandUpdateErr.message}`);
      }

      await logWebhook(
        { job_status: "complete", pages_crawled: pages.length },
        duration_ms,
      );

      // IPI-32: resume Mastra brand-intelligence workflow if one is waiting
      const workflowRunId = job?.workflow_id ?? meta?.workflow_id;
      if (workflowRunId) {
        const appUrl = Deno.env.get("NEXT_PUBLIC_APP_URL") ?? Deno.env.get("APP_URL");
        const secret = Deno.env.get("INTERNAL_WEBHOOK_SECRET");
        if (!appUrl || !secret) {
          console.error(`firecrawl-webhook: cannot resume workflow ${workflowRunId} — APP_URL or INTERNAL_WEBHOOK_SECRET not configured`);
        } else {
          try {
            const res = await fetch(`${appUrl}/api/workflows/brand-intelligence/resume`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "X-Internal-Secret": secret },
              body: JSON.stringify({ runId: workflowRunId, crawlId }),
            });
            if (!res.ok) console.warn(`workflow resume ${res.status}: ${await res.text().catch(() => res.statusText)}`);
          } catch (e: unknown) {
            console.warn("workflow resume call failed:", e);
          }
        }
      }

      return;
    }

    if (eventType === "crawl.failed" || payload.success === false) {
      const errorMessage =
        payload.error ?? "Firecrawl reported crawl failure";

      const { error: jobFailErr } = await admin
        .from("brand_crawls")
        .update({
          job_status: "failed",
          raw_payload: { ...payload, error: errorMessage },
          completed_at: now,
          updated_at: now,
        })
        .eq("id", crawlId);
      if (jobFailErr) throw new Error(`crawl.failed job update: ${jobFailErr.message}`);

      const { error: brandFailErr } = await admin
        .from("brands")
        .update({ intake_status: "failed" })
        .eq("id", brandId);
      if (brandFailErr) {
        throw new Error(`crawl.failed brand update: ${brandFailErr.message}`);
      }

      await logWebhook({ job_status: "failed", error: errorMessage });

      // Resume workflow with failure signal so it doesn't stay permanently suspended
      const workflowRunId = job?.workflow_id ?? meta?.workflow_id;
      if (workflowRunId) {
        const appUrl = Deno.env.get("NEXT_PUBLIC_APP_URL") ?? Deno.env.get("APP_URL");
        const secret = Deno.env.get("INTERNAL_WEBHOOK_SECRET");
        if (!appUrl || !secret) {
          console.error(`firecrawl-webhook: cannot fail-resume workflow ${workflowRunId} — APP_URL or INTERNAL_WEBHOOK_SECRET not configured`);
        } else {
          try {
            const res = await fetch(`${appUrl}/api/workflows/brand-intelligence/resume`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "X-Internal-Secret": secret },
              body: JSON.stringify({ runId: workflowRunId, crawlId, failed: true, error: errorMessage }),
            });
            if (!res.ok) console.warn(`workflow fail-resume ${res.status}: ${await res.text().catch(() => res.statusText)}`);
          } catch (e: unknown) {
            console.warn("workflow fail-resume call failed:", e);
          }
        }
      }
    }
  };

  const runtime = (globalThis as { EdgeRuntime?: { waitUntil?: (p: Promise<unknown>) => void } })
    .EdgeRuntime;
  if (runtime?.waitUntil) {
    runtime.waitUntil(process().catch((e) => console.error("webhook process:", e)));
  } else {
    await process();
  }

  return jsonResponse({ received: true });
});
