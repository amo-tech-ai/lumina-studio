# Audit verdict

**Overall: 89/100 — correct and executable after a few CI corrections.**

There is **no reason to block PR #427** on phase completeness. The correct boundary is:

> Rebase and merge **IPI-653 · PLN-DATA-003 — Planner Instance Creation Service**, then require **IPI-XXX · PLN-DATA-003B — Enforce Complete Workflow Phase Materialization** before starting **IPI-650 · PLN-HUB-002 — Create Planner Instance Flow**.

PR #427 remains open and mergeable with 13 commits and seven app/probe files. Its existing CI passed, but that result belongs to the pre-rebase commit and must be rerun. 

## Errors and red flags

| Severity | Finding                                                                                 | Correction                                                                                                                                                                                                                               |
| -------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🔴       | The IPI-665 types command uses `supabase gen types typescript --linked`.                | Use the officially documented `--project-id "$SUPABASE_PROJECT_ID"` form with `--schema public,planner,graphql_public`. `--linked` is not the documented remote type-generation method. ([Supabase][1])                                  |
| 🔴       | The plan says only `SUPABASE_ACCESS_TOKEN` is required.                                 | CI also needs `SUPABASE_PROJECT_ID` and `SUPABASE_DB_PASSWORD` for linking and database commands. ([Supabase][2])                                                                                                                        |
| 🔴       | Trusted Supabase checks could expose production credentials if implemented incorrectly. | Use `pull_request` with a same-repository guard. Explicitly skip forks and Dependabot. Never checkout PR code under `pull_request_target` with secrets. ([GitHub Docs][3])                                                               |
| 🟡       | The plan implies migration checks prove SQL/schema equivalence.                         | `migration list` compares **timestamps only**. `db push --dry-run` lists migrations that would run; it does not prove their SQL matches the live schema. Rename the gate to **ledger and pending-migration validation**. ([Supabase][4]) |
| 🟡       | `Branching main = MIGRATIONS_FAILED` conflicts with “drift = 0.”                        | Mark this as a historical branch-run failure until the branch is retried or recreated. Supabase recommends inspecting branch logs and recreating failed preview branches when necessary. ([Supabase][5])                                 |
| 🟡       | Completed items remain active in the priority and production-readiness sections.        | Mark migration reconciliation and chatbot grants complete. Record HIBP as an accepted plan limitation rather than an indefinitely failing production gate.                                                                               |
| 🟢       | `supabase projects list` is included as a CI step.                                      | Remove it. It does not validate schema safety and adds an unnecessary API call.                                                                                                                                                          |

## More efficient execution order

Your current sequence places PLN-DATA-003B before IPI-665. A more efficient order is:

1. Rebase and merge **IPI-653 · PLN-DATA-003 — Planner Instance Creation Service**.
2. In parallel, finish **IPI-665 · SB-CI-001 — Linked Migration Drift, DB Lint, and Types Gates in CI**.
3. Merge IPI-665.
4. Implement **IPI-XXX · PLN-DATA-003B — Enforce Complete Workflow Phase Materialization** through the new migration CI gate.
5. Unblock **IPI-650 · PLN-HUB-002 — Create Planner Instance Flow**.
6. Publish the final `tasks/prime/*` documentation in one docs-only PR.
7. Complete **IPI-663 · CI Guardrail — Reject docs()-Titled PRs Containing Non-.md Files**.
8. Run IPI-667, IPI-668 and IPI-669 in parallel where practical.

This lets PLN-DATA-003B become the first real migration proving the IPI-665 gate works.

## Efficient method for each task

| Task                                                                                       | Fastest safe implementation                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **IPI-653 · PLN-DATA-003 — Planner Instance Creation Service**                             | Try a normal rebase. If obsolete migration commits cause conflicts, rebuild the branch from current `main` using only the final seven changed paths, then force-push with `--force-with-lease`. Refresh the PR body and rerun all gates. |
| **IPI-XXX · PLN-DATA-003B — Enforce Complete Workflow Phase Materialization**              | One forward migration plus focused live probes. Compare workflow phase count, submitted count and distinct submitted phase IDs. Do not add a global `(instance_id, phase_id)` uniqueness constraint.                                     |
| **IPI-XXX · PLN-ENG-001 — Normalize Planner Phase Starts to Business Days**                | First freeze the intended rule: weekend input and post-Friday transitions move to Monday. Then change only the central PlannerEngine helper and its tests. Keep it separate from database work.                                          |
| **IPI-XXX · PLN-DATA-003C — Serialize Planner Creation Idempotency Keys**                  | File as P3 Backlog only. Implement a transaction-level advisory lock later if duplicate-submission behavior becomes operationally important. PostgreSQL supports advisory locks for application-defined serialization. ([PostgreSQL][6]) |
| **IPI-665 · SB-CI-001 — Linked Migration Drift, DB Lint, and Types Gates in CI**           | One reusable script plus one trusted CI job. Pin the Supabase CLI, add a workflow concurrency group, use the PR merge-base to identify allowed migration files, and generate types with `--project-id`.                                  |
| **IPI-668 · SB-TEST-001 — Require Verify-RLS on Trusted CI, Expand Matrix, Assert Grants** | Reuse IPI-665’s secret/context preflight instead of duplicating YAML. Add only the required verify-RLS and grant assertion steps.                                                                                                        |
| **IPI-667 · SB-EDGE-001 — Quarantine Legacy FashionOS Edge Functions Not in Repo**         | Create one inventory table: deployed function, repo source, caller, recent logs, JWT mode, keep/delete decision. Delete confirmed orphans individually.                                                                                  |
| **IPI-669 · SB-CI-002 — Run Edge Deno Unit Tests in CI**                                   | Test only repo-owned retained functions, pin Deno, mock secrets and external APIs, and use path filters.                                                                                                                                 |
| **IPI-663 · CI Guardrail — Reject docs()-Titled PRs Containing Non-.md Files**             | Compare the event’s exact base and head SHAs rather than relying on a changing branch comparison. Keep this as a tiny CI-only PR.                                                                                                        |

## Verified correct architecture choices

These parts should remain unchanged:

* Hyperdrive should connect to Supabase’s **direct** database endpoint because Hyperdrive already provides pooling; use `pg` or Postgres.js rather than `supabase-js` for that path. ([Cloudflare Docs][7])
* `SECURITY DEFINER` functions should use a pinned or empty `search_path`, revoke default execution, and grant only the required role. ([Supabase][8])
* No additional `migration repair` is justified while the ledger remains aligned. Supabase states that repair changes the history table only and should be used only when the recorded state is wrong. ([Supabase][9])

## Final blockers

Only two immediate blockers remain:

1. **PR #427 must be rebased and retested.**
2. **IPI-665’s CI design must correct the types command, required secrets and trusted-PR security model.**

Linear search found no existing duplicate issues for PLN-DATA-003B, PLN-ENG-001 or PLN-DATA-003C, so those three titles are safe to create.

[1]: https://supabase.com/docs/guides/api/rest/generating-types?utm_source=chatgpt.com "Generating TypeScript Types | Supabase Docs"
[2]: https://supabase.com/docs/reference/cli/supabase-db-diff?utm_source=chatgpt.com "CLI Reference | Supabase Docs"
[3]: https://docs.github.com/en/actions/reference/security/secure-use?utm_source=chatgpt.com "Secure use reference - GitHub Docs"
[4]: https://supabase.com/docs/reference/cli/supabase-db-push?utm_source=chatgpt.com "CLI Reference | Supabase Docs"
[5]: https://supabase.com/docs/guides/deployment/branching/troubleshooting?utm_source=chatgpt.com "Troubleshooting | Supabase Docs"
[6]: https://www.postgresql.org/docs/17/explicit-locking.html?utm_source=chatgpt.com "PostgreSQL: Documentation: 17: 13.3. Explicit Locking"
[7]: https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-database-providers/supabase/?utm_source=chatgpt.com "Supabase · Cloudflare Hyperdrive docs"
[8]: https://supabase.com/docs/guides/database/functions?example-view=sql&language=sql&queryGroups=example-view&queryGroups=language&utm_source=chatgpt.com "Database Functions | Supabase Docs"
[9]: https://supabase.com/docs/guides/deployment/database-migrations?utm_source=chatgpt.com "Database Migrations | Supabase Docs"
