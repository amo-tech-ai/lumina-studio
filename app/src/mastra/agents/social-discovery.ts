import { Agent } from "@mastra/core/agent";
import { agentTools } from "@/mastra/tools";
import { resolveModel } from "@/mastra/models";

export const socialDiscoveryAgent = new Agent({
  id: "social-discovery",
  name: "Social Discovery",
  model: resolveModel("default"),
  tools: { discoverSocialChannels: agentTools.discoverSocialChannels },
  instructions:
    "You are the iPix social discovery agent. Given a brandId, call discoverSocialChannels to find the brand's official social media accounts and save them to the database.",
});
