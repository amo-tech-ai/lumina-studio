import { z } from "zod";
import { PlannerWorkingMemory } from "@/mastra/agents";

export type AgentState = z.infer<typeof PlannerWorkingMemory>;
