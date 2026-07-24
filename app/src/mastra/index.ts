import { Mastra } from "@mastra/core/mastra";
import { visualIdentityAgent, socialDiscoveryAgent, modelMatchAgent, bookingAgent } from "./agents";
import { crmAssistantAgent } from "./agents/crm-assistant-agent";
import { brandIntelligenceAgent } from "./agents/brand-intelligence-agent";
import { durableAgents } from "./durable";
import { shootWizardWorkflow, brandIntelligenceWorkflow } from "./workflows";
import { ConsoleLogger, LogLevel } from "@mastra/core/logger";
import {
  Observability,
  MastraStorageExporter,
  SensitiveDataFilter,
} from "@mastra/observability";
import {
  assertMastraSchemaForObservabilityExporter,
  getMastraStorageLazy,
} from "./storage";

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
  "model-match": modelMatchAgent,
  "crm-assistant": crmAssistantAgent,
  booking: bookingAgent,
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
    // Fail closed: exporter must not boot against public.mastra_* shadows.
    assertMastraSchemaForObservabilityExporter();
    const logger = new ConsoleLogger({
      level: LOG_LEVEL,
    });
    _mastra = new Mastra({
      agents,
      storage: getMastraStorageLazy(),
      workflows: {
        "shoot-wizard": shootWizardWorkflow,
        "brand-intelligence": brandIntelligenceWorkflow,
      },
      logger,
      // Instance required — plain config objects are rejected at boot.
      // Postgres prefers batch-with-updates; retention/prune is IPI-780.
      observability: new Observability({
        configs: {
          default: {
            serviceName: "ipix-operator",
            exporters: [
              // ponytail: MastraStorageExporterConfig already retries with
              // maxRetries=4 / retryDelayMs=500 (exp backoff); after that the
              // batch is dropped. No custom retry loop — logger surfaces
              // logStorageFailure via the official BaseExporterConfig API.
              new MastraStorageExporter({
                strategy: "batch-with-updates",
                logger,
                logLevel: LOG_LEVEL,
              }),
            ],
            spanOutputProcessors: [new SensitiveDataFilter()],
          },
        },
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
