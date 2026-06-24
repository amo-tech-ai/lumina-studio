import {
  CopilotRuntime,
  CopilotKitIntelligence,
  createCopilotEndpoint,
  InMemoryAgentRunner,
} from "@copilotkit/runtime/v2";
import { MastraAgent } from "@ag-ui/mastra";
import { mastra } from "@/mastra";
import { resolveOperatorUser } from "@/lib/auth";
import { withOperatorAuth } from "@/lib/operator-gate";
import { handle } from "hono/vercel";

const runtime = new CopilotRuntime({
  // @ts-expect-error - ignore for now, typing error
  agents: MastraAgent.getLocalAgents({ mastra }),
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
        // IPI2-127: real Supabase-derived identity (fail-closed in production).
        // Replaces the demo-user stub so per-operator thread/memory stay isolated.
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

// IPI2-127: enforce auth at the HTTP boundary (withOperatorAuth) so the runtime
// is gated in BOTH modes — `identifyUser` only runs on the intelligence path,
// so without this the default SSE path would be reachable unauthenticated.
const handler = (request: Request) => withOperatorAuth(request, endpoint);

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
