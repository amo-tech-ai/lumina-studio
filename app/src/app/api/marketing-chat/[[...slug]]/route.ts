import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
  InMemoryAgentRunner,
} from "@/lib/copilotkit/runtime-v2-fetch";
import { MastraAgent } from "@ag-ui/mastra";
import { Mastra } from "@mastra/core/mastra";
import { RequestContext } from "@mastra/core/request-context";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { pickCfEnv } from "@/lib/ai/cloudflare-models";
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
  agents: async () => {
    // IPI-750 · CF-MIG-230-W0 — this route never built a RequestContext
    // before; it's needed now purely to carry cfEnv, matching the
    // CopilotKit route's pattern. Zero agents flip to native in this PR —
    // publicMarketingAgent's `model:` field is untouched. When a future
    // wave (W1) wires resolveAgentModel() into it, pass a hardcoded
    // agentId: "public-marketing" (not "default"), so no surface-aware
    // alias resolution is needed even though this registry also exposes
    // the same agent under the "default" key.
    const requestContext = new RequestContext();
    try {
      // Sync call — throws immediately off-Cloudflare, no Wrangler proxy
      // spin-up on the Vercel/Node hot path. Minimal cfEnv (see pickCfEnv).
      const { env } = getCloudflareContext();
      requestContext.set("cfEnv", pickCfEnv(env));
    } catch {
      // Expected on Vercel / Node — leave cfEnv unset, legacy routing applies.
    }
    return MastraAgent.getLocalAgents({
      mastra: publicMastra,
      resourceId: "public",
      requestContext,
    });
  },
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
