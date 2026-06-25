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
  const { data } = await admin
    .from("brand_crawl_results")
    .select("markdown, page_url, title, description, status_code, raw_json")
    .eq("crawl_id", crawlId)
    .order("created_at", { ascending: true });

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
  await admin
    .from("brand_crawls")
    .update({ raw_data, updated_at: new Date().toISOString() })
    .eq("id", crawlId);
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

  if (scrapeId) {
    const { data: existing } = await admin
      .from("brand_crawl_results")
      .select("id")
      .eq("crawl_id", crawlId)
      .eq("firecrawl_scrape_id", scrapeId)
      .maybeSingle();

    if (existing?.id) {
      await admin.from("brand_crawl_results").update(row).eq("id", existing.id);
    } else {
      await admin.from("brand_crawl_results").insert(row);
    }
  } else {
    const { data: existing } = await admin
      .from("brand_crawl_results")
      .select("id")
      .eq("crawl_id", crawlId)
      .eq("page_url", pageUrl)
      .maybeSingle();

    if (existing?.id) {
      await admin.from("brand_crawl_results").update(row).eq("id", existing.id);
    } else {
      await admin.from("brand_crawl_results").insert(row);
    }
  }
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
    .select("id, brand_id, started_at, started_by")
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
      await admin
        .from("brand_crawls")
        .update({
          job_status: "running",
          pages_found: payload.data?.length ?? 0,
          updated_at: now,
        })
        .eq("id", crawlId);
      return;
    }

    if (eventType === "crawl.page" && payload.data?.length) {
      for (const page of payload.data) {
        await upsertPage(admin, crawlId, brandId, page);
      }

      const { count } = await admin
        .from("brand_crawl_results")
        .select("id", { count: "exact", head: true })
        .eq("crawl_id", crawlId);

      await admin
        .from("brand_crawls")
        .update({
          pages_crawled: count ?? payload.data.length,
          job_status: "running",
          updated_at: now,
        })
        .eq("id", crawlId);

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

      await admin
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

      await admin
        .from("brands")
        .update({ intake_status: "crawl_complete" })
        .eq("id", brandId);

      await logWebhook(
        { job_status: "complete", pages_crawled: pages.length },
        duration_ms,
      );
      return;
    }

    if (eventType === "crawl.failed" || payload.success === false) {
      const errorMessage =
        payload.error ?? "Firecrawl reported crawl failure";

      await admin
        .from("brand_crawls")
        .update({
          job_status: "failed",
          raw_payload: { ...payload, error: errorMessage },
          completed_at: now,
          updated_at: now,
        })
        .eq("id", crawlId);

      await admin
        .from("brands")
        .update({ intake_status: "failed" })
        .eq("id", brandId);

      await logWebhook({ job_status: "failed", error: errorMessage });
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
