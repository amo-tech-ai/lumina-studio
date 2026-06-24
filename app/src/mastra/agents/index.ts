import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { Agent } from "@mastra/core/agent";
import { agentTools } from "@/mastra/tools";
import { LibSQLStore } from "@mastra/libsql";
import { z } from "zod";
import { Memory } from "@mastra/memory";
import { resolveGeminiModel } from "@/mastra/models";

// @ai-sdk/google defaults to GOOGLE_GENERATIVE_AI_API_KEY; iPix uses GEMINI_API_KEY.
const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

// Model id comes from the registry (IPI2-80) — never hardcoded/preview here.
const GEMINI_MODEL = resolveGeminiModel();

export const AgentState = z.object({
  proverbs: z.array(z.string()).default([]),
});

// ponytail: foundation agents for IPI2-121. Tools/instructions are smoke-level here;
// the real production-planner tool suite + HITL lands in IPI2-114. Names are production
// and must match the Mastra registry keys in ./index.ts and the frontend agentId exactly.
export const productionPlannerAgent = new Agent({
  id: "production-planner",
  name: "Production Planner",
  tools: agentTools,
  model: google(GEMINI_MODEL),
  instructions:
    "You are the iPix production planner. Help operators plan shoots: deliverables, shot lists, and budgets.",
  // @ts-expect-error @mastra/memory beta: Memory.recall() return type mismatches MastraMemory (re-check on pkg bump)
  memory: new Memory({
    storage: new LibSQLStore({
      id: "production-planner-memory",
      url: ":memory:",
    }),
    options: {
      workingMemory: {
        enabled: true,
        schema: AgentState,
        scope: "thread",
      },
    },
  }),
});

export { publicMarketingAgent } from "./public-marketing-agent";

export const creativeDirectorAgent = new Agent({
  id: "creative-director",
  name: "Creative Director",
  model: google(GEMINI_MODEL),
  instructions:
    "You are the iPix creative director. Turn brand DNA and campaigns into creative briefs and moodboards that feed the shoot brief.",
  // @ts-expect-error @mastra/memory beta: Memory.recall() return type mismatches MastraMemory (re-check on pkg bump)
  memory: new Memory({
    storage: new LibSQLStore({
      id: "creative-director-memory",
      url: ":memory:",
    }),
  }),
});
