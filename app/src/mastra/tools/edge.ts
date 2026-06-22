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

const DEFAULT_TIMEOUT_MS = 30_000;

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
 * to the anon key only for unauthenticated/dev calls. Aborts after `timeoutMs`
 * (default 30s). Returns `undefined` for 204 / empty-body responses (no JSON crash).
 */
export async function callEdgeFunction<T = unknown>(
  name: string,
  payload: unknown,
  opts: { accessToken?: string; timeoutMs?: number } = {},
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
  // Treat an empty/whitespace token as absent so it falls back to the anon key.
  const token = opts.accessToken?.trim() || anonKey;

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    opts.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(anonKey ? { apikey: anonKey } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload ?? {}),
      signal: controller.signal,
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    throw new EdgeFunctionError(
      `Edge function "${name}" request ${aborted ? "timed out" : "failed"}: ` +
        (err instanceof Error ? err.message : String(err)),
    );
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new EdgeFunctionError(
      `Edge function "${name}" failed (HTTP ${res.status})` +
        (detail ? `: ${detail.slice(0, 200)}` : ""),
      res.status,
    );
  }

  // Handle empty / 204 No Content bodies — res.json() would throw on those.
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}
