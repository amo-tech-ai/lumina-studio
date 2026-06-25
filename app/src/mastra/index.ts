import { Mastra } from "@mastra/core/mastra";
import { visualIdentityAgent, socialDiscoveryAgent } from "./agents";
import { durableAgents } from "./durable";
import { ConsoleLogger, LogLevel } from "@mastra/core/logger";
import { getMastraStorage } from "./storage";
import { brandApprovalWorkflow } from "./workflows";

const VALID_LOG_LEVELS: LogLevel[] = ["debug", "info", "warn", "error"];
const rawLogLevel = process.env.LOG_LEVEL;
const LOG_LEVEL: LogLevel = VALID_LOG_LEVELS.includes(rawLogLevel as LogLevel)
  ? (rawLogLevel as LogLevel)
  : "info";

// Registry keys ARE the agent names the runtime exposes (via getLocalAgents) and
// the frontend useAgent({ agentId }) must match these exactly.
// default is a compatibility alias for CopilotKit prebuilt UI/runtime sync;
// real app code should use production-planner.
// IPI-133: durable agents replace raw agents in the registry so streams are resumable.
export const agents = {
  ...durableAgents,
  "visual-identity": visualIdentityAgent,
  "social-discovery": socialDiscoveryAgent,
};

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

let _mastra: Mastra | undefined;

export function getMastra(): Mastra {
  if (!_mastra) {
    _mastra = new Mastra({
      agents,
      storage: getMastraStorage(),
      workflows: {
        brandApprovalWorkflow,
      },
      logger: new ConsoleLogger({
        level: LOG_LEVEL,
      }),
    });
  }
  return _mastra;
}
