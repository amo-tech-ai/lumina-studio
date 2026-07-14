import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
  InMemoryAgentRunner,
} from "@/lib/copilotkit/runtime-v2-fetch";
import { MastraAgent } from "@ag-ui/mastra";
import { Mastra } from "@mastra/core/mastra";
import { publicMarketingAgent } from "@/mastra/agents/public-marketing-agent";

// ponytail: isolated Mastra instance — only public-marketing exposed.
const publicMastra = new Mastra({
  agents: {
    default: publicMarketingAgent,
    "public-marketing": publicMarketingAgent,
  },
  // No LibSQLStore — :memory: resolves to file: URLs that Workers reject.
});

const runtime = new CopilotRuntime({
  agents: async () => MastraAgent.getLocalAgents({ mastra: publicMastra, resourceId: "public" }),
  runner: new InMemoryAgentRunner(),
});

const endpoint = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/marketing-chat",
  mode: "single-route",
  cors: true,
});

export const GET = endpoint;
export const POST = endpoint;
export const PATCH = endpoint;
export const DELETE = endpoint;
