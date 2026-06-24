import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";
import { getEdgeEnv } from "../_shared/env.ts";
import { errorResponse, safeErrorMessage } from "../_shared/response.ts";

const MAX_PAYLOAD_BYTES = 32_768;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const CLAIM_TOKEN_EXPIRY_DAYS = 7;

const ALLOWED_SERVICE_SLUGS = [
  "fashion-photography",
  "ecommerce-photography",
  "clothing",
  "amazon",
  "jewellery",
  "instagram",
  "video",
  "shopify",
  "location",
  "general",
] as const;

type ServiceSlug = typeof ALLOWED_SERVICE_SLUGS[number];

interface LeadPayload {
  anon_id: string;
  conversation_id?: string;
  message_summary: string;
  lead_answers: Record<string, string>;
  service_interest: ServiceSlug;
  budget?: string;
  timeline?: string;
  email: string;
  brand_url?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  payload?: LeadPayload;
}

const rateStore = new Map<string, { count: number; resetAt: number }>();

function rateLimitKey(anonId: string, ip: string): string {
  const salt = Deno.env.get("RATE_LIMIT_SALT") ?? "ipix-rl-salt";
  const data = new TextEncoder().encode(`${anonId}:${ip}:${salt}`);
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data[i];
    hash |= 0;
  }
  return String(hash);
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateStore.get(key);
  if (!entry || now > entry.resetAt) {
    rateStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }
  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count };
}

function validateOrigin(req: Request): boolean {
  const allowed = Deno.env.get("ALLOWED_ORIGINS");
  if (!allowed) return true;
  const origin = req.headers.get("origin") ?? "";
  if (!origin) return false;
  return allowed.split(",").some((o) => o.trim() === origin);
}

function validatePayload(data: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];

  if (typeof data.anon_id !== "string" || data.anon_id.length < 1) {
    errors.push("anon_id is required");
  }

  if (typeof data.email !== "string") {
    errors.push("email is required");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push("email must be a valid email address");
  }

  if (typeof data.service_interest !== "string") {
    errors.push("service_interest is required");
  } else if (
    !(ALLOWED_SERVICE_SLUGS as readonly string[]).includes(data.service_interest)
  ) {
    errors.push(`service_interest must be one of: ${ALLOWED_SERVICE_SLUGS.join(", ")}`);
  }

  if (typeof data.message_summary !== "string" || data.message_summary.length < 1) {
    errors.push("message_summary is required");
  }

  if (
    data.lead_answers !== undefined &&
    data.lead_answers !== null &&
    typeof data.lead_answers !== "object"
  ) {
    errors.push("lead_answers must be an object");
  } else if (data.lead_answers !== undefined && data.lead_answers !== null) {
    const vals = Object.values(data.lead_answers as Record<string, unknown>);
    if (!vals.every((v) => typeof v === "string")) {
      errors.push("lead_answers values must all be strings");
    }
  }

  if (data.budget !== undefined && data.budget !== null && typeof data.budget !== "string") {
    errors.push("budget must be a string");
  }

  if (data.timeline !== undefined && data.timeline !== null && typeof data.timeline !== "string") {
    errors.push("timeline must be a string");
  }

  if (data.brand_url !== undefined && data.brand_url !== null) {
    if (typeof data.brand_url !== "string") {
      errors.push("brand_url must be a string");
    } else {
      try {
        new URL(data.brand_url);
      } catch {
        errors.push("brand_url must be a valid URL");
      }
    }
  }

  if (
    data.conversation_id !== undefined &&
    data.conversation_id !== null &&
    typeof data.conversation_id !== "string"
  ) {
    errors.push("conversation_id must be a string");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    payload: {
      anon_id: data.anon_id as string,
      conversation_id: data.conversation_id as string | undefined,
      message_summary: data.message_summary as string,
      lead_answers: (data.lead_answers as Record<string, string>) ?? {},
      service_interest: data.service_interest as ServiceSlug,
      budget: data.budget as string | undefined,
      timeline: data.timeline as string | undefined,
      email: (data.email as string).trim().toLowerCase(),
      brand_url: data.brand_url as string | undefined,
    },
  };
}

console.info("capture-lead function started");

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const started = performance.now();

  try {
    if (req.method !== "POST") {
      return errorResponse("method_not_allowed", "Use POST", 405);
    }

    if (!validateOrigin(req)) {
      return errorResponse("forbidden", "Origin not allowed", 403);
    }

    // Proxy secret check — claimToken only returned to trusted internal proxy
    const proxySecret = Deno.env.get("CAPTURE_LEAD_PROXY_SECRET");
    const incomingSecret = req.headers.get("x-ipix-proxy-secret");
    const isTrustedProxy = !!proxySecret && incomingSecret === proxySecret;

    const contentLength = parseInt(req.headers.get("content-length") ?? "0", 10);
    if (contentLength > MAX_PAYLOAD_BYTES) {
      return errorResponse("payload_too_large", "Payload exceeds 32KB limit", 413);
    }

    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    let raw: Record<string, unknown>;
    try {
      raw = await req.json();
    } catch {
      return errorResponse("invalid_json", "Request body must be valid JSON", 422);
    }

    // Fallback size check when content-length header is absent
    if (JSON.stringify(raw).length > MAX_PAYLOAD_BYTES) {
      return errorResponse("payload_too_large", "Payload exceeds 32KB limit", 413);
    }

    const validation = validatePayload(raw);
    if (!validation.valid) {
      return errorResponse("validation_error", validation.errors.join("; "), 422);
    }
    const payload = validation.payload!;

    const rlKey = rateLimitKey(payload.anon_id, clientIp);
    const rl = checkRateLimit(rlKey);
    if (!rl.allowed) {
      return errorResponse("rate_limited", "Too many requests. Try again later.", 429);
    }

    const supabase = createServiceClient();
    let conversationId = payload.conversation_id;

    if (conversationId) {
      // Verify conversation belongs to this anon_id to prevent cross-session attachment
      const { count, error: convErr } = await supabase
        .from("chatbot_conversations")
        .select("*", { count: "exact", head: true })
        .eq("id", conversationId)
        .eq("anon_id", payload.anon_id);

      if (convErr || !count) {
        conversationId = undefined;
      }
    }

    if (!conversationId) {
      const { data: conv, error: convErr } = await supabase
        .from("chatbot_conversations")
        .insert({ anon_id: payload.anon_id })
        .select("id")
        .single();

      if (convErr || !conv) {
        throw new Error("Failed to create conversation");
      }
      conversationId = conv.id;
    }

    const { error: msgErr } = await supabase
      .from("chatbot_messages")
      .insert({
        conversation_id: conversationId,
        role: "user",
        content: payload.message_summary,
      });

    if (msgErr) {
      throw new Error("Failed to insert message");
    }

    const { error: evtErr } = await supabase
      .from("chatbot_events")
      .insert({
        conversation_id: conversationId,
        type: "lead_captured",
        payload: { service_interest: payload.service_interest },
      });

    if (evtErr) {
      console.error("Failed to insert event:", evtErr.message);
    }

    const claimToken = crypto.randomUUID();
    const claimExpires = new Date(
      Date.now() + CLAIM_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();

    const answers: Record<string, unknown> = {
      ...payload.lead_answers,
      email: payload.email,
      service_interest: payload.service_interest,
    };
    if (payload.budget) answers.budget = payload.budget;
    if (payload.timeline) answers.timeline = payload.timeline;
    if (payload.brand_url) answers.brand_url = payload.brand_url;

    // Idempotency: update existing draft for this conversation rather than creating duplicates
    const { data: existing } = await supabase
      .from("lead_intake_drafts")
      .select("id")
      .eq("conversation_id", conversationId)
      .maybeSingle();

    let draftId: string;
    if (existing) {
      const { error: updateErr } = await supabase
        .from("lead_intake_drafts")
        .update({
          status: "ready",
          answers,
          claim_token: claimToken,
          claim_token_expires_at: claimExpires,
        })
        .eq("id", existing.id);

      if (updateErr) throw new Error("Failed to update lead draft");
      draftId = existing.id;
    } else {
      const { data: draft, error: draftErr } = await supabase
        .from("lead_intake_drafts")
        .insert({
          conversation_id: conversationId,
          status: "ready",
          answers,
          claim_token: claimToken,
          claim_token_expires_at: claimExpires,
        })
        .select("id")
        .single();

      if (draftErr || !draft) throw new Error("Failed to create lead draft");
      draftId = draft.id;
    }

    const durationMs = Math.round(performance.now() - started);
    console.log(
      `[capture-lead] draft=${draftId} conv=${conversationId} service=${payload.service_interest} ms=${durationMs}`,
    );

    // claimToken returned only to trusted proxy — public callers get draftId only
    const responseBody: Record<string, string> = { draftId, status: "ready" };
    if (isTrustedProxy) responseBody.claimToken = claimToken;

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.error("capture-lead error:", err instanceof Error ? err.message : err);
    return errorResponse("internal_error", safeErrorMessage(err), 500);
  }
});
