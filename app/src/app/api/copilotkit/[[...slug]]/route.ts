import { AsyncLocalStorage } from "node:async_hooks";
import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
  InMemoryAgentRunner,
} from "@/lib/copilotkit/runtime-v2-fetch";
import { MastraAgent } from "@ag-ui/mastra";
import { RequestContext } from "@mastra/core/request-context";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { pickCfEnv } from "@/lib/ai/cloudflare-models";
import { getMastra } from "@/mastra";
import { getMastraMemory, makeMemoryResourceId } from "@/mastra/memory";
import { getMastraStorage, MastraStorageUnavailableError } from "@/mastra/storage";
import { type OperatorUser, extractAccessToken } from "@/lib/auth";
import { isOperatorAuthEnforced, OperatorAuthError, withOperatorAuth } from "@/lib/operator-gate";
import { isCopilotIntelligenceEnvComplete, isCopilotKitThreadsEnabled } from "@/lib/copilotkit/intelligence-config";
import { requestToken } from "@/lib/request-token";
import { withStreamIdleTimeout } from "@/lib/copilotkit/stream-idle-timeout";
import { createUserScopedClient } from "@/lib/shoot/commit-shoot-draft";
import { getCurrentOrgId } from "@/lib/crm/queries";
import { rejectTenantKeyRewrite, TenantContextError } from "@/lib/db/mastra-tenant-scope";

// See stream-idle-timeout.ts for why this exists — bounds a stalled agent
// turn (e.g. a hung PostgresStore query) to a controlled RUN_ERROR instead
// of an indefinite hang.
const STREAM_IDLE_TIMEOUT_MS = 20_000;

// AsyncLocalStorage propagates the resolved operator identity through the
// entire async call-stack of a request — including agent factory callbacks that
// CopilotKit may invoke with a wrapped copy of the original Request object.
const _requestUser = new AsyncLocalStorage<OperatorUser>();

// IPI-146 · MASTRA-GOV-002 — org-scoped Mastra `resourceId`, resolved once per
// request in `handler()` (before `endpoint(request)` runs) and read by the
// `agents` factory below. Resolving it here — outside CopilotKit's internals —
// means a missing org fails the request with a clean 403 instead of whatever
// CopilotKit's own error handling would do with a thrown error from a factory
// callback it doesn't know how to interpret.
const _requestResourceId = new AsyncLocalStorage<string>();

const UNKNOWN_USER: OperatorUser = { id: "unknown", name: "unknown" };

/** Thrown when an authenticated operator has no organization membership, or
 *  when a request targets a thread owned by a different organization. Both
 *  are "fail closed" cases per IPI-146 — never fall back to a bare `user.id`. */
class MastraOrgScopeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MastraOrgScopeError";
  }
}

/**
 * Resolves the org-scoped Mastra `resourceId` for the authenticated operator.
 * Reuses the same `org_members` lookup as `/api/org/current`
 * (`app/src/app/api/org/current/route.ts`) and the same token-propagation
 * pattern already combined once in `getCrmUserClient()`
 * (`app/src/mastra/tools/crm/_shared.ts`) — no second org model, no new
 * Supabase client shape.
 *
 * Fails closed: throws `MastraOrgScopeError` when the operator has no
 * organization membership, rather than falling back to a bare `user.id`
 * (the pre-IPI-146 behavior, which isolated by user but not by org).
 */
async function resolveOrgScopedResourceId(user: OperatorUser, accessToken: string): Promise<string> {
  const client = createUserScopedClient(accessToken);
  const orgId = await getCurrentOrgId(user.id, client);
  if (!orgId) {
    throw new MastraOrgScopeError(`No organization membership for operator ${user.id}`);
  }
  return makeMemoryResourceId(orgId, user.id);
}

/**
 * IPI-146 · MASTRA-GOV-002 — thread ownership check. `RunAgentInput.threadId`
 * (AG-UI protocol, see `@ag-ui/core`) is client-supplied, so a forged or
 * cross-org `threadId` must be rejected before the agent turn runs — Mastra's
 * `Memory` does not enforce this itself (alpha `@mastra/memory` API; see
 * IPI-779 for the future upgrade, out of scope here).
 *
 * Migration strategy A (compat read, chosen over one-shot migrate/orphan —
 * see PR body): threads created before this change have `resourceId ===
 * user.id` (bare, not org-scoped). Those are still accepted when the caller
 * IS that same user — this doesn't weaken anything (bare-`user.id` scoping
 * was already the full guarantee those threads ever had), it just avoids
 * a data migration and avoids stranding every existing conversation on
 * deploy. Only brand-new threads get the stronger org-scoped guarantee.
 */
async function assertThreadOwnership(
  threadId: string,
  expectedResourceId: string,
  legacyUserId: string,
): Promise<void> {
  const thread = await getMastraMemory().getThreadById({ threadId });
  if (!thread) return; // No existing thread — Mastra will create one under expectedResourceId.
  if (thread.resourceId === legacyUserId) return; // Migration strategy A — see docstring above.
  rejectTenantKeyRewrite(thread.resourceId, expectedResourceId);
}

/** Extracts `threadId` from a CopilotKit `agent/run`-style POST body without
 *  consuming the original request stream (`request.clone()`), so `endpoint(request)`
 *  can still read it normally afterward. Returns undefined for anything that
 *  isn't a same-origin JSON POST with a non-blank string `threadId` — malformed
 *  bodies are left for CopilotKit's own parser to reject with the right error. */
async function extractThreadIdFromBody(request: Request): Promise<string | undefined> {
  if (request.method !== "POST") return undefined;
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return undefined;
  try {
    const body = (await request.clone().json()) as { threadId?: unknown } | null;
    const threadId = body?.threadId;
    return typeof threadId === "string" && threadId.trim() ? threadId : undefined;
  } catch {
    return undefined;
  }
}

if (!process.env.COPILOTKIT_LICENSE_TOKEN) {
  console.warn(
    "[copilotkit] COPILOTKIT_LICENSE_TOKEN not set — thread persistence disabled, each page load starts a fresh conversation",
  );
} else if (!isCopilotIntelligenceEnvComplete()) {
  console.warn(
    "[copilotkit] COPILOTKIT_LICENSE_TOKEN set but Intelligence vars incomplete — threads disabled until INTELLIGENCE_API_KEY, INTELLIGENCE_API_URL, INTELLIGENCE_GATEWAY_WS_URL are set",
  );
} else if (!isCopilotKitThreadsEnabled()) {
  console.warn(
    "[copilotkit] Intelligence env complete but CopilotKitIntelligence not wired in runtime — threads UI stays off (SSE mode)",
  );
}

const runtime = new CopilotRuntime({
  agents: async () => {
    const user = _requestUser.getStore() ?? UNKNOWN_USER;
    const requestContext = new RequestContext();
    requestContext.set("userId", user.id);
    if (user.email) requestContext.set("email", user.email);
    // IPI-750: sync — no Wrangler spin-up off-Cloudflare. Minimal cfEnv (pickCfEnv).
    try {
      const { env } = getCloudflareContext();
      requestContext.set("cfEnv", pickCfEnv(env));
    } catch {
      // Vercel/Node — cfEnv stays unset, cloudflare-models.ts falls back to legacy.
    }
    // IPI-146: resolved in handler() before endpoint(request) runs — a missing
    // org already returned 403 by this point, so this store is always
    // populated on any real request. The throw below is a defensive
    // fail-closed guard (never silently fall back to bare user.id), not an
    // expected runtime path.
    const resourceId = _requestResourceId.getStore();
    if (!resourceId) {
      throw new MastraOrgScopeError(
        "resourceId not resolved before agents() ran — refusing to start agent (fail closed)",
      );
    }
    const agents = MastraAgent.getLocalAgents({
      mastra: getMastra(),
      resourceId,
      requestContext,
    });
    // IPI-760: `getLocalAgents()` does NOT accept `emitInterruptOutcome` in its
    // options (verified against @ag-ui/mastra@1.1.1's compiled source — the bulk
    // helper only forwards mastra/resourceId/requestContext/untilIdle/
    // observationalMemory/tracingOptions to each constructed MastraAgent; passing
    // it there is both a TS2353 type error and a silent no-op at runtime).
    //
    // Setting only the instance field is NOT enough: CopilotKit's runtime clones
    // the agent per request (`cloneAgentForRequest` -> `agents[agentId].clone()`,
    // see @copilotkit/runtime/dist/v2/runtime/handlers/shared/agent-utils.cjs),
    // and MastraAgent.clone() rebuilds `new MastraAgent(this.config)` from the
    // ORIGINAL config object, not the live instance — so a post-construction
    // `agent.emitInterruptOutcome = false` is silently discarded on every real
    // request before the agent ever runs (confirmed empirically: cloning after an
    // instance-only mutation returns `emitInterruptOutcome: true` again). Mutating
    // `agent.config` too — the same object `clone()` reconstructs from — makes it
    // survive cloning, including repeated clone-of-clone.
    //
    // 1.1.1 defaults this to true, which requires a CopilotKit client >=1.61.2 to
    // resume structured interrupts. This repo runs @copilotkit/runtime@1.61.0 —
    // explicitly named as an affected version in AG-UI's own README — so leaving
    // the default on strands every Mastra HITL interrupt/resume with "Thread has
    // N pending interrupt(s) not addressed by resume". Keep false until
    // CopilotKit is bumped to >=1.61.2 (separate, larger decision — see IPI-760).
    for (const [agentId, agent] of Object.entries(agents)) {
      if (agent instanceof MastraAgent) {
        agent.emitInterruptOutcome = false;
        // `config` is typed `private` in @ag-ui/mastra's declarations, but it's a
        // plain runtime field (TS `private` isn't enforced at runtime) — the cast
        // is intentional, not a type-safety hole: see the comment above for why
        // clone() requires mutating it directly.
        (agent as any).config.emitInterruptOutcome = false;
      } else {
        // getLocalAgents() only ever constructs MastraAgent instances today (see
        // the `y()` helper decompiled in the comment above), so this branch isn't
        // expected to run — but if a future @ag-ui/mastra version changes that, an
        // agent silently skipped here means it keeps the emitInterruptOutcome:
        // true default and strands HITL interrupts for exactly that agent, with
        // no visible signal. Fail loud instead of failing silent.
        console.warn(
          `[copilotkit] agent "${agentId}" from getLocalAgents() is not a MastraAgent instance ` +
            "(unexpected @ag-ui/mastra shape) — emitInterruptOutcome was NOT set to false for it; " +
            "HITL interrupt/resume may strand for this agent. See IPI-760.",
        );
      }
    }
    return agents;
  },
  runner: new InMemoryAgentRunner(),
  // Intelligence mode requires `intelligence: new CopilotKitIntelligence(...)` — not licenseToken alone.
  // isCopilotKitThreadsEnabled() stays false until that client is wired (see intelligence-config.ts).
});

// CF-MIG-210: fetch handler (no hono/vercel — Workers-safe; same pattern as marketing-chat).
const endpoint = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
});

function extractSafeRuntimeErrorDetail(bodyText: string, contentType: string): string | undefined {
  const trimmed = bodyText.trim();
  if (!trimmed) return undefined;

  if (contentType.includes("application/json")) {
    try {
      const parsed = JSON.parse(trimmed) as {
        message?: unknown;
        error?: unknown;
        detail?: unknown;
      };
      if (typeof parsed.message === "string" && parsed.message.trim()) {
        return parsed.message.trim();
      }
      if (typeof parsed.error === "string" && parsed.error.trim()) {
        return parsed.error.trim();
      }
      if (typeof parsed.detail === "string" && parsed.detail.trim()) {
        return parsed.detail.trim();
      }
    } catch {
      return undefined;
    }
    return undefined;
  }

  if (trimmed.includes("<html") || trimmed.includes("<!DOCTYPE")) return undefined;
  if (trimmed.length > 500) return undefined;
  return trimmed;
}

function shouldExposeRuntimeErrorDetail(): boolean {
  return process.env.NODE_ENV !== "production";
}

/** True when a client-facing string looks like a raw Node/bundler internal. */
function isUnsafeClientErrorText(text: string): boolean {
  return /ERR_REQUIRE_ESM|require\(\) of ES Module|node_modules|\.cjs\b|at\s+\S+\s+\(/i.test(
    text,
  );
}

function clientSafeErrorLabel(raw: unknown, fallback: string): string {
  if (typeof raw !== "string" || !raw.trim()) return fallback;
  const trimmed = raw.trim();
  if (!shouldExposeRuntimeErrorDetail() && isUnsafeClientErrorText(trimmed)) {
    return fallback;
  }
  return trimmed;
}

/** CopilotKit may return opaque 500s when agent discovery fails — normalize for the UI. */
async function normalizeRuntimeErrorResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;

  const contentType = response.headers.get("content-type") ?? "";
  const exposeDetail = shouldExposeRuntimeErrorDetail();

  // IPI-718: even upstream 503 JSON can carry raw internals (detail/message/error) — redact in production.
  if (response.status === 503 && contentType.includes("application/json")) {
    let parsed: {
      error?: unknown;
      code?: unknown;
      detail?: unknown;
      message?: unknown;
      degraded?: unknown;
    } = {};
    try {
      parsed = JSON.parse(await response.clone().text()) as typeof parsed;
    } catch (err) {
      console.error("[copilotkit] failed to parse upstream 503 JSON", err);
    }

    const detail = extractSafeRuntimeErrorDetail(
      JSON.stringify(parsed),
      "application/json",
    );
    if (detail) {
      console.error("[copilotkit] runtime 503 detail:", detail);
    }

    try {
      response.body?.cancel().catch(() => {});
    } catch {
      // body may be null or already consumed
    }

    const code = typeof parsed.code === "string" && parsed.code.trim() ? parsed.code : "runtime_error";
    const error = clientSafeErrorLabel(parsed.error, "CopilotKit runtime unavailable");

    return Response.json(
      {
        error,
        code,
        ...(detail && exposeDetail ? { detail } : {}),
        ...(parsed.degraded === true ? { degraded: true } : {}),
      },
      { status: 503 },
    );
  }

  let detail: string | undefined;
  if (contentType.includes("application/json")) {
    try {
      detail = extractSafeRuntimeErrorDetail(await response.clone().text(), contentType);
      if (detail) {
        console.error("[copilotkit] runtime 5xx detail:", detail);
      }
    } catch (err) {
      console.error("[copilotkit] failed to parse runtime 5xx body", err);
    }
  }

  try {
    response.body?.cancel().catch(() => {});
  } catch {
    // body may be null or already consumed
  }

  return Response.json(
    {
      error: "CopilotKit runtime unavailable",
      code: "runtime_error",
      ...(detail && exposeDetail ? { detail } : {}),
    },
    { status: 503 },
  );
}

function requestNeedsDurableStorage(request: Request): boolean {
  const { pathname } = new URL(request.url);
  if (pathname.endsWith("/info")) return false;
  return pathname.includes("/agent/");
}

function storageUnavailableResponse(err: MastraStorageUnavailableError): Response {
  const exposeDetail = shouldExposeRuntimeErrorDetail();
  return Response.json(
    {
      error: "Agent persistence unavailable",
      code: "storage_unavailable",
      ...(exposeDetail ? { detail: err.message } : {}),
      degraded: true,
    },
    { status: 503 },
  );
}

const handler = async (request: Request): Promise<Response> => {
  let user: OperatorUser;
  try {
    user = await withOperatorAuth(request);
  } catch (err) {
    if (err instanceof OperatorAuthError) {
      return new Response("Unauthorized", { status: 401 });
    }
    throw err;
  }

  if (requestNeedsDurableStorage(request)) {
    try {
      getMastraStorage();
    } catch (err) {
      if (err instanceof MastraStorageUnavailableError) {
        console.error("[copilotkit] agent run blocked — durable storage unavailable", err.message);
        return storageUnavailableResponse(err);
      }
      throw err;
    }
  }

  const token = extractAccessToken(request) ?? "";

  try {
    // IPI-146: resolve the org-scoped resourceId, then (if this request
    // targets an existing thread) verify that thread belongs to it — both
    // BEFORE endpoint(request) runs, so a failure here never reaches
    // CopilotKit's internals as an opaque thrown error.
    const resourceId = await resolveOrgScopedResourceId(user, token);

    const threadId = await extractThreadIdFromBody(request);
    if (threadId) {
      await assertThreadOwnership(threadId, resourceId, user.id);
    }

    const response = await _requestUser.run(user, () =>
      _requestResourceId.run(resourceId, () => requestToken.run(token, () => endpoint(request))),
    );
    return withStreamIdleTimeout(await normalizeRuntimeErrorResponse(response), STREAM_IDLE_TIMEOUT_MS);
  } catch (err) {
    if (err instanceof MastraOrgScopeError) {
      console.error("[copilotkit] org resolution failed — refusing request (fail closed)", err.message);
      return Response.json(
        { error: "No organization membership for this operator", code: "org_required" },
        { status: 403 },
      );
    }
    if (err instanceof TenantContextError) {
      console.error("[copilotkit] thread ownership check failed — refusing request (fail closed)", err.message);
      return Response.json(
        { error: "Thread not found or access denied", code: "thread_forbidden" },
        { status: 403 },
      );
    }
    if (err instanceof MastraStorageUnavailableError) {
      console.error("[copilotkit] persistence unavailable", err);
      return storageUnavailableResponse(err);
    }
    console.error("[copilotkit] runtime handler failed", err);
    return Response.json(
      { error: "CopilotKit runtime unavailable", code: "runtime_error" },
      { status: 503 },
    );
  }
};

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
