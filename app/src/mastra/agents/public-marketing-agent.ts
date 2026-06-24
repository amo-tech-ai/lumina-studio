import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { Agent } from "@mastra/core/agent";
import { PUBLIC_MARKETING_INSTRUCTIONS } from "@/mastra/prompts/public-marketing";

// ponytail: no tools — public agent is read-only and unauthenticated by design.
// Supabase writes happen in WEB-015.4 (capture-lead edge function), not here.
const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

export const publicMarketingAgent = new Agent({
  id: "public-marketing",
  name: "iPix Marketing Assistant",
  model: google("gemini-3.5-flash"),
  instructions: PUBLIC_MARKETING_INSTRUCTIONS,
  // No tools: this agent must never access operator or admin functionality.
  // No memory: stateless per-session; lead state lives in the frontend/widget (WEB-015.5).
});
