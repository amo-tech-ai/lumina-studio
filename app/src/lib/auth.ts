import { createClient } from "@supabase/supabase-js";

// IPI2-127 (AIOR-002b) — resolve the authenticated operator identity for the
// CopilotKit/Mastra runtime. Validates the Supabase access token SERVER-SIDE
// (never trusts client-provided ids), fails CLOSED in production, and returns a
// clearly-marked demo identity ONLY outside production for local work.

export type OperatorUser = { id: string; email?: string; name: string };

function readSupabaseEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || undefined,
    anonKey:
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      undefined,
  };
}

/**
 * Extract a Supabase access token from a request: `Authorization: Bearer <jwt>`
 * first, then the `sb-<ref>-auth-token` session cookie (base64-encoded JSON).
 */
export function extractAccessToken(request: Request): string | undefined {
  const authHeader = request.headers.get("authorization");
  if (authHeader && /^Bearer\s+/i.test(authHeader)) {
    return authHeader.replace(/^Bearer\s+/i, "").trim() || undefined;
  }
  return accessTokenFromCookieString(request.headers.get("cookie"));
}

/**
 * Extract the Supabase access token from a Cookie header string. Large sessions
 * are split across numbered chunks (`sb-<ref>-auth-token.0` / `.1` / …); collect
 * and concatenate every chunk in order before base64/JSON decoding.
 */
export function accessTokenFromCookieString(
  cookie: string | null,
): string | undefined {
  if (!cookie) return undefined;
  const chunks: Array<{ idx: number; value: string }> = [];
  for (const m of cookie.matchAll(/sb-[^=;]*-auth-token(?:\.(\d+))?=([^;]+)/g)) {
    chunks.push({ idx: m[1] === undefined ? 0 : Number(m[1]), value: m[2] });
  }
  if (chunks.length === 0) return undefined;
  chunks.sort((a, b) => a.idx - b.idx);
  try {
    let raw = chunks.map((c) => decodeURIComponent(c.value)).join("");
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
  const { url: supabaseUrl, anonKey: supabaseAnonKey } = readSupabaseEnv();

  if (token && supabaseUrl && supabaseAnonKey) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
