import { Agent } from "@mastra/core/agent";
import { resolveAgentModel } from "@/lib/ai/cloudflare-models";
import { PUBLIC_MARKETING_INSTRUCTIONS } from "@/mastra/prompts/public-marketing";

// ponytail: no tools — public agent is read-only and unauthenticated by design.
// Supabase writes happen in WEB-015.4 (capture-lead edge function), not here.
//
// IPI-753 · CF-MIG-230-W1 — dynamic model via resolveAgentModel. Flag stays
// legacy/unset until PR3 canary; missing cfEnv (Vercel/Node) always → legacy.
export const publicMarketingAgent = new Agent({
  id: "public-marketing",
  name: "iPix Marketing Assistant",
  model: ({ requestContext }) =>
    resolveAgentModel({
      agentId: "public-marketing",
      tier: "fast",
      requestContext,
    }),
  instructions: PUBLIC_MARKETING_INSTRUCTIONS,
  // No tools: this agent must never access operator or admin functionality.
  // No memory: stateless per-session; lead state lives in the frontend/widget (WEB-015.5).
});
