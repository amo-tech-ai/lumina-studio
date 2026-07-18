# Audit verdict

**Overall task quality: 82/100.**
Five tasks are directionally correct. **IPI-669 · SB-CI-002 — Run Edge Deno Unit Tests in CI** can ship now. **IPI-623 · CF-DB-009 — Migrate One Mastra Workload to Hyperdrive** remains blocked and has a scope mismatch.

| Task                                                                                   | Correct | Success probability | Verdict                           |
| -------------------------------------------------------------------------------------- | ------: | ------------------: | --------------------------------- |
| **IPI-669 · SB-CI-002 — Run Edge Deno Unit Tests in CI**                               | **92%** |             **97%** | 🟢 Ship after two small fixes     |
| **IPI-681 · SB-SEC-003 — Prove Anonymous Data API and GraphQL Row Access**             | **78%** |             **88%** | 🟡 Safe after evidence correction |
| **IPI-679 · SB-SEC-001 — Inventory and Revoke Residual Anon SECURITY DEFINER EXECUTE** | **89%** |             **93%** | 🟢 Good security PR               |
| **IPI-680 · SB-SEC-002 — Disable or Scope pg_graphql Anon Table Exposure**             | **64%** |         **55% now** | 🔴 AC conflicts with REST grants  |
| **IPI-682 · SB-PERF-001 — Prioritize DB Advisor Findings from Workload Evidence**      | **91%** |             **95%** | 🟢 Strong, focused PR1            |
| **IPI-623 · CF-DB-009 — Migrate One Mastra Workload to Hyperdrive**                    | **60%** |         **20% now** | 🛑 Do not start                   |

## Critical errors and fixes

### IPI-669 · SB-CI-002 — Run Edge Deno Unit Tests in CI

The repository already has the correct secretless command and five focused test files.  Supabase officially recommends Deno’s native test runner and mocked `fetch` calls for deterministic Edge tests without a live project. ([Supabase][1])

**Errors:**

1. **Workflow-level path filtering is unsafe if this becomes a required check.** GitHub states that a workflow skipped by path filtering can remain Pending and block merging. ([GitHub Docs][2])
2. The existing command discovers `deno.lock`, but it does not explicitly fail when the lockfile is stale.
3. Dummy environment variables should only be added when tests genuinely require them; unnecessary variables can hide missing-environment defects.

**Critical fix:**

```text
Always-started workflow
→ optional job-level change detection
→ pinned Deno 2.9.2
→ deno test --frozen --allow-env ...
→ stable summary check
```

Deno supports `--frozen`, and `deno ci` provides strict lockfile installation. The official setup action can cache dependencies using the lockfile hash. ([GitHub][3])

**Verdict:** Ship now. The ticket is In Progress, assigned and unblocked.

---

### IPI-681 · SB-SEC-003 — Prove Anonymous Data API and GraphQL Row Access

The task correctly separates grants, RLS and executable HTTP evidence and correctly blocks only IPI-680.  Supabase confirms that grants control API reachability while RLS controls visible rows. ([Supabase][4])

**Critical error:**
`0 rows` does **not** prove that access is safe. The table might simply be empty.

**Missing evidence layers:**

1. Privileged metadata: table grant, RLS state and applicable policies.
2. Privileged total-row indicator such as `table_contains_rows = true/false`, without exposing row contents.
3. Anonymous HTTP result.
4. A finding should be conclusive only when:

   * the table contains data; and
   * anonymous access still returns no rows or a permission denial.

The anon-only Node script cannot independently enumerate PostgreSQL grants and policies unless that inventory is produced separately through MCP or trusted `psql`.

**Other missing item:** custom-schema REST probes such as `planner.instances` need the appropriate schema profile header; they cannot be queried exactly like `public` tables.

**Efficient output:**

```text
metadata-inventory.json
+ anonymous-http-results.json
→ one generated Markdown matrix
```

Never store row values—only status, count category, policy result and sanitized error code.

**Verdict:** Safe after the false-negative correction.

---

### IPI-679 · SB-SEC-001 — Inventory and Revoke Residual Anon SECURITY DEFINER EXECUTE

The refined task correctly revokes `PUBLIC`, `anon` and `authenticated`, rather than assuming that revoking only `PUBLIC` removes direct role grants.  Supabase explicitly documents revoking execution from both `PUBLIC` and the affected API roles, and recommends fixed `search_path` handling for `SECURITY DEFINER` functions. ([Supabase][5])

**Required corrections:**

* Resolve every exact signature at implementation time using `pg_get_function_identity_arguments` or `to_regprocedure`; do not rely on copied signatures.
* Search all repository, automation and external call sites before removing `authenticated`.
* Test all four outcomes:

  * `PUBLIC` has no execute;
  * `anon` has no execute;
  * `authenticated` has no execute;
  * `service_role` retains intended access.
* Add negative HTTP RPC probes for both anonymous and authenticated callers.
* Verify each priority function has a safe, fixed `search_path`.

**Missing prevention:** add a separate follow-up—or explicitly extend this task—to change default privileges for future functions. Supabase documents revoking default function execution from `PUBLIC`, `anon` and `authenticated`. ([Supabase][6])

**Verdict:** Strong task; likely to succeed.

---

### IPI-680 · SB-SEC-002 — Disable or Scope pg_graphql Anon Table Exposure

This is the weakest security task. It is correctly blocked by IPI-681, and authenticated GraphQL has been separated into **IPI-683 · SB-SEC-002b — Scope or Disable pg_graphql Authenticated Table Exposure**.

**Critical contradiction:**

The ticket wants to:

1. disable anonymous GraphQL globally; and
2. reduce `pg_graphql_anon_table_exposed` from 79 to zero.

These outcomes may not be equivalent.

Supabase GraphQL visibility is derived from the same PostgreSQL table privileges used by the Data API. Revoking table `SELECT` removes the GraphQL type, but it can also break intentional anonymous REST access. ([Supabase][7])

Revoking access to the GraphQL endpoint or `graphql_public` routine may stop anonymous GraphQL requests while the Advisor still reports table-level exposure. That is an inference from the Advisor’s table-exposure check and Supabase’s shared privilege model. ([Supabase][8])

**Critical fix:** change the acceptance criteria to:

```text
1. Anonymous GraphQL endpoint is proven unavailable; or
2. Its schema contains only explicitly approved public entities.
3. Anonymous REST flows remain green.
4. Remaining Advisor warnings are documented if they cannot be
   cleared without breaking required REST grants.
```

Add:

* pre-change GraphQL negative/positive test;
* post-change anonymous GraphQL denial test;
* anonymous REST regression matrix;
* rollback migration or configuration procedure;
* exact live routine/schema privileges before selecting Approach A.

**Verdict:** Do not implement the current “Advisor count must equal zero” requirement unchanged.

---

### IPI-682 · SB-PERF-001 — Prioritize DB Advisor Findings from Workload Evidence

This task is correctly limited to named iPix surfaces and explicitly avoids bulk-dropping 179 indexes.  Supabase recommends wrapping row-independent functions such as `auth.uid()` and `auth.jwt()` in `SELECT`, allowing PostgreSQL to evaluate them through an initPlan rather than once per row. ([Supabase][9])

**Improvements:**

* Do not use only the global target `146 → ≤130`; unrelated migrations can change that count.
* Assert that each named policy disappears from the `auth_rls_initplan` findings.
* Capture the old and new policy expression exactly to prove authorization logic did not change.
* Run relevant owner/non-owner RLS probes for every modified table.
* Include at least one representative query plan or timing from a populated table.
* Confirm columns used in the policies have appropriate indexes; Supabase recommends indexing policy filter columns. ([Supabase][9])

**Better completion rule:**

```text
All 16 named findings removed
+ same authorization truth table
+ verify-rls green
+ no unrelated policies changed
```

**Verdict:** Production-safe PR1 with minor acceptance-criteria refinement.

---

### IPI-623 · CF-DB-009 — Migrate One Mastra Workload to Hyperdrive

The ticket is correctly Backlog and blocked by IPI-619, IPI-620, IPI-621 and IPI-624. 

The repository confirms the current Worker:

* uses `MASTRA_STORAGE_MODE=noop`;
* aliases `@mastra/pg`, `pg` and `pg-cloudflare` to stubs;
* therefore cannot run the real Mastra Postgres store.

The application explicitly falls back to `InMemoryStore` on Workers and rejects the real Postgres mode while the stub remains.

**Critical scope error:**
`ai_agent_logs` is an application audit/logging table, not a Mastra persistence workload. Using it proves a **Hyperdrive SQL helper**, but does not prove Mastra storage or PostgresStore compatibility.

Choose one:

| Option                       | Correct task                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Keep `ai_agent_logs`         | Rename to **IPI-623 · CF-DB-009 — Prove One Hyperdrive SQL Workload**                                        |
| Keep “Mastra workload” title | Select an actual Mastra thread, message or memory operation after IPI-620 proves PostgresStore compatibility |

**Authorization blocker:** Hyperdrive provides a direct PostgreSQL connection through a database driver. It does not automatically carry a Supabase end-user JWT. Therefore `auth.uid()`-based ownership cannot be assumed; IPI-621 must define how the database role, transaction context or explicit parameterized tenant filter establishes authorization. This is an inference from Cloudflare’s direct-driver architecture and Supabase’s rule that `auth.uid()` is null without authenticated request context. ([Cloudflare Docs][10])

Cloudflare also recommends using the Supabase **direct** connection rather than stacking Hyperdrive over Supavisor, and recommends `pg` with current supported versions. ([Cloudflare Docs][10])

For immediate read-after-write, the cache-disabled binding is correct because Hyperdrive does not invalidate cached reads after writes. ([Cloudflare Docs][11])

**Verdict:** Not ready. Start only after the binding, helper/spike, tenant model and monitoring are complete.

## Recommended sequence

```text
NOW
IPI-669 · SB-CI-002 — Run Edge Deno Unit Tests in CI

NEXT, parallel
├─ IPI-681 · SB-SEC-003 — Prove Anonymous Data API and GraphQL Row Access
└─ IPI-679 · SB-SEC-001 — Inventory and Revoke Residual Anon SECURITY DEFINER EXECUTE

AFTER IPI-681
IPI-680 · SB-SEC-002 — Disable or Scope pg_graphql Anon Table Exposure

INDEPENDENT PERFORMANCE PR
IPI-682 · SB-PERF-001 — Prioritize DB Advisor Findings from Workload Evidence

BLOCKED
IPI-623 · CF-DB-009 — Migrate One Mastra Workload to Hyperdrive
```

**Main blocker:** IPI-680’s zero-Advisor requirement conflicts with Supabase’s shared REST/GraphQL grant model.
**Highest-value correction:** make IPI-681 use privileged metadata plus anonymous HTTP evidence so empty tables cannot produce false-safe results.

I verified the current Linear specifications and repository state. The Supabase live SQL connector was unavailable during this pass, so current live counts were taken from the refreshed Linear evidence rather than independently re-queried.

[1]: https://supabase.com/docs/guides/functions/unit-test "Testing your Edge Functions | Supabase Docs"
[2]: https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow "Triggering a workflow - GitHub Docs"
[3]: https://github.com/denoland/setup-deno "GitHub - denoland/setup-deno: Set up your GitHub Actions workflow with a specific version of Deno · GitHub"
[4]: https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically "Breaking Change: Tables not exposed to Data and GraphQL API automatically · Changelog"
[5]: https://supabase.com/docs/guides/database/functions?example-view=sql&language=sql&queryGroups=example-view&queryGroups=language&utm_source=chatgpt.com "Database Functions | Supabase Docs"
[6]: https://supabase.com/docs/guides/api/securing-your-api "Securing your API | Supabase Docs"
[7]: https://supabase.com/docs/guides/graphql "GraphQL | Supabase Docs"
[8]: https://supabase.com/docs/guides/database/database-advisors?lint=0001_unindexed_foreign_keys&utm_source=chatgpt.com "Performance and Security Advisors | Supabase Docs"
[9]: https://supabase.com/docs/guides/database/postgres/row-level-security "Row Level Security | Supabase Docs"
[10]: https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-database-providers/supabase/ "Supabase · Cloudflare Hyperdrive docs"
[11]: https://developers.cloudflare.com/hyperdrive/concepts/query-caching/ "Query caching · Cloudflare Hyperdrive docs"

---

## Live verification stamp — 2026-07-18 (task-verifier + MCP + Linear rewrite)

notes-7 critical AC fixes were **confirmed correct** against live Advisor + repo stubs. Linear specs rewritten:

| Ticket | Correction applied |
| -- | -- |
| **IPI-669** | Always-start workflow · no top-level `paths:` · `--frozen` · summary job |
| **IPI-681** | Privileged metadata + `table_contains_rows` · `inconclusive_empty` · planner schema header |
| **IPI-680** | Dropped “Advisor must = 0”; endpoint unavailable OR approved-only + REST green |
| **IPI-679** | Live signatures · auth caller search · four-role assert · search_path · follow-up **IPI-684** |
| **IPI-682** | Per-policy leave initplan · before/after expressions · no global ≤130 Done gate |
| **IPI-623** | Primary = real Mastra thread/memory after 620; `ai_agent_logs` ≠ Mastra Done |
| **IPI-616↔629** | Cycle removed (notes-6) |

Live Advisor (MCP): anon DEFINER **13** · GraphQL anon **79** · GraphQL auth **107** · initplan **146**.

**Main remaining product risk:** implement 680 against new AC (not Advisor-zero). **Ship next:** IPI-669.
