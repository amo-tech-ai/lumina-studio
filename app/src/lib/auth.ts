import { createClient } from "@supabase/supabase-js";

// IPI2-127 (AIOR-002b) — resolve the authenticated operator identity for the
// CopilotKit/Mastra runtime. Validates the Supabase access token SERVER-SIDE
// (never trusts client-provided ids), fails CLOSED in production, and returns a
// clearly-marked demo identity ONLY outside production for local work.

export type OperatorUser = { id: string; email?: string; name: string };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Extract a Supabase access token from a request: `Authorization: Bearer <jwt>`
 * first, then the `sb-<ref>-auth-token` session cookie (base64-encoded JSON).
 */
export function extractAccessToken(request: Request): string | undefined {
  const authHeader = request.headers.get("authorization");
  if (authHeader && /^Bearer\s+/i.test(authHeader)) {
    return authHeader.replace(/^Bearer\s+/i, "").trim() || undefined;
  }
  const cookie = request.headers.get("cookie");
  if (!cookie) return undefined;
  // Supabase stores the session as base64 JSON in sb-<ref>-auth-token (may be chunked .0/.1).
  const match = cookie.match(/sb-[^=;]*-auth-token(?:\.0)?=([^;]+)/);
  if (!match) return undefined;
  try {
    let raw = decodeURIComponent(match[1]);
    if (raw.startsWith("base64-")) raw = atob(raw.slice("base64-".length));
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed[0] : parsed?.access_token;
  } catch {
    return undefined;
  }
}

/**
 * Resolve the operator identity for the runtime. Throws in production when no
 * valid Supabase session is present (fail-closed); never silently anonymous.
 */
export async function resolveOperatorUser(request: Request): Promise<OperatorUser> {
  const token = extractAccessToken(request);

  if (token && SUPABASE_URL && SUPABASE_ANON_KEY) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data.user) {
      const meta = data.user.user_metadata as { name?: string } | undefined;
      return {
        id: data.user.id,
        email: data.user.email ?? undefined,
        name: meta?.name ?? data.user.email ?? data.user.id,
      };
    }
  }

  // Dev-only fallback (explicitly guarded). Production fails closed.
  if (process.env.NODE_ENV !== "production") {
    return { id: "demo-user", name: "Demo User (dev fallback)" };
  }
  throw new Error(
    "IPI2-127: unauthenticated — no valid Supabase session for the operator runtime (failing closed).",
  );
}
