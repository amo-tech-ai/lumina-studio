import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";
import { errorResponse, safeErrorMessage } from "../_shared/response.ts";

export const MAX_PAYLOAD_BYTES = 32_768;
export const RATE_LIMIT_WINDOW_MS = 60_000;
export const RATE_LIMIT_MAX = 10;
export const CLAIM_TOKEN_EXPIRY_DAYS = 7;

const MAX_ANON_ID = 128;
const MAX_EMAIL = 254;
const MAX_MESSAGE = 4_000;
const MAX_FIELD = 500;
const MAX_ANSWERS_KEYS = 40;

export const ALLOWED_SERVICE_SLUGS = [
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

export interface LeadPayload {
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

/** Reset in-memory rate store (tests only). */
export function resetRateLimitStoreForTests(): void {
  rateStore.clear();
}

export function rateLimitKey(anonId: string, ip: string): string {
  const salt = Deno.env.get("RATE_LIMIT_SALT") ?? "ipix-rl-salt";
  const data = new TextEncoder().encode(`${anonId}:${ip}:${salt}`);
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data[i];
    hash |= 0;
  }
  return String(hash);
}

export function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
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

/**
 * Origin = defense-in-depth only.
 * Primary auth is CAPTURE_LEAD_PROXY_SECRET (required for all writes).
 * When ALLOWED_ORIGINS is unset: allow (proxy secret already required).
 * When set: require Origin match. Trusted proxy often omits Origin — skip if absent.
 */
export function validateOrigin(req: Request): boolean {
  const allowed = Deno.env.get("ALLOWED_ORIGINS");
  if (!allowed) return true;
  const origin = req.headers.get("origin") ?? "";
  if (!origin) return true; // server-to-server proxy
  return allowed.split(",").some((o) => o.trim() === origin);
}

export function isTrustedProxy(req: Request): boolean {
  const proxySecret = Deno.env.get("CAPTURE_LEAD_PROXY_SECRET");
  const incomingSecret = req.headers.get("x-ipix-proxy-secret");
  return !!proxySecret && incomingSecret === proxySecret;
}

function tooLong(value: string, max: number): boolean {
  return value.length > max;
}

/** PostgREST rejects non-UUID for `p_conversation_id uuid`; treat bad/stale ids as unset. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalizeConversationId(
  value: unknown,
): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || !UUID_RE.test(trimmed)) return undefined;
  return trimmed;
}

export function validatePayload(data: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];

  if (typeof data.anon_id !== "string" || data.anon_id.length < 1) {
    errors.push("anon_id is required");
  } else if (tooLong(data.anon_id, MAX_ANON_ID)) {
    errors.push(`anon_id exceeds ${MAX_ANON_ID} characters`);
  }

  if (typeof data.email !== "string") {
    errors.push("email is required");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push("email must be a valid email address");
  } else if (tooLong(data.email, MAX_EMAIL)) {
    errors.push(`email exceeds ${MAX_EMAIL} characters`);
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
  } else if (tooLong(data.message_summary, MAX_MESSAGE)) {
    errors.push(`message_summary exceeds ${MAX_MESSAGE} characters`);
  }

  if (
    data.lead_answers !== undefined &&
    data.lead_answers !== null &&
    typeof data.lead_answers !== "object"
  ) {
    errors.push("lead_answers must be an object");
  } else if (data.lead_answers !== undefined && data.lead_answers !== null) {
    const entries = Object.entries(data.lead_answers as Record<string, unknown>);
    if (entries.length > MAX_ANSWERS_KEYS) {
      errors.push(`lead_answers exceeds ${MAX_ANSWERS_KEYS} keys`);
    }
    if (!entries.every(([, v]) => typeof v === "string")) {
      errors.push("lead_answers values must all be strings");
    } else if (
      entries.some(([, v]) => tooLong(v as string, MAX_FIELD))
    ) {
      errors.push(`lead_answers values must be ≤ ${MAX_FIELD} characters`);
    }
  }

  if (data.budget !== undefined && data.budget !== null) {
    if (typeof data.budget !== "string") {
      errors.push("budget must be a string");
    } else if (tooLong(data.budget, MAX_FIELD)) {
      errors.push(`budget exceeds ${MAX_FIELD} characters`);
    }
  }

  if (data.timeline !== undefined && data.timeline !== null) {
    if (typeof data.timeline !== "string") {
      errors.push("timeline must be a string");
    } else if (tooLong(data.timeline, MAX_FIELD)) {
      errors.push(`timeline exceeds ${MAX_FIELD} characters`);
    }
  }

  if (data.brand_url !== undefined && data.brand_url !== null) {
    if (typeof data.brand_url !== "string") {
      errors.push("brand_url must be a string");
    } else if (tooLong(data.brand_url, MAX_FIELD)) {
      errors.push(`brand_url exceeds ${MAX_FIELD} characters`);
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
      // Invalid/non-UUID ids → undefined (RPC gets null; same as previous “no match” path)
      conversation_id: normalizeConversationId(data.conversation_id),
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

export async function handleCaptureLead(req: Request): Promise<Response> {
  const cors = handleCors(req);
  if (cors) return cors;

  const started = performance.now();

  try {
    if (req.method !== "POST") {
      return errorResponse("method_not_allowed", "Use POST", 405);
    }

    // Primary auth: proxy secret required for ALL writes (not only claimToken).
    const proxySecret = Deno.env.get("CAPTURE_LEAD_PROXY_SECRET");
    if (!proxySecret) {
      return errorResponse(
        "misconfigured",
        "CAPTURE_LEAD_PROXY_SECRET is not configured",
        503,
      );
    }
    if (!isTrustedProxy(req)) {
      return errorResponse("unauthorized", "Invalid or missing proxy secret", 401);
    }

    if (!validateOrigin(req)) {
      return errorResponse("forbidden", "Origin not allowed", 403);
    }

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

    const supabase = createServiceClient();
    const { data: rpcData, error: rpcErr } = await supabase.rpc("capture_lead_write", {
      p_anon_id: payload.anon_id,
      p_conversation_id: payload.conversation_id ?? null,
      p_message_summary: payload.message_summary,
      p_service_interest: payload.service_interest,
      p_answers: answers,
      p_claim_token: claimToken,
      p_claim_expires_at: claimExpires,
    });

    if (rpcErr || !rpcData) {
      throw new Error(rpcErr?.message ?? "capture_lead_write failed");
    }

    const result = rpcData as { draft_id?: string; conversation_id?: string };
    const draftId = result.draft_id;
    const conversationId = result.conversation_id;
    if (!draftId) throw new Error("capture_lead_write missing draft_id");

    const durationMs = Math.round(performance.now() - started);
    console.log(
      `[capture-lead] draft=${draftId} conv=${conversationId} service=${payload.service_interest} ms=${durationMs}`,
    );

    // Trusted proxy only reaches here — always return claimToken.
    return new Response(
      JSON.stringify({ draftId, status: "ready", claimToken }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (err) {
    console.error("capture-lead error:", err instanceof Error ? err.message : err);
    return errorResponse("internal_error", safeErrorMessage(err), 500);
  }
}
