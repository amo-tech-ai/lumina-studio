import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
import { productionPlannerAgent, creativeDirectorAgent, publicMarketingAgent } from "./agents";
import { ConsoleLogger, LogLevel } from "@mastra/core/logger";

const VALID_LOG_LEVELS: LogLevel[] = ["debug", "info", "warn", "error"];
const rawLogLevel = process.env.LOG_LEVEL;
const LOG_LEVEL: LogLevel = VALID_LOG_LEVELS.includes(rawLogLevel as LogLevel)
  ? (rawLogLevel as LogLevel)
  : "info";

// Registry keys ARE the agent names the runtime exposes (via getLocalAgents) and
// the frontend useAgent({ agentId }) must match these exactly.
// default is a compatibility alias for CopilotKit prebuilt UI/runtime sync;
// real app code should use production-planner.
export const agents = {
  default: productionPlannerAgent,
  "production-planner": productionPlannerAgent,
  "creative-director": creativeDirectorAgent,
  "public-marketing": publicMarketingAgent,
};

// Regression guard: fail fast at server start / build if a required agent id is
// ever renamed or dropped. Without this, a missing id only shows up as a cryptic
// React "Agent '<id>' not found after runtime sync" overlay at runtime. "default"
// is mandatory — CopilotKit's prebuilt UI resolves it when no agentId is selected.
export const REQUIRED_AGENT_IDS = [
  "default",
  "production-planner",
  "creative-director",
] as const;
for (const id of REQUIRED_AGENT_IDS) {
  if (!(id in agents)) {
    throw new Error(
      `Mastra registry is missing required agent "${id}". CopilotKit's prebuilt ` +
        `UI needs "default"; the operator UI calls these ids via useAgent({ agentId }). ` +
        `Keep the registry keys here in sync with the frontend agentId props.`,
    );
  }
}

export const mastra = new Mastra({
  agents,
  storage: new LibSQLStore({
    id: "mastra-storage",
    url: ":memory:",
  }),
  logger: new ConsoleLogger({
    level: LOG_LEVEL,
  }),
});
