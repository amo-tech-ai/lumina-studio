import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { Agent } from "@mastra/core/agent";
import { weatherTool } from "@/mastra/tools";
import { LibSQLStore } from "@mastra/libsql";
import { z } from "zod";
import { Memory } from "@mastra/memory";

// @ai-sdk/google defaults to GOOGLE_GENERATIVE_AI_API_KEY; iPix uses GEMINI_API_KEY.
const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

export const AgentState = z.object({
  proverbs: z.array(z.string()).default([]),
});

// ponytail: foundation agents for IPI2-121. Tools/instructions are smoke-level here;
// the real production-planner tool suite + HITL lands in IPI2-114. Names are production
// and must match the Mastra registry keys in ./index.ts and the frontend agentId exactly.
export const productionPlannerAgent = new Agent({
  id: "production-planner",
  name: "Production Planner",
  tools: { weatherTool },
  // ponytail: latest flash per CopilotKit LLM adapter; swap to "gemini-2.5-flash" for stable
  model: google("gemini-3-flash-preview"),
  instructions:
    "You are the iPix production planner. Help operators plan shoots: deliverables, shot lists, and budgets.",
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

export const creativeDirectorAgent = new Agent({
  id: "creative-director",
  name: "Creative Director",
  model: google("gemini-3-flash-preview"),
  instructions:
    "You are the iPix creative director. Turn brand DNA and campaigns into creative briefs and moodboards that feed the shoot brief.",
  memory: new Memory({
    storage: new LibSQLStore({
      id: "creative-director-memory",
      url: ":memory:",
    }),
  }),
});
