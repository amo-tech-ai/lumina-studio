import { insertAgentLog } from "../_shared/agent-log.ts";
import { isAuthFailure, resolveAuth } from "../_shared/auth.ts";
import { handleCors } from "../_shared/cors.ts";
import { getOptionalSecret } from "../_shared/env.ts";
import { firecrawlStartCrawl } from "../_shared/firecrawl.ts";
import {
  errorResponse,
  jsonResponse,
  safeErrorMessage,
} from "../_shared/response.ts";
import { createServiceClient, createUserClient } from "../_shared/supabase-client.ts";

console.info("start-brand-crawl function started");

const CRAWL_LIMIT = 50;

type StartBody = {
  brandId?: string;
  url?: string;
  websiteUrl?: string;
  idempotencyKey?: string;
  workflowId?: string;
  requestId?: string;
};

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error("URL must start with http:// or https://");
  }
  return trimmed;
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") {
    return errorResponse("method_not_allowed", "Use POST", 405);
  }

  if (!getOptionalSecret("FIRECRAWL_API_KEY")) {
    return errorResponse("config_error", "Firecrawl is not configured", 503);
  }

  try {
    const auth = await resolveAuth(req, { required: true });
    if (isAuthFailure(auth)) return auth.response;

    let body: StartBody;
    try {
      body = (await req.json()) as StartBody;
    } catch {
      return errorResponse("invalid_request", "Invalid JSON body", 400);
    }
    const brandId = body.brandId?.trim();
    const sourceUrl = normalizeUrl(body.url ?? body.websiteUrl ?? "");

    if (!brandId) {
      return errorResponse("invalid_request", "brandId is required", 400);
    }

    const userClient = createUserClient(auth.accessToken);
    const { data: brand, error: brandErr } = await userClient
      .from("brands")
      .select("id, brand_url, org_id")
      .eq("id", brandId)
      .single();

    if (brandErr || !brand) {
      return errorResponse("not_found", "Brand not found or access denied", 404);
    }

    const idempotencyKey =
      body.idempotencyKey?.trim() ||
      `onboarding-${brandId}-${sourceUrl}`;

    const admin = createServiceClient();

    const { data: existing } = await admin
      .from("brand_crawls")
      .select("id, firecrawl_job_id, job_status")
      .eq("brand_id", brandId)
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (
      existing &&
      existing.job_status !== "failed" &&
      existing.job_status !== "cancelled"
    ) {
      return jsonResponse({
        crawlId: existing.id,
        firecrawlJobId: existing.firecrawl_job_id,
        reused: true,
      });
    }

    const requestId =
      body.requestId?.trim() ||
      crypto.randomUUID();

    const { data: crawlRow, error: insertErr } = await admin
      .from("brand_crawls")
      .insert({
        brand_id: brandId,
        source_url: sourceUrl,
        job_status: "queued",
        pipeline_state: "crawl_only",
        idempotency_key: idempotencyKey,
        started_by: auth.user.id,
        workflow_id: body.workflowId?.trim() || null,
        request_id: requestId,
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertErr || !crawlRow?.id) {
      if (insertErr?.code === "23505") {
        const { data: dup } = await admin
          .from("brand_crawls")
          .select("id, firecrawl_job_id")
          .eq("brand_id", brandId)
          .eq("idempotency_key", idempotencyKey)
          .maybeSingle();
        if (dup) {
          return jsonResponse({
            crawlId: dup.id,
            firecrawlJobId: dup.firecrawl_job_id,
            reused: true,
          });
        }
      }
      throw new Error(insertErr?.message ?? "Failed to create crawl job");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrl) throw new Error("SUPABASE_URL missing");

    const webhookUrl = `${supabaseUrl}/functions/v1/firecrawl-webhook`;

    let firecrawlJobId: string;
    try {
      ({ id: firecrawlJobId } = await firecrawlStartCrawl({
        url: sourceUrl,
        limit: CRAWL_LIMIT,
        formats: ["markdown"],
        webhook: {
          url: webhookUrl,
          metadata: {
            brand_id: brandId,
            crawl_id: crawlRow.id,
            request_id: requestId,
            ...(body.workflowId ? { workflow_id: body.workflowId } : {}),
          },
          events: ["started", "page", "completed", "failed"],
        },
      }));
    } catch (firecrawlErr) {
      const message = safeErrorMessage(firecrawlErr);
      const failedAt = new Date().toISOString();
      await admin
        .from("brand_crawls")
        .update({
          job_status: "failed",
          raw_payload: { error: message },
          completed_at: failedAt,
          updated_at: failedAt,
        })
        .eq("id", crawlRow.id);
      await admin
        .from("brands")
        .update({ intake_status: "failed" })
        .eq("id", brandId);
      throw firecrawlErr;
    }

    const { error: updateErr } = await admin
      .from("brand_crawls")
      .update({
        firecrawl_job_id: firecrawlJobId,
        job_status: "running",
        updated_at: new Date().toISOString(),
      })
      .eq("id", crawlRow.id);

    if (updateErr) throw new Error(updateErr.message);

    await admin
      .from("brands")
      .update({ intake_status: "crawl_running" })
      .eq("id", brandId);

    try {
      await insertAgentLog(userClient, {
        agentName: "start-brand-crawl",
        userId: auth.user.id,
        brandId,
        input: { sourceUrl, idempotencyKey, requestId },
        output: { crawlId: crawlRow.id, firecrawlJobId },
      });
    } catch (logErr) {
      console.warn("start-brand-crawl: agent log insert failed", logErr);
    }

    return jsonResponse({
      crawlId: crawlRow.id,
      firecrawlJobId,
      requestId,
      reused: false,
    });
  } catch (err) {
    console.error("start-brand-crawl error:", err);
    return errorResponse("internal_error", safeErrorMessage(err), 500);
  }
});
