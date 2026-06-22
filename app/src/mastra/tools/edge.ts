// The ONLY durable-write surface for agent tools (IPI2-84, no-silent-writes).
//
// Mastra tools must NEVER write Supabase tables directly. WRITE tools POST to a
// Supabase Edge Function through callEdgeFunction(), which enforces auth +
// HITL/self-approval at the DB boundary (the IPI2-116 pattern). READ tools MAY
// query Supabase with an RLS-scoped client directly, or hit a public API (like
// weatherTool) — reads don't need the edge layer.

export class EdgeFunctionError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "EdgeFunctionError";
  }
}

/** Base URL for Supabase Edge Functions, or undefined if not configured. */
export function resolveFunctionsUrl(): string | undefined {
  const explicit = process.env.SUPABASE_FUNCTIONS_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base ? `${base.replace(/\/$/, "")}/functions/v1` : undefined;
}

/**
 * POST to a Supabase Edge Function — the single durable-write path for agent tools.
 * Fails closed: throws if the functions URL is not configured, so a write can never
 * silently no-op. Pass the authenticated user's access token (IPI2-127); falls back
 * to the anon key only for unauthenticated/dev calls.
 */
export async function callEdgeFunction<T = unknown>(
  name: string,
  payload: unknown,
  opts: { accessToken?: string } = {},
): Promise<T> {
  const baseUrl = resolveFunctionsUrl();
  if (!baseUrl) {
    throw new EdgeFunctionError(
      `Supabase Edge Functions URL is not configured — cannot call "${name}". ` +
        "Set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_FUNCTIONS_URL). Agent tools must not " +
        "write durable data any other way (no silent writes).",
    );
  }

  const anonKey = process.env.SUPABASE_ANON_KEY;
  const token = opts.accessToken ?? anonKey;

  const res = await fetch(`${baseUrl}/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(anonKey ? { apikey: anonKey } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload ?? {}),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new EdgeFunctionError(
      `Edge function "${name}" failed (HTTP ${res.status})` +
        (detail ? `: ${detail.slice(0, 200)}` : ""),
      res.status,
    );
  }
  return (await res.json()) as T;
}
