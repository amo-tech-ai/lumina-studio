import {
  CopilotRuntime,
  createCopilotEndpoint,
  InMemoryAgentRunner,
} from "@copilotkit/runtime/v2";
import { MastraAgent } from "@ag-ui/mastra";
import { Mastra } from "@mastra/core/mastra";
import { publicMarketingAgent } from "@/mastra/agents/public-marketing-agent";
import { handle } from "hono/vercel";

// ponytail: isolated Mastra instance — only public-marketing exposed.
// Operator agents are unreachable because they are not registered here.
// No auth gate on this route (public).
const publicMastra = new Mastra({
  agents: { "public-marketing": publicMarketingAgent },
});

const runtime = new CopilotRuntime({
  // ponytail: "public" resourceId — no user identity on this route.
  agents: async () => MastraAgent.getLocalAgents({ mastra: publicMastra, resourceId: "public" }),
  runner: new InMemoryAgentRunner(),
});

const app = createCopilotEndpoint({
  runtime,
  basePath: "/api/marketing-chat",
});

const endpoint = handle(app);

const handler = (request: Request) => endpoint(request);

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
