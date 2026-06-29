/**
 * IPI-133 — AIOR-017: Durable Agent Foundation
 *
 * createDurableAgent wraps agents with resumable streams via PubSub + event cache.
 *
 * What this gives you:
 *   - Each run gets a stable `runId`
 *   - Stream events are cached so a disconnected client can reconnect
 *   - Call observe(runId, { offset }) to replay from a known position
 *   - Auto-cleanup fires after cleanupTimeoutMs once the run finishes
 *
 * This is NOT workflow snapshots (IPI-134):
 *   - DurableAgent: stream reconnection (network drop, tab close, deploy restart)
 *   - Workflow snapshots: HITL suspend/resume state across long human waits
 *
 * Cache: InMemoryServerCache by default (inherited from Mastra instance).
 * Upgrade: when IPI-129 lands, wire a Postgres-backed cache here.
 */
import { createDurableAgent } from "@mastra/core/agent/durable";
import type { DurableAgent } from "@mastra/core/agent/durable";

import { creativeDirectorAgent, productionPlannerAgent } from "./agents";

/** DurableAgent does not forward listWorkflows — bind wrapped agent workflows for Studio + chat tools. */
function bindWrappedWorkflows(durable: DurableAgent): void {
  durable.listWorkflows = durable.agent.listWorkflows.bind(durable.agent);
}

export const durablePlanner = createDurableAgent({
  agent: productionPlannerAgent,
});
bindWrappedWorkflows(durablePlanner);

export const durableCreativeDirector = createDurableAgent({
  agent: creativeDirectorAgent,
});
bindWrappedWorkflows(durableCreativeDirector);

export const durableAgents = {
  default: durablePlanner,
  "production-planner": durablePlanner,
  "creative-director": durableCreativeDirector,
} as const;
