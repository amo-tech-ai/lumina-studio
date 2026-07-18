# Audit verdict

The remediation plan is **mostly correct but now stale after PR #428 and PR #429 merged**.

**Current score: 86/100 — safe after three corrections.**

The next task is **not migration repair**. It is to refresh and finish **IPI-653 · PLN-DATA-003 — Planner Instance Creation Service**.

## Current verified state

| Area            | Current state                                   | Verdict                    |
| --------------- | ----------------------------------------------- | -------------------------- |
| PR #428         | Merged into `main`                              | 🟢 Complete                |
| PR #429         | Merged through the #428 stack                   | 🟢 Complete                |
| Migration drift | Reported as 203 matched, zero drift             | 🟢 Complete                |
| PR #427         | Open, mergeable, 7 changed files, no migrations | 🟡 Needs refresh           |
| PR #427 branch  | Still based on the old pre-IPI-664 `main`       | 🔴 Rebase required         |
| PR #427 CI      | Green at HEAD `90f235d9`                        | 🟡 Must rerun after rebase |
| IPI-653         | In Progress                                     | 🟢 Correct                 |
| IPI-662         | Duplicate of IPI-664                            | 🟢 No further work         |
| IPI-663         | Backlog                                         | 🟡 Useful, but not next    |

PR #427 currently changes only the app adapter, tests, generated types and live probe script—no migrations.  Its previous CI run passed, but that run predates the required rebase. 

---

# Critical findings

## 🔴 1. PR #427 must be rebased before merging

PR #427 still records the old `main` base from before the IPI-664 merge. 

Do not merge it using the current green checks. After rebasing:

1. Confirm the seven-file diff remains unchanged.
2. Confirm no old migration filename returns.
3. Rerun CI and the Supabase probes.
4. Merge only the newly tested HEAD.

### More efficient approach

Because the branch contains **13 historical commits**, including obsolete migration iterations, replaying every commit may create unnecessary conflicts.

Try a normal rebase first. If migration conflicts appear, rebuild the branch from current `main` using only the final seven-file diff rather than resolving obsolete migration history commit-by-commit.

---

## 🔴 2. The RPC does not enforce the ticket’s phase-materialization contract

This is the most important remaining data-integrity issue.

The IPI-653 contract says:

> Every workflow phase generates exactly one phase-anchor task.

It also says to enforce one generated phase-anchor task per instance and phase. 

However, the function currently:

* accepts an empty `p_tasks` array;
* checks only whether each supplied phase belongs to the workflow;
* does not require every workflow phase to be represented;
* does not reject duplicate phase IDs.

The function checks that `p_tasks` is an array but does not require it to be non-empty or complete.  It validates supplied phases individually but never compares the submitted phase set with the workflow’s complete phase set.

The current live-probe code even creates valid instances using `p_tasks: []`, confirming empty plans are treated as acceptable.

### Recommended correction

Create a small migration-only PR:

**IPI-XXX · PLN-DATA-003B — Enforce Complete Workflow Phase Materialization**

The RPC should reject the request unless:

```text
workflow phase count > 0
submitted task count = workflow phase count
distinct submitted phase IDs = workflow phase count
every submitted phase belongs to the selected workflow
```

Do **not** add a global unique constraint on `planner.tasks(instance_id, phase_id)`. Future workflows may intentionally contain multiple ordinary tasks within one phase. Enforce the one-anchor-per-phase rule inside `planner_create_instance`.

Because the final function is already on `main`, this must be a **new forward migration**. Do not edit the deployed migration. Supabase recommends forward migration history for deployed changes and warns against rewriting deployed versions. ([Supabase][1])

### Severity

**High / merge gate if IPI-653 must satisfy its written acceptance criteria.**

The fastest acceptable alternative is to merge PR #427 after rebase, but block **IPI-650 · PLN-HUB-002 — Create Planner Instance Flow** until this database correction lands.

---

## 🟡 3. “Business-day accurate” is overstated

The new app adapter uses `PlannerEngine.buildSchedule()`, but the existing engine still allows:

* a first phase to begin on Saturday or Sunday;
* the next phase to begin on Saturday when the previous phase ends Friday.

PR #427’s own test expects the second phase to begin on Saturday.  The production audit also identifies this as a real, pre-existing engine limitation. 

Therefore, update the claim from:

> Business-day-accurate dates

to:

> Phase durations skip weekend days, but phase start normalization remains a follow-up.

Create:

**IPI-XXX · PLN-ENG-001 — Normalize Planner Phase Starts to Business Days**

This should block the Planner creation UI launch if users must never receive weekend task starts. It does not need to block the app-adapter merge if the limitation is clearly documented.

---

# Non-blocking hardening

## Same-key concurrent retries

The function documents that two simultaneous requests using the same idempotency key can both miss the initial lookup. One succeeds; the other returns `INSTANCE_ALREADY_EXISTS` rather than a clean replay. No duplicate data is created.

This is not a release blocker, but a transaction-level advisory lock is the correct future improvement. PostgreSQL transaction advisory locks are released automatically when the transaction ends, making them suitable for short-lived serialization around an actor and idempotency key. ([PostgreSQL][2])

Suggested task:

**IPI-XXX · PLN-DATA-003C — Serialize Planner Creation Idempotency Keys**

Priority: **P3**.

---

# PR #427 description corrections

Before merge, update the description to state:

* **25 live scenarios**, not 11.
* PR #427 contains **no migrations**.
* The final nine-argument RPC migrations were delivered by merged PR #428.
* The branch was rebased onto the post-IPI-664 `main`.
* Business-day durations skip weekends, but weekend phase-start normalization remains deferred.
* Phase-set completeness remains a database follow-up unless fixed before merge.

The PR currently still describes round-5 and round-6 migrations as part of its own changes even though its present diff has only seven app/probe files. 

---

# Linear corrections

| Task                                                                                                       | Correction                                                                                     |
| ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **IPI-664 · SB-HYGIENE-001 — Reconcile Migration History, Enable HIBP, Tighten Service-Only Grants**       | Keep Done, but replace the stale pre-execution evidence and unchecked boxes with final results |
| **IPI-653 · PLN-DATA-003 — Planner Instance Creation Service**                                             | Keep In Progress until PR #427 merges                                                          |
| **IPI-662 · Supabase Migration Ledger Drift Repair — Rename Local Files to Match Applied Remote Versions** | Leave Duplicate; do not perform repair commands                                                |
| **IPI-663 · CI Guardrail — Reject docs()-Titled PRs Containing Non-.md Files**                             | Keep; execute after IPI-665 to avoid concurrent CI workflow conflicts                          |

IPI-662 is already correctly marked Duplicate of IPI-664. 

There is also a stale dependency relation: IPI-653 still appears to block completed IPI-664, while IPI-664 shows itself blocked by IPI-653. Remove that relationship because the ledger task is already Done.  

---

# Most efficient execution order

```text
1. Create the phase-completeness forward migration
   IPI-XXX · PLN-DATA-003B — Enforce Complete Workflow Phase Materialization

2. Merge that migration-only PR.

3. Refresh PR #427 onto current main.
   Prefer a clean seven-file branch rebuild if the 13-commit rebase causes migration conflicts.

4. Update PR #427’s description.

5. Run:
   migration list --linked
   db push --linked --dry-run
   supabase:verify-rls
   app typecheck
   app tests
   app build

6. Confirm the PR diff still contains exactly seven non-migration files.

7. Obtain a fresh review and merge PR #427.

8. Mark IPI-653 Done with final evidence.

9. Start IPI-665 · SB-CI-001 — Linked Migration Drift, DB Lint, and Types Gates in CI.

10. Then run:
    IPI-669 · SB-CI-002 — Run Edge Deno Unit Tests in CI
    IPI-668 · SB-TEST-001 — Require Verify-RLS on Trusted CI, Expand Matrix, Assert Grants
    IPI-663 · CI Guardrail — Reject docs()-Titled PRs Containing Non-.md Files
```

Supabase documents that `migration list` compares local and remote migration timestamps and that `db push --dry-run` previews pending migrations without applying them. With zero drift, do not run `migration repair`. ([Supabase][3])

## Final decision

| Question                                    | Verdict                             |
| ------------------------------------------- | ----------------------------------- |
| Is the original merge order still relevant? | 🟡 Partly—IPI-664 is already merged |
| Should PR #427 merge now?                   | 🔴 No—refresh and rerun first       |
| Is PR #427’s app architecture sound?        | 🟢 Yes                              |
| Is the database contract fully enforced?    | 🔴 No—phase completeness is missing |
| Is advisory-lock hardening required now?    | ⚪ No                                |
| Should migration repair be run?             | 🔴 No                               |
| Likelihood of success after corrections     | **95%**                             |

I could not independently query the live Supabase database because the connected Supabase tool denied project access. Live-state conclusions therefore use your successful probe evidence, GitHub’s current `main`, and the committed final migration.

[1]: https://supabase.com/docs/guides/deployment/database-migrations?utm_source=chatgpt.com "Database Migrations | Supabase Docs"
[2]: https://www.postgresql.org/docs/19/explicit-locking.html?utm_source=chatgpt.com "PostgreSQL: Documentation: 19: 13.3. Explicit Locking"
[3]: https://supabase.com/docs/reference/cli/supabase-db-push?utm_source=chatgpt.com "CLI Reference | Supabase Docs"
