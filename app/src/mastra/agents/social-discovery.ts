import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { Agent } from "@mastra/core/agent";
import { agentTools } from "@/mastra/tools";
import { resolveGeminiModel } from "@/mastra/models";

const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
const GEMINI_MODEL = resolveGeminiModel();

export const socialDiscoveryAgent = new Agent({
  id: "social-discovery",
  name: "Social Discovery",
  model: google(GEMINI_MODEL),
  tools: { discoverSocialChannels: agentTools.discoverSocialChannels },
  instructions:
    "You are the iPix social discovery agent. Given a brandId, call discoverSocialChannels to find the brand's official social media accounts and save them to the database.",
});
