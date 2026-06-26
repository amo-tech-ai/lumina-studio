import { Memory } from "@mastra/memory";
import { z } from "zod";
import { getMastraStorage } from "./storage";

let _memory: Memory | undefined;
let _plannerMemory: Memory | undefined;

/** Base memory — message history only. Used by agents without a working-memory schema. */
export function getMastraMemory(): Memory {
  if (!_memory) {
    _memory = new Memory({
      storage: getMastraStorage(),
      options: {
        lastMessages: 40,
        // ponytail: semantic recall + observational memory deferred to IPI-136 / Phase 2
      },
    });
  }
  return _memory;
}

/** Working memory schema for the production planner — persisted per thread in Postgres. */
export const PlannerWorkingMemory = z.object({
  brandName: z.string().optional(),
  shootType: z.string().optional(),
  approvedConcepts: z.array(z.string()).default([]),
  pendingDecisions: z.array(z.string()).default([]),
  lastUpdated: z.string().optional(),
});

/** Planner memory — includes PlannerWorkingMemory schema so the agent can persist
 *  structured state across turns. Separate instance to avoid bleeding schema to other agents.
 */
export function getPlannerMemory(): Memory {
  if (!_plannerMemory) {
    // @ts-expect-error @mastra/memory beta: Memory.recall() return type mismatches MastraMemory (re-check on pkg bump)
    _plannerMemory = new Memory({
      storage: getMastraStorage(),
      options: {
        lastMessages: 40,
        workingMemory: {
          enabled: true,
          scope: "thread",
          schema: PlannerWorkingMemory,
        },
      },
    });
  }
  return _plannerMemory;
}

/** Thread ID convention: {orgId}/{workspace}/{entityId}
 *  Segments are encoded to prevent slash collisions between tenants.
 */
export function makeThreadId(
  orgId: string,
  workspace: "shoot" | "brand-intake" | "social-discovery",
  entityId: string,
): string {
  const enc = (s: string) => encodeURIComponent(s);
  return `${enc(orgId)}/${workspace}/${enc(entityId)}`;
}
