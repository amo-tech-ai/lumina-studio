import { Mastra } from "@mastra/core/mastra";
import { visualIdentityAgent, socialDiscoveryAgent } from "./agents";
import { brandIntelligenceAgent } from "./agents/brand-intelligence-agent";
import { durableAgents } from "./durable";
import { shootWizardWorkflow, brandIntelligenceWorkflow, brandApprovalWorkflow } from "./workflows";
import { ConsoleLogger, LogLevel } from "@mastra/core/logger";
import { getMastraStorage } from "./storage";

const VALID_LOG_LEVELS: LogLevel[] = ["debug", "info", "warn", "error"];
const rawLogLevel = process.env.LOG_LEVEL;
const LOG_LEVEL: LogLevel = VALID_LOG_LEVELS.includes(rawLogLevel as LogLevel)
  ? (rawLogLevel as LogLevel)
  : "info";

export const agents = {
  ...durableAgents,
  "visual-identity": visualIdentityAgent,
  "social-discovery": socialDiscoveryAgent,
  "brand-intelligence": brandIntelligenceAgent,
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
        "shoot-wizard": shootWizardWorkflow,
        "brand-intelligence": brandIntelligenceWorkflow,
        "brand-approval": brandApprovalWorkflow,
      },
      logger: new ConsoleLogger({
        level: LOG_LEVEL,
      }),
    });
  }
  return _mastra;
}

// ponytail: `mastra dev` CLI requires a named `mastra` export.
// Proxy defers getMastra() until first access. Methods are bound to the real
// instance so `this.#privateField` access inside Mastra methods works correctly.
export const mastra = new Proxy({} as Mastra, {
  get(_, prop) {
    const instance = getMastra();
    const value = Reflect.get(instance, prop, instance);
    return typeof value === "function"
      ? (value as (...a: unknown[]) => unknown).bind(instance)
      : value;
  },
});
