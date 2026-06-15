import { supabase } from "@/lib/supabase";

export type EdgeInvokeResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

type EdgeEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code: string; message: string };
};

function parseEnvelope<T>(body: unknown): EdgeInvokeResult<T> {
  if (!body || typeof body !== "object") {
    return {
      ok: false,
      error: { code: "invalid_response", message: "Empty edge response" },
    };
  }

  const envelope = body as EdgeEnvelope<T>;
  if (envelope.ok === true && envelope.data !== undefined) {
    return { ok: true, data: envelope.data };
  }
  if (envelope.ok === false && envelope.error) {
    return { ok: false, error: envelope.error };
  }

  return {
    ok: false,
    error: { code: "invalid_response", message: "Malformed edge response" },
  };
}

/** Invoke a Supabase edge function with the current session JWT. */
export async function invokeEdgeFunction<T>(
  name: string,
  body: Record<string, unknown> = {},
): Promise<EdgeInvokeResult<T>> {
  const { data, error } = await supabase.functions.invoke(name, { body });

  if (error) {
    return {
      ok: false,
      error: { code: "invoke_failed", message: error.message },
    };
  }

  return parseEnvelope<T>(data);
}

/** Public health ping — no auth required. */
export async function pingEdgeHealth(): Promise<
  EdgeInvokeResult<{ status: string; function: string; ts: string }>
> {
  return invokeEdgeFunction("health");
}

/** Authenticated foundation test — inserts one ai_agent_logs row. */
export async function runEdgeTest(): Promise<
  EdgeInvokeResult<{
    status: string;
    function: string;
    userId: string;
    logId: string;
    durationMs: number;
  }>
> {
  return invokeEdgeFunction("edge-test");
}
