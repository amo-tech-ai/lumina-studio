import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
import { productionPlannerAgent, creativeDirectorAgent } from "./agents";
import { ConsoleLogger, LogLevel } from "@mastra/core/logger";

const LOG_LEVEL = (process.env.LOG_LEVEL as LogLevel) || "info";

export const mastra = new Mastra({
  // Registry keys ARE the agent names the runtime exposes (via getLocalAgents) and
  // the frontend useAgent({ agentId }) must match these exactly.
  agents: {
    "production-planner": productionPlannerAgent,
    "creative-director": creativeDirectorAgent,
  },
  storage: new LibSQLStore({
    id: "mastra-storage",
    url: ":memory:",
  }),
  logger: new ConsoleLogger({
    level: LOG_LEVEL,
  }),
});
