import { z } from "zod";
import { AgentState as AgentStateSchema } from "@/mastra/agents";

// Re-export inferred type from the single-source Zod schema in mastra/agents/index.ts
export type AgentState = z.infer<typeof AgentStateSchema>;
