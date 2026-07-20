import { AsyncLocalStorage } from "node:async_hooks";
import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
  InMemoryAgentRunner,
} from "@/lib/copilotkit/runtime-v2-fetch";
import { MastraAgent } from "@ag-ui/mastra";
import { RequestContext } from "@mastra/core/request-context";
import { getMastra } from "@/mastra";
import { getMastraStorage, MastraStorageUnavailableError } from "@/mastra/storage";
import { type OperatorUser, extractAccessToken } from "@/lib/auth";
import { isOperatorAuthEnforced, OperatorAuthError, withOperatorAuth } from "@/lib/operator-gate";
import { isCopilotIntelligenceEnvComplete, isCopilotKitThreadsEnabled } from "@/lib/copilotkit/intelligence-config";
import { requestToken } from "@/lib/request-token";
import { withStreamIdleTimeout } from "@/lib/copilotkit/stream-idle-timeout";

// See stream-idle-timeout.ts for why this exists — bounds a stalled agent
// turn (e.g. a hung PostgresStore query) to a controlled RUN_ERROR instead
// of an indefinite hang.
const STREAM_IDLE_TIMEOUT_MS = 20_000;

// AsyncLocalStorage propagates the resolved operator identity through the
// entire async call-stack of a request — including agent factory callbacks that
// CopilotKit may invoke with a wrapped copy of the original Request object.
const _requestUser = new AsyncLocalStorage<OperatorUser>();

const UNKNOWN_USER: OperatorUser = { id: "unknown", name: "unknown" };

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
    return MastraAgent.getLocalAgents({
      mastra: getMastra(),
      resourceId: user.id,
      requestContext,
    });
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

/** CopilotKit may return opaque 500s when agent discovery fails — normalize for the UI. */
async function normalizeRuntimeErrorResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;

  const contentType = response.headers.get("content-type") ?? "";
  if (response.status === 503 && contentType.includes("application/json")) {
    return response;
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

  // IPI-718: log detail server-side; never return raw internals (e.g. ERR_REQUIRE_ESM) to browsers in production.
  const exposeDetail = process.env.NODE_ENV !== "production";

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
  const exposeDetail = process.env.NODE_ENV !== "production";
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

  try {
    const token = extractAccessToken(request) ?? "";
    const response = await _requestUser.run(user, () =>
      requestToken.run(token, () => endpoint(request)),
    );
    return withStreamIdleTimeout(await normalizeRuntimeErrorResponse(response), STREAM_IDLE_TIMEOUT_MS);
  } catch (err) {
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
