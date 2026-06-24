import {
  CopilotRuntime,
  CopilotKitIntelligence,
  createCopilotEndpoint,
  InMemoryAgentRunner,
} from "@copilotkit/runtime/v2";
import { MastraAgent } from "@ag-ui/mastra";
import { RequestContext } from "@mastra/core/request-context";
import { mastra } from "@/mastra";
import { resolveOperatorUser } from "@/lib/auth";
import { OperatorAuthError, withOperatorAuth } from "@/lib/operator-gate";
import { handle } from "hono/vercel";

const runtime = new CopilotRuntime({
  // Per-request agent factory (IPI2-127): resolves the authenticated operator
  // identity from the Supabase session and creates agents scoped to that user.
  // Each request gets its own agents with resourceId = user.id, ensuring Mastra
  // memory/threads are isolated per operator.
  agents: async ({ request }) => {
    const user = await resolveOperatorUser(request);
    const requestContext = new RequestContext();
    requestContext.set("userId", user.id);
    if (user.email) requestContext.set("email", user.email);
    return MastraAgent.getLocalAgents({
      mastra,
      resourceId: user.id,
      requestContext,
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
        // IPI2-127: runtime-level user resolution for intelligence mode.
        identifyUser: (request: Request) => resolveOperatorUser(request),
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

// IPI2-127: enforce auth at the HTTP boundary (defense-in-depth). The agent
// factory above also validates per-request, but this outer gate returns a clean
// 401 before the runtime processes the request at all — covering both SSE and
// intelligence modes.
const handler = async (request: Request): Promise<Response> => {
  try {
    await withOperatorAuth(request);
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
