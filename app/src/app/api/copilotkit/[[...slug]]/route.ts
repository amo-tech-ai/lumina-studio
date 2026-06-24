import {
  CopilotRuntime,
  CopilotKitIntelligence,
  createCopilotEndpoint,
  InMemoryAgentRunner,
} from "@copilotkit/runtime/v2";
import { MastraAgent } from "@ag-ui/mastra";
import { RequestContext } from "@mastra/core/request-context";
import { mastra } from "@/mastra";
import { type OperatorUser } from "@/lib/auth";
import { OperatorAuthError, withOperatorAuth } from "@/lib/operator-gate";
import { handle } from "hono/vercel";

// Per-request user cache: withOperatorAuth resolves the user at the HTTP
// boundary; the agent factory and identifyUser read from this cache so each
// inbound request only calls resolveOperatorUser once (C3 fix — audit 2026-06-24).
const _resolvedUsers = new WeakMap<Request, OperatorUser>();

const runtime = new CopilotRuntime({
  // Per-request agent factory (IPI2-127): reads the already-resolved operator
  // identity from the cache set by the HTTP boundary handler.
  agents: async ({ request }) => {
    const user = _resolvedUsers.get(request) ?? { id: "unknown", name: "unknown" };
    const requestContext = new RequestContext();
    requestContext.set("userId", user.id);
    if (user.email) requestContext.set("email", user.email);
    return MastraAgent.getLocalAgents({
      mastra,
      resourceId: user.id,
      requestContext: requestContext,
    });
  },
  // --- copilotkit:intelligence (remove this block to opt out) ---
  ...(process.env.COPILOTKIT_LICENSE_TOKEN
    ? (() => {
        if (!process.env.INTELLIGENCE_API_KEY) {
          throw new Error(
            "INTELLIGENCE_API_KEY is required when COPILOTKIT_LICENSE_TOKEN is set",
          );
        }
        return {
        intelligence: new CopilotKitIntelligence({
          apiKey: process.env.INTELLIGENCE_API_KEY,
          apiUrl: process.env.INTELLIGENCE_API_URL ?? "http://localhost:4201",
          wsUrl:
            process.env.INTELLIGENCE_GATEWAY_WS_URL ?? "ws://localhost:4401",
        }),
        identifyUser: async (request: Request) => {
          const cached = _resolvedUsers.get(request);
          if (cached) return cached;
          // Cache miss: CopilotKit may wrap the Request — re-resolve and cache.
          const user = await withOperatorAuth(request).catch(() => ({ id: "unknown", name: "unknown" }));
          _resolvedUsers.set(request, user as OperatorUser);
          return user;
        },
        licenseToken: process.env.COPILOTKIT_LICENSE_TOKEN,
      };
      })()
    : { runner: new InMemoryAgentRunner() }),
  // --- /copilotkit:intelligence ---
});

const app = createCopilotEndpoint({
  runtime,
  basePath: "/api/copilotkit",
});

const endpoint = handle(app);

// IPI2-127: enforce auth at the HTTP boundary. Resolves the operator identity
// once per request and caches it for the agent factory and identifyUser above.
const handler = async (request: Request): Promise<Response> => {
  try {
    const user = await withOperatorAuth(request);
    _resolvedUsers.set(request, user);
  } catch (err) {
    if (err instanceof OperatorAuthError) {
      return new Response("Unauthorized", { status: 401 });
    }
    throw err;
  }
  return endpoint(request);
};

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
