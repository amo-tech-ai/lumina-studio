import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
import { productionPlannerAgent, creativeDirectorAgent } from "./agents";
import { ConsoleLogger, LogLevel } from "@mastra/core/logger";

const VALID_LOG_LEVELS: LogLevel[] = ["debug", "info", "warn", "error"];
const rawLogLevel = process.env.LOG_LEVEL;
const LOG_LEVEL: LogLevel = VALID_LOG_LEVELS.includes(rawLogLevel as LogLevel)
  ? (rawLogLevel as LogLevel)
  : "info";

export const mastra = new Mastra({
  // Registry keys ARE the agent names the runtime exposes (via getLocalAgents) and
  // the frontend useAgent({ agentId }) must match these exactly.
  agents: {
    // default is a compatibility alias for CopilotKit prebuilt UI/runtime sync;
    // real app code should use production-planner.
    default: productionPlannerAgent,
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
