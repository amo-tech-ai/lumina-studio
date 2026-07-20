/**
 * IPI-586 · CF-AI-003 — Prove one Workers AI call through native `ipix-prod` gateway.
 *
 * Production AI path (`provider.ts` → custom ai-gateway Worker) is untouched.
 * Disabled by default via ENABLE_CF_AI_SMOKE=false; enable only for preview proof.
 */
import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

const GATEWAY_ID = "ipix-prod";
const SMOKE_MODEL = "@cf/moonshotai/kimi-k2.6";
const SMOKE_PROMPT = "Fixed server smoke";
const RUN_TIMEOUT_MS = 15_000;
const LOG_POLL_ATTEMPTS = 4;
const LOG_POLL_DELAY_MS = 400;

type AiBinding = {
  run: (
    model: string,
    input: { prompt: string },
    options?: { gateway?: { id: string; skipCache?: boolean } },
  ) => Promise<unknown>;
  aiGatewayLogId?: string | null;
  gateway?: (id: string) => {
    getLog: (logId: string) => Promise<unknown>;
  };
};

type SmokeEnv = {
  AI?: AiBinding;
  ENABLE_CF_AI_SMOKE?: string;
  INTERNAL_WEBHOOK_SECRET?: string;
};

function isSmokeEnabled(envFlag: string | undefined): boolean {
  // Wrangler binding wins (fail closed). process.env only when context has no flag.
  // Coerce: Wrangler/ProcessEnv literal-type the committed default as "false".
  const flag = envFlag ?? process.env.ENABLE_CF_AI_SMOKE;
  return String(flag) === "true";
}

function secretsEqual(provided: string, expected: string): boolean {
  // Hash to fixed 32-byte digests first — no length short-circuit (workers-best-practices).
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

function json(
  status: number,
  body: Record<string, unknown>,
  headers?: Record<string, string>,
) {
  return NextResponse.json(body, { status, headers });
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`AI.run timed out after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Workers AI text models usually return `{ response }` or a bare string. */
function extractGeneratedText(result: unknown): string {
  if (typeof result === "string") return result.trim();
  if (!result || typeof result !== "object") return "";
  const o = result as Record<string, unknown>;
  if (typeof o.response === "string") return o.response.trim();
  if (typeof o.text === "string") return o.text.trim();
  if (typeof o.result === "string") return o.result.trim();
  return "";
}

async function pollGatewayLog(
  ai: AiBinding,
  logId: string,
): Promise<{ ok: true; log: unknown } | { ok: false; error: string }> {
  let gateway: ReturnType<NonNullable<AiBinding["gateway"]>> | undefined;
  try {
    gateway = ai.gateway?.(GATEWAY_ID);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "gateway() failed",
    };
  }
  if (!gateway?.getLog) {
    return { ok: false, error: "gateway.getLog unavailable" };
  }

  let lastError = "log not ready";
  for (let i = 0; i < LOG_POLL_ATTEMPTS; i++) {
    try {
      const log = await gateway.getLog(logId);
      return { ok: true, log };
    } catch (err) {
      lastError = err instanceof Error ? err.message : "getLog failed";
      if (i < LOG_POLL_ATTEMPTS - 1) {
        await new Promise((r) => setTimeout(r, LOG_POLL_DELAY_MS));
      }
    }
  }
  return { ok: false, error: lastError };
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const cfRay = request.headers.get("cf-ray") ?? undefined;

  let env: SmokeEnv | undefined;
  try {
    const ctx = await getCloudflareContext({ async: true });
    env = ctx.env as SmokeEnv | undefined;
  } catch {
    // Node / Vitest — fall through; flag/secret still read from process.env
  }

  if (!isSmokeEnabled(env?.ENABLE_CF_AI_SMOKE)) {
    return json(404, { ok: false, error: "not_found", requestId, cfRay });
  }

  const expectedSecret =
    env?.INTERNAL_WEBHOOK_SECRET ?? process.env.INTERNAL_WEBHOOK_SECRET;
  if (!expectedSecret) {
    return json(500, {
      ok: false,
      error: "misconfigured",
      detail: "INTERNAL_WEBHOOK_SECRET missing",
      requestId,
      cfRay,
    });
  }

  const provided = request.headers.get("X-Internal-Secret");
  if (!provided || !secretsEqual(provided, expectedSecret)) {
    return json(401, { ok: false, error: "unauthorized", requestId, cfRay });
  }

  const ai = env?.AI;
  if (!ai?.run) {
    return json(503, {
      ok: false,
      error: "ai_binding_missing",
      detail: "env.AI unavailable — confirm wrangler AI binding + Worker runtime",
      requestId,
      cfRay,
    });
  }

  const started = Date.now();
  let runResult: unknown;
  try {
    runResult = await withTimeout(
      ai.run(
        SMOKE_MODEL,
        { prompt: SMOKE_PROMPT },
        { gateway: { id: GATEWAY_ID, skipCache: true } },
      ),
      RUN_TIMEOUT_MS,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI.run failed";
    const timedOut = message.includes("timed out");
    return json(timedOut ? 504 : 502, {
      ok: false,
      error: timedOut ? "timeout" : "ai_run_failed",
      detail: message,
      requestId,
      cfRay,
      latencyMs: Date.now() - started,
      gatewayId: GATEWAY_ID,
      model: SMOKE_MODEL,
    });
  }

  const latencyMs = Date.now() - started;
  const generatedText = extractGeneratedText(runResult);
  if (!generatedText) {
    return json(502, {
      ok: false,
      error: "empty_model_output",
      detail: "AI.run resolved but produced no usable text",
      requestId,
      cfRay,
      latencyMs,
      gatewayId: GATEWAY_ID,
      model: SMOKE_MODEL,
    });
  }

  const aiGatewayLogId =
    typeof ai.aiGatewayLogId === "string" && ai.aiGatewayLogId.length > 0
      ? ai.aiGatewayLogId
      : null;

  if (!aiGatewayLogId) {
    return json(502, {
      ok: false,
      error: "gateway_log_missing",
      detail: "AI.run succeeded but aiGatewayLogId was not provided",
      requestId,
      cfRay,
      latencyMs,
      gatewayId: GATEWAY_ID,
      model: SMOKE_MODEL,
      generatedTextLength: generatedText.length,
    });
  }

  const polled = await pollGatewayLog(ai, aiGatewayLogId);
  if (!polled.ok) {
    return json(502, {
      ok: false,
      error: "gateway_log_unconfirmed",
      detail: polled.error,
      requestId,
      cfRay,
      aiGatewayLogId,
      latencyMs,
      gatewayId: GATEWAY_ID,
      model: SMOKE_MODEL,
      generatedTextLength: generatedText.length,
      logPoll: { status: "pending", reason: polled.error },
    });
  }

  return json(200, {
    ok: true,
    requestId,
    cfRay,
    aiGatewayLogId,
    latencyMs,
    gatewayId: GATEWAY_ID,
    model: SMOKE_MODEL,
    generatedTextLength: generatedText.length,
    logPoll: { status: "ok", hasLog: true },
  });
}
