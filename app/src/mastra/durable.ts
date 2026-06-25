import { createDurableAgent } from "@mastra/core/agent/durable";
import { productionPlannerAgent, creativeDirectorAgent } from "./agents";

export const durablePlanner = createDurableAgent({ agent: productionPlannerAgent });
export const durableCreativeDirector = createDurableAgent({ agent: creativeDirectorAgent });

export const durableAgents = {
  default: durablePlanner,
  "production-planner": durablePlanner,
  "creative-director": durableCreativeDirector,
} as const;
