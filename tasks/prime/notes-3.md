# Concise audit

**Verdict: 92/100 — correct, well-scoped, and safe to implement after minor corrections.**

**IPI-670 · PLN-DATA-003B — Enforce Complete Workflow Phase Materialization** addresses a real database-boundary gap and correctly blocks **IPI-650 · PLN-HUB-002 — Create Planner Instance Flow**. It is currently In Progress, High priority, linked to IPI-671/IPI-672/IPI-665, and blocked by IPI-653.  

## Required corrections

| Severity | Finding                                                                        | Correction                                                                                                                                                                                                                                 |
| -------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 🔴       | Proof only shows a dry-run **after** applying.                                 | Run dry-run before applying and prove it lists exactly one IPI-670 migration. After applying, rerun and expect “linked project is up to date.” Supabase confirms `--dry-run` only prints migrations that would be applied. ([Supabase][1]) |
| 🔴       | Failure tests do not explicitly assert atomic cleanup.                         | For empty, missing and duplicate phases, verify zero new `instances`, `tasks`, `assignments` and `events`.                                                                                                                                 |
| 🟡       | `workflow phase count > 0` has no dedicated probe.                             | Add a workflow-with-zero-phases test returning typed `INVALID_INPUT`.                                                                                                                                                                      |
| 🟡       | The PR is called “migration-only,” but it may change `scripts/verify-rls.mjs`. | Describe it as **database migration + focused verification**. It is still one concern, but not literally migration-only.                                                                                                                   |
| 🟡       | Concurrent workflow edits remain a TOCTOU gap.                                 | State that completeness is validated against the phase set observed during the call. Workflow revision locking/versioning remains separate scope unless you choose to add it now.                                                          |
| 🟢       | Types regeneration is mentioned conditionally.                                 | Remove it from expected work. The function signature is unchanged, so generated TypeScript types should not change.                                                                                                                        |

## Best implementation

Use a new migration created with:

```bash
npx supabase migration new ipi670_enforce_complete_workflow_phases
```

Do not edit or repair previous history. Supabase recommends making remote schema changes through new migrations and using `migration repair` only when the tracking table is factually wrong. ([Supabase][2])

Use `CREATE OR REPLACE FUNCTION` with the **same nine-argument signature**. This preserves the existing function identity, ownership and permissions; dropping and recreating it could break dependencies and reset privileges. ([PostgreSQL][3])

Add the completeness check **after the existing task-field parsing and UUID validation**, so malformed `phaseId` values still return typed `INVALID_INPUT` instead of leaking a cast error.

Efficient validation:

```text
expected_count  = workflow phase count
submitted_count = jsonb_array_length(p_tasks)
distinct_count  = distinct submitted phaseId count

Reject when:
expected_count = 0
OR submitted_count <> expected_count
OR distinct_count <> expected_count
```

The existing per-task membership check can continue proving that every submitted phase belongs to the workflow. PostgreSQL provides `jsonb_array_length` and `jsonb_array_elements` for this exact kind of set validation. ([PostgreSQL][4])

Keep the existing `SECURITY DEFINER`, empty `search_path`, fully qualified relations and restricted `EXECUTE` grants. Supabase explicitly recommends a pinned search path and revoking default function execution when a definer function is necessary. ([Supabase][5])

## Minimum test matrix

| Test                                      | Expected                               |
| ----------------------------------------- | -------------------------------------- |
| Empty `p_tasks` with normal workflow      | `INVALID_INPUT`, no rows               |
| Workflow with zero phases                 | `INVALID_INPUT`, no rows               |
| One workflow phase omitted                | `INVALID_INPUT`, no rows               |
| Duplicate phase replacing a missing phase | `INVALID_INPUT`, no rows               |
| Phase from another workflow               | `INVALID_INPUT`, no rows               |
| Exact complete phase set                  | Success; task count equals phase count |
| Exact set replayed with same key          | `replayed: true`; no duplicate rows    |

## Efficient order for related tasks

| Task                                                                             | Most efficient path                                                                                                                                                                                      |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **IPI-653 · PLN-DATA-003 — Planner Instance Creation Service**                   | Rebase and merge PR #427 first. This avoids conflicts because IPI-670 also modifies `verify-rls.mjs`.                                                                                                    |
| **IPI-670 · PLN-DATA-003B — Enforce Complete Workflow Phase Materialization**    | Branch from the newly updated `main`; one function-replacement migration plus focused probes.                                                                                                            |
| **IPI-665 · SB-CI-001 — Linked Migration Drift, DB Lint, and Types Gates in CI** | Either run in parallel in a separate worktree or use IPI-670 as the first migration that proves the new CI gate.                                                                                         |
| **IPI-671 · PLN-ENG-001 — Normalize Planner Phase Starts to Business Days**      | One app-only PR changing the central scheduling helper and tests for weekend input plus Friday→Monday transitions. It should preferably land before IPI-650, but it is not a database-security blocker.  |
| **IPI-672 · PLN-DATA-003C — Serialize Planner Creation Idempotency Keys**        | Leave P3/Backlog. When implemented, acquire the transaction advisory lock after authorization and before the replay lookup, with a real parallel-call test.                                              |

## Final decision

* **Will IPI-670 succeed?** 🟢 Yes.
* **Production-ready specification?** 🟡 After adding zero-phase and no-residual-row assertions.
* **Does it need to block PR #427?** No.
* **Must it block IPI-650?** Yes.
* **Should migration repair be used?** No.
* **Expected success after corrections:** **97%**.

[1]: https://supabase.com/docs/reference/cli/supabase-db-push?utm_source=chatgpt.com "CLI Reference | Supabase Docs"
[2]: https://supabase.com/docs/guides/deployment/database-migrations?utm_source=chatgpt.com "Database Migrations | Supabase Docs"
[3]: https://www.postgresql.org/docs/current/sql-createfunction.html?utm_source=chatgpt.com "PostgreSQL: Documentation: 18: CREATE FUNCTION"
[4]: https://www.postgresql.org/docs/current/functions-json.html?utm_source=chatgpt.com "PostgreSQL: Documentation: 18: 9.16. JSON Functions and Operators"
[5]: https://supabase.com/docs/guides/database/functions?example-view=sql&language=sql&queryGroups=example-view&queryGroups=language&utm_source=chatgpt.com "Database Functions | Supabase Docs"
