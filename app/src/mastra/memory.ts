import { Memory } from "@mastra/memory";
import { z } from "zod";
import { getMastraStorageLazy } from "./storage";
import { requireResourceId } from "@/lib/db/mastra-tenant-scope";

let _memory: Memory | undefined;
let _plannerMemory: Memory | undefined;

function createLazyMemory(factory: () => Memory): Memory {
  let instance: Memory | undefined;
  const getInstance = (): Memory => {
    if (!instance) instance = factory();
    return instance;
  };
  return new Proxy({} as Memory, {
    get(_target, prop) {
      const mem = getInstance();
      const value = Reflect.get(mem, prop, mem) as unknown;
      return typeof value === "function"
        ? (value as (...args: unknown[]) => unknown).bind(mem)
        : value;
    },
  });
}

/** Base memory — message history only. Used by agents without a working-memory schema. */
export function getMastraMemory(): Memory {
  if (!_memory) {
    _memory = createLazyMemory(
      () =>
        new Memory({
          // IPI-803: lazy proxy so Workers request-scoped ALS storage is re-read
          // per method — never pin a module-cached PostgresStore across invocations.
          storage: getMastraStorageLazy(),
          options: {
            lastMessages: 40,
            // ponytail: semantic recall + observational memory deferred to IPI-136 / Phase 2
          },
        }),
    );
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
    _plannerMemory = createLazyMemory(
      () =>
        new Memory({
          storage: getMastraStorageLazy(),
          options: {
            lastMessages: 40,
            workingMemory: {
              enabled: true,
              scope: "thread",
              schema: PlannerWorkingMemory,
            },
          },
        }),
    );
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

/**
 * IPI-146 · MASTRA-GOV-002 — Org-scoped Mastra `resourceId`. Format:
 * `org:{orgId}::user:{userId}` (segments percent-encoded to prevent
 * collisions between tenants whose ids contain `:`).
 *
 * `Memory`/`getLocalAgents({ resourceId })` use this as the tenant partition
 * key for thread history — passing a bare `userId` (pre-IPI-146 behavior)
 * isolates by user only, not by org. Fails closed (throws `TenantContextError`)
 * on a blank/non-string orgId or userId, reusing IPI-621's validator so this
 * doesn't reinvent that check — see `app/src/lib/db/mastra-tenant-scope.ts`.
 */
export function makeMemoryResourceId(orgId: string, userId: string): string {
  const org = requireResourceId(orgId);
  const user = requireResourceId(userId);
  return `org:${encodeURIComponent(org)}::user:${encodeURIComponent(user)}`;
}
