import { Agent } from "@mastra/core/agent";
import { resolveAgentModel } from "@/lib/ai/cloudflare-models";
import { agentTools } from "@/mastra/tools";
import { resolveModel } from "@/mastra/models";

export const socialDiscoveryAgent = new Agent({
  id: "social-discovery",
  name: "Social Discovery",
  // IPI-756 · CF-MIG-230-W6 — dynamic model via resolveAgentModel (reuse IPI-755/IPI-769 harness).
  // discoverSocialChannels stays on resolveModel("structured") — do not reroute the tool.
  model: async ({ requestContext }) => {
    try {
      return await resolveAgentModel({
        agentId: "social-discovery",
        tier: "default",
        requestContext,
      });
    } catch {
      console.warn(
        "[socialDiscovery] resolveAgentModel failed (agentId: social-discovery, tier: default); falling back to legacy model",
      );
      return resolveModel("default");
    }
  },
  tools: { discoverSocialChannels: agentTools.discoverSocialChannels },
  instructions:
    "You are the iPix social discovery agent. Given a brandId, call discoverSocialChannels to find the brand's official social media accounts and save them to the database.",
});
