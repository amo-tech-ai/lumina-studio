import { AsyncLocalStorage } from "node:async_hooks";
import {
  CopilotRuntime,
  createCopilotEndpoint,
  InMemoryAgentRunner,
} from "@copilotkit/runtime/v2";
import { MastraAgent } from "@ag-ui/mastra";
import { RequestContext } from "@mastra/core/request-context";
import { getMastra } from "@/mastra";
import { type OperatorUser, extractAccessToken } from "@/lib/auth";
import { OperatorAuthError, withOperatorAuth } from "@/lib/operator-gate";
import { requestToken } from "@/lib/request-token";
import { handle } from "hono/vercel";

// AsyncLocalStorage propagates the resolved operator identity through the
// entire async call-stack of a request — including agent factory callbacks that
// CopilotKit may invoke with a wrapped copy of the original Request object.
// This eliminates the Request-identity dependency that caused WeakMap misses
// when CopilotKit internally wraps/re-creates the Request (C3 fix v2 — 2026-06-24).
const _requestUser = new AsyncLocalStorage<OperatorUser>();

const UNKNOWN_USER: OperatorUser = { id: "unknown", name: "unknown" };

if (!process.env.COPILOTKIT_LICENSE_TOKEN) {
  console.warn(
    "[copilotkit] COPILOTKIT_LICENSE_TOKEN not set — thread persistence disabled, each page load starts a fresh conversation",
  );
}

const runtime = new CopilotRuntime({
  // Per-request agent factory (IPI2-127): reads the operator identity from
  // AsyncLocalStorage — no Request-key lookup, no re-authentication.
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
  // ponytail: licenseToken enables thread persistence (free tier: 72h, 200 threads).
  // Intelligence API is not included in the free tier — use InMemoryAgentRunner instead.
  ...(process.env.COPILOTKIT_LICENSE_TOKEN
    ? {
        licenseToken: process.env.COPILOTKIT_LICENSE_TOKEN,
        identifyUser: async () => _requestUser.getStore() ?? UNKNOWN_USER,
      }
    : {}),
});

const app = createCopilotEndpoint({
  runtime,
  basePath: "/api/copilotkit",
});

const endpoint = handle(app);

// IPI2-127: enforce auth at the HTTP boundary. Resolves the operator identity
// once, then runs the CopilotKit endpoint inside the ALS context so every
// downstream callback (agent factory, identifyUser) reads the same user without
// re-authenticating or holding a reference to the Request object.
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
  const token = extractAccessToken(request) ?? "";
  return _requestUser.run(user, () => requestToken.run(token, () => endpoint(request)));
};

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
