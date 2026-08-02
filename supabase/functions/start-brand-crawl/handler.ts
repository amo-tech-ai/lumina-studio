import { insertAgentLog } from "../_shared/agent-log.ts";
import { handleCors } from "../_shared/cors.ts";
import { getOptionalSecret } from "../_shared/env.ts";
import { firecrawlStartCrawl } from "../_shared/firecrawl.ts";
import {
  errorResponse,
  jsonResponse,
  safeErrorMessage,
} from "../_shared/response.ts";
import { isCallerFailure, resolveCaller } from "../_shared/resolve-caller.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

const CRAWL_LIMIT = 10;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type StartBody = {
  brandId?: string;
  url?: string;
  websiteUrl?: string;
  idempotencyKey?: string;
  workflowId?: string;
  requestId?: string;
  /** Required on the trusted service-role path (IPI-817). Ignored for user JWT. */
  actorId?: string;
};

type BrandRow = {
  id: string;
  brand_url: string | null;
  org_id: string | null;
  user_id: string | null;
};

export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("url or websiteUrl is required");
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error("URL must start with http:// or https://");
  }
  return trimmed;
}

const ACTIVE_CRAWL_STATUSES = ["queued", "running", "complete"] as const;

async function findActiveCrawl(
  admin: ReturnType<typeof createServiceClient>,
  brandId: string,
  idempotencyKey: string,
) {
  const { data, error } = await admin
    .from("brand_crawls")
    .select("id, firecrawl_job_id, job_status")
    .eq("brand_id", brandId)
    .eq("idempotency_key", idempotencyKey)
    .in("job_status", [...ACTIVE_CRAWL_STATUSES])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Service-role callers bypass RLS — authorize the explicit actorId the same way
 * validate-brand does (org owner/editor, or personal-brand owner).
 */
async function authorizeActorForBrand(
  admin: SupabaseClient,
  brandId: string,
  actorId: string,
): Promise<{ brand: BrandRow } | { response: Response }> {
  const { data: brand, error: brandErr } = await admin
    .from("brands")
    .select("id, brand_url, org_id, user_id")
    .eq("id", brandId)
    .maybeSingle();

  if (brandErr) throw new Error(brandErr.message);
  if (!brand) {
    return {
      response: errorResponse("not_found", "Brand not found or access denied", 404),
    };
  }

  if (brand.org_id) {
    const { data: member, error: memberErr } = await admin
      .from("org_members")
      .select("role")
      .eq("org_id", brand.org_id)
      .eq("user_id", actorId)
      .maybeSingle();
    if (memberErr) throw new Error(memberErr.message);
    if (!member || !["owner", "editor"].includes(member.role as string)) {
      return {
        response: errorResponse(
          "forbidden",
          "Not authorized to start a crawl for this brand",
          403,
        ),
      };
    }
  } else if (brand.user_id !== actorId) {
    return {
      response: errorResponse(
        "forbidden",
        "Not authorized to start a crawl for this brand",
        403,
      ),
    };
  }

  return { brand: brand as BrandRow };
}

/** HTTP handler — exported for Deno unit tests (IPI-686 / IPI-817). */
export async function handleStartBrandCrawl(req: Request): Promise<Response> {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") {
    return errorResponse("method_not_allowed", "Use POST", 405);
  }

  if (!getOptionalSecret("FIRECRAWL_API_KEY")) {
    return errorResponse("config_error", "Firecrawl is not configured", 503);
  }

  try {
    // Dual-auth: user JWT (compat) OR service-role + body.actorId (trusted workflow).
    // resolveCaller already matches brand-intelligence / audit-asset-dna — service-role
    // JWTs pass verify_jwt=true at the gateway on this project.
    const caller = await resolveCaller(req);
    if (isCallerFailure(caller)) return caller.response;

    let body: StartBody;
    try {
      body = (await req.json()) as StartBody;
    } catch {
      return errorResponse("invalid_request", "Invalid JSON body", 400);
    }
    const brandId = body.brandId?.trim();

    if (!brandId) {
      return errorResponse("invalid_request", "brandId is required", 400);
    }

    let sourceUrl: string;
    try {
      sourceUrl = normalizeUrl(body.url ?? body.websiteUrl ?? "");
    } catch (urlErr) {
      return errorResponse(
        "invalid_request",
        safeErrorMessage(urlErr),
        400,
      );
    }

    const admin = createServiceClient();
    let startedBy: string;
    let logClient: SupabaseClient;

    if (caller.userId === null) {
      // Trusted service-role path — actorId is the verified operator from the app boundary.
      const actorId = body.actorId?.trim();
      if (!actorId || !UUID_RE.test(actorId)) {
        return errorResponse(
          "invalid_request",
          "actorId must be a valid UUID when using the service-role credential",
          400,
        );
      }
      const authz = await authorizeActorForBrand(admin, brandId, actorId);
      if ("response" in authz) return authz.response;
      startedBy = actorId;
      logClient = admin;
    } else {
      // User JWT path — RLS on brands enforces visibility; started_by is the JWT subject.
      const { data: brand, error: brandErr } = await caller.client
        .from("brands")
        .select("id, brand_url, org_id, user_id")
        .eq("id", brandId)
        .single();

      if (brandErr || !brand) {
        return errorResponse("not_found", "Brand not found or access denied", 404);
      }
      startedBy = caller.userId;
      logClient = caller.client;
    }

    const idempotencyKey =
      body.idempotencyKey?.trim() ||
      `onboarding-${brandId}-${sourceUrl}`;

    const existing = await findActiveCrawl(admin, brandId, idempotencyKey);

    if (
      existing &&
      (existing.job_status === "running" ||
        existing.job_status === "complete" ||
        existing.firecrawl_job_id)
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

    let crawlRowId: string;

    if (existing?.job_status === "queued" && !existing.firecrawl_job_id) {
      crawlRowId = existing.id;
      const { error: resetErr } = await admin
        .from("brand_crawls")
        .update({
          source_url: sourceUrl,
          request_id: requestId,
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", crawlRowId);
      if (resetErr) throw new Error(resetErr.message);
    } else {
      const { data: crawlRow, error: insertErr } = await admin
        .from("brand_crawls")
        .insert({
          brand_id: brandId,
          source_url: sourceUrl,
          job_status: "queued",
          pipeline_state: "crawl_only",
          idempotency_key: idempotencyKey,
          // Never the service-role UUID — always the verified operator (IPI-817).
          started_by: startedBy,
          workflow_id: body.workflowId?.trim() || null,
          request_id: requestId,
          started_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (insertErr || !crawlRow?.id) {
        if (insertErr?.code === "23505") {
          const dup = await findActiveCrawl(admin, brandId, idempotencyKey);
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
      crawlRowId = crawlRow.id;
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrl) throw new Error("SUPABASE_URL missing");

    const webhookUrl = `${supabaseUrl}/functions/v1/firecrawl-webhook`;

    let firecrawlJobId: string;
    try {
      ({ id: firecrawlJobId } = await firecrawlStartCrawl({
        url: sourceUrl,
        limit: CRAWL_LIMIT,
        maxDiscoveryDepth: 1,
        formats: ["markdown"],
        webhook: {
          url: webhookUrl,
          metadata: {
            brand_id: brandId,
            crawl_id: crawlRowId,
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
        .eq("id", crawlRowId);
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
      .eq("id", crawlRowId);

    if (updateErr) throw new Error(updateErr.message);

    await admin
      .from("brands")
      .update({ intake_status: "crawl_running" })
      .eq("id", brandId);

    try {
      await insertAgentLog(logClient, {
        agentName: "start-brand-crawl",
        userId: startedBy,
        brandId,
        input: { sourceUrl, idempotencyKey, requestId },
        output: { crawlId: crawlRowId, firecrawlJobId },
      });
    } catch (logErr) {
      console.warn("start-brand-crawl: agent log insert failed", logErr);
    }

    return jsonResponse({
      crawlId: crawlRowId,
      firecrawlJobId,
      requestId,
      reused: false,
    });
  } catch (err) {
    console.error("start-brand-crawl error:", err);
    return errorResponse("internal_error", safeErrorMessage(err), 500);
  }
}
