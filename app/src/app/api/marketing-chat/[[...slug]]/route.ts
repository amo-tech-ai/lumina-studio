import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
  InMemoryAgentRunner,
} from "@/lib/copilotkit/runtime-v2-fetch";
import { MastraAgent } from "@ag-ui/mastra";
import { Mastra } from "@mastra/core/mastra";
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
  // No LibSQLStore — :memory: resolves to file: URLs that Workers reject.
  // CopilotKit InMemoryAgentRunner owns thread state for this public route.
});

const runtime = new CopilotRuntime({
  // ponytail: "public" resourceId — no user identity on this route.
  agents: async () => MastraAgent.getLocalAgents({ mastra: publicMastra, resourceId: "public" }),
  runner: new InMemoryAgentRunner(),
});

// ponytail: single-route — CopilotKit v2 client POSTs to the root path with JSON body
// {method: "info"} / {method: "agent/run", ...}. multi-route's matchRoute returns null
// for root-path POST (no path segments) causing 404.
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
