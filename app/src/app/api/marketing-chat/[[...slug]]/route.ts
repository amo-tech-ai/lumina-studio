import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
  InMemoryAgentRunner,
} from "@copilotkit/runtime/v2";
import { MastraAgent } from "@ag-ui/mastra";
import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
import { publicMarketingAgent } from "@/mastra/agents/public-marketing-agent";

// ponytail: isolated Mastra instance — only public-marketing exposed.
// Operator agents are unreachable because they are not registered here.
// No auth gate on this route (public).
// "default" alias: CopilotKit prebuilt UI resolves "default" when no agentId prop is set.
const publicMastra = new Mastra({
  agents: {
    default: publicMarketingAgent,
    "public-marketing": publicMarketingAgent,
  },
  storage: new LibSQLStore({ id: "public-chat-storage", url: ":memory:" }),
});

const runtime = new CopilotRuntime({
  // ponytail: "public" resourceId — no user identity on this route.
  agents: async () => MastraAgent.getLocalAgents({ mastra: publicMastra, resourceId: "public" }),
  runner: new InMemoryAgentRunner(),
});

// createCopilotRuntimeHandler bypasses Hono; matchRoute handles /info and /agent/:id/run directly.
const endpoint = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/marketing-chat",
  mode: "multi-route",
  cors: true,
});

export const GET = endpoint;
export const POST = endpoint;
export const PATCH = endpoint;
export const DELETE = endpoint;
