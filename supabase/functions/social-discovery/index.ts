// IPI-27 — social-discovery edge function
// Accepts POST { brandId, channels[], status?, error? } from the Mastra social-discovery tool,
// upserts brand_social_channels, and logs the run to brand_agent_results.
// Auth: user JWT or service-role key (server-to-server from Mastra tools).

import { handleCors } from "../_shared/cors.ts";
import { errorResponse, jsonResponse, safeErrorMessage } from "../_shared/response.ts";
import { isAuthFailure, resolveAuth } from "../_shared/auth.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";
import { getEdgeEnv } from "../_shared/env.ts";

const SUPPORTED_PLATFORMS = new Set([
  "instagram", "tiktok", "youtube", "pinterest", "linkedin", "facebook", "x",
]);

type Channel = {
  platform: string;
  url: string | null;
  handle: string | null;
  verified: boolean;
  verification_reason: string;
  content_themes: string[];
  posting_frequency: string | null;
};

type RequestBody = {
  brandId: string;
  channels: Channel[];
  startedAt?: string;
  status?: "complete" | "failed";
  error?: string;
};

function isServiceRoleRequest(req: Request): boolean {
  const token = req.headers.get("Authorization")?.slice(7)?.trim();
  if (!token) return false;
  const { serviceRoleKey } = getEdgeEnv();
  return token === serviceRoleKey;
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  // Service-role Bearer bypasses user-JWT validation (trusted server-to-server call)
  if (!isServiceRoleRequest(req)) {
    const authResult = await resolveAuth(req, { required: true });
    if (isAuthFailure(authResult)) return authResult.response;
  }

  try {
    const body: RequestBody = await req.json();
    const { brandId, channels = [], startedAt, status: upstreamStatus, error: upstreamError } = body;

    if (!brandId || typeof brandId !== "string") {
      return errorResponse("invalid_input", "brandId is required", 400);
    }

    const admin = createServiceClient();
    const completedAt = new Date().toISOString();

    // Validate platforms and build upsert rows
    const rows = channels
      .filter((ch) => SUPPORTED_PLATFORMS.has(ch.platform))
      .map((ch) => ({
        brand_id: brandId,
        platform: ch.platform,
        url: ch.url,
        handle: ch.handle,
        verified: ch.verified,
        bio: ch.verification_reason,
        content_themes: ch.content_themes ?? [],
        posting_frequency: ch.posting_frequency,
        discovered_at: completedAt,
      }));

    // Use upstream status when provided (e.g. Gemini failure with 0 rows)
    let status: "complete" | "failed" = upstreamStatus ?? "complete";
    let errorMessage: string | undefined = upstreamError;

    if (rows.length > 0) {
      const { error: upsertErr } = await admin
        .from("brand_social_channels")
        .upsert(rows, { onConflict: "brand_id,platform" });

      if (upsertErr) {
        status = "failed";
        errorMessage = `brand_social_channels upsert failed: ${upsertErr.message}`;
      }
    }

    // Log run regardless of upsert outcome
    await admin.from("brand_agent_results").insert({
      brand_id: brandId,
      agent_name: "social-discovery",
      status,
      output: {
        channels_found: rows.length,
        ...(errorMessage ? { error: errorMessage } : {}),
      },
      started_at: startedAt ?? completedAt,
      completed_at: completedAt,
    });

    if (status === "failed") {
      return errorResponse("upsert_failed", errorMessage ?? "upsert failed", 500);
    }

    return jsonResponse({ success: true, count: rows.length });
  } catch (err) {
    return errorResponse("internal_error", safeErrorMessage(err), 500);
  }
});
