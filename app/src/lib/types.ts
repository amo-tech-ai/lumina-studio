import { z } from "zod";
import { PlannerWorkingMemory } from "@/mastra/memory";

export type AgentState = z.infer<typeof PlannerWorkingMemory>;
