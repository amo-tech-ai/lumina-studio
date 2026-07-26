/**
 * IPI-146 · MASTRA-GOV-002 — Org-scoped Mastra memory: real-Postgres proof.
 *
 * Unit tests (`memory.test.ts`, `mastra-tenant-scope.test.ts`) and mocked
 * runtime tests (`route.runtime.test.ts`) already cover the logic in
 * isolation. This file is the missing piece: it proves the same
 * `makeMemoryResourceId` + `rejectTenantKeyRewrite` contract holds against a
 * **real** `PostgresStore`-backed `mastra_threads` row (via `getMastraMemory()`),
 * not a mock. Skips (not fails) when no DB URL is configured — matches the
 * existing `{ skip: !process.env.GEMINI_API_KEY }` pattern in `durable.test.ts`.
 *
 * Live-volume probe (2026-07-24, linked `nvdlhrodvevgwdsneplk`, `public.mastra_threads`,
 * no secrets printed): 1 total thread, 0 org-scoped, 1 legacy bare-`resourceId` — tiny
 * enough that any of A/B/C would be safe, but Migration Strategy A (compat read, already
 * implemented in `route.ts`'s `assertThreadOwnership`) needed zero data migration to ship.
 *
 * Every thread this file creates is deleted in `afterAll` — this hits the linked
 * remote Supabase project (remote-only policy), not a local DB.
 */
import { afterAll, describe, expect, it } from "vitest";
import { getMastraMemory, makeMemoryResourceId } from "@/mastra/memory";
import { rejectTenantKeyRewrite, TenantContextError } from "./mastra-tenant-scope";
import type { StorageThreadType } from "@mastra/core/memory";

const hasDb = Boolean(process.env.DATABASE_URL || process.env.MASTRA_DATABASE_URL);

const createdThreadIds: string[] = [];

async function createTestThread(resourceId: string): Promise<StorageThreadType> {
  const id = `ipi-146-test-${crypto.randomUUID()}`;
  createdThreadIds.push(id);
  const now = new Date();
  return getMastraMemory().saveThread({
    thread: {
      id,
      resourceId,
      title: "IPI-146 integration test thread (safe to delete)",
      createdAt: now,
      updatedAt: now,
      metadata: { ipi146Test: true },
    },
  });
}

afterAll(async () => {
  if (!hasDb) return;
  await Promise.all(
    createdThreadIds.map((id) =>
      getMastraMemory()
        .deleteThread(id)
        .catch((err) => {
          // Teardown must never fail the suite on a leftover row — but a
          // silent catch here means a real `mastra_threads` cleanup bug
          // (e.g. schema drift) would never surface. Log and keep going.
          console.error(`[ipi-146 test cleanup] failed to delete thread ${id}:`, err);
        }),
    ),
  );
}, 15_000);

describe("IPI-146 · MASTRA-GOV-002 — org-scoped Mastra memory (real Postgres)", () => {
  it(
    "same-org success: a thread saved under an org-scoped resourceId is read back unchanged",
    { skip: !hasDb, timeout: 15_000 },
    async () => {
      const resourceId = makeMemoryResourceId("org-ipi146-acme", "user-a");
      const created = await createTestThread(resourceId);

      const fetched = await getMastraMemory().getThreadById({ threadId: created.id });

      expect(fetched).not.toBeNull();
      expect(fetched?.resourceId).toBe(resourceId);
      // The exact check `assertThreadOwnership()` runs in route.ts before every turn.
      expect(() => rejectTenantKeyRewrite(fetched!.resourceId, resourceId)).not.toThrow();
    },
  );

  it(
    "cross-org deny: a thread owned by org A is rejected when the caller resolves to org B",
    { skip: !hasDb, timeout: 15_000 },
    async () => {
      const ownerResourceId = makeMemoryResourceId("org-ipi146-acme", "user-a");
      const created = await createTestThread(ownerResourceId);

      const fetched = await getMastraMemory().getThreadById({ threadId: created.id });
      const callerResourceId = makeMemoryResourceId("org-ipi146-widgets", "user-a");

      expect(() => rejectTenantKeyRewrite(fetched!.resourceId, callerResourceId)).toThrow(
        TenantContextError,
      );

      // Real-DB confirmation this is actually cross-tenant, not a typo: listing org B's
      // threads never surfaces org A's row (no accidental substring/prefix match).
      const orgBThreads = await getMastraMemory().listThreads({
        filter: { resourceId: callerResourceId },
      });
      expect(orgBThreads.threads.find((t) => t.id === created.id)).toBeUndefined();
    },
  );

  it(
    "missing-org fail closed: makeMemoryResourceId throws before any thread can be created",
    { skip: !hasDb, timeout: 15_000 },
    async () => {
      const threadsBefore = createdThreadIds.length;

      expect(() => makeMemoryResourceId("", "user-a")).toThrow(TenantContextError);
      expect(() => makeMemoryResourceId("   ", "user-a")).toThrow(TenantContextError);

      // The throw is synchronous — no await ran, so createTestThread() (the only
      // place that pushes into createdThreadIds / writes a row) was never reached.
      expect(createdThreadIds.length).toBe(threadsBefore);
    },
  );

  it(
    "forged threadId deny: a threadId claimed by a different user in the SAME org is rejected",
    { skip: !hasDb, timeout: 15_000 },
    async () => {
      const victimResourceId = makeMemoryResourceId("org-ipi146-acme", "user-victim");
      const created = await createTestThread(victimResourceId);

      const fetched = await getMastraMemory().getThreadById({ threadId: created.id });
      const forgedCallerResourceId = makeMemoryResourceId("org-ipi146-acme", "user-attacker");

      expect(() => rejectTenantKeyRewrite(fetched!.resourceId, forgedCallerResourceId)).toThrow(
        TenantContextError,
      );
    },
  );
});
