# Audit verdict

**Todo accuracy: 91/100.**
**Expected success after corrections: 97%.**

The work is correct, but the table is too serial and contains four scope/status inaccuracies.

## Critical fixes

| Severity | Finding                                                                                          | Correction                                                                                                                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🔴       | **IPI-670 · PLN-DATA-003B — Enforce Complete Workflow Phase Materialization** is marked Todo.    | It is already **In Progress**.                                                                                                                                                                       |
| 🔴       | **IPI-665 · SB-CI-001 — Linked Migration Drift, DB Lint, and Types Gates in CI** is marked Todo. | It is already **In Progress**.                                                                                                                                                                       |
| 🔴       | IPI-670 is described as “migration-only.”                                                        | It also requires focused changes to `scripts/verify-rls.mjs`. Call it **migration + focused database verification**, still one concern.                                                              |
| 🔴       | IPI-668 says “extend `verify-rls.mjs` only.”                                                     | It must also modify GitHub Actions so trusted CI runs the script and missing secrets fail.                                                                                                           |
| 🟡       | IPI-665 says only `SUPABASE_ACCESS_TOKEN` is needed.                                             | Document `SUPABASE_ACCESS_TOKEN`, project ref, and any required database password/link credentials. Remote types should use `--project-id`, not an assumed `--linked` types command. ([Supabase][1]) |
| 🟡       | IPI-665 and IPI-668 still show completed IPI-664 as a blocker.                                   | Remove the stale Linear blocker relation.                                                                                                                                                            |

## Main blocker

PR #427 remains open, mergeable, with 13 commits and seven files. Its description still incorrectly claims that migrations are inside the PR and still says 11 probes.

Before merging:

```text
rebase onto current main
confirm exactly seven app/probe files
update body to 25 probes and no migrations
rerun CI and verify-rls on the new HEAD
```

## More efficient execution model

Do not run the list as one long sequence. Use three lanes.

### Planner lane

```text
IPI-653 · PLN-DATA-003 — Rebase and merge PR #427
→ IPI-670 · PLN-DATA-003B — Phase completeness
→ IPI-650 · PLN-HUB-002 — Hub Create Plan UI
```

IPI-650 does **not** need to wait for IPI-665 or IPI-668 once IPI-653 and IPI-670 are Done.

Move **IPI-671 · PLN-ENG-001 — Normalize Planner Phase Starts to Business Days** from “Optional” to **Recommended before Hub launch** if the UI promises business-day scheduling. Otherwise Saturday starts will be visible to operators.

### CI lane

```text
IPI-665 · SB-CI-001
→ IPI-668 · SB-TEST-001
→ IPI-663 · CI Guardrail
```

Add a GitHub Actions concurrency group for linked Supabase jobs so two PRs do not run remote migration/RLS tests against the shared project simultaneously. GitHub supports job or workflow concurrency groups for exactly this purpose. ([GitHub Docs][2])

Use normal `pull_request` for internal trusted code. Fork and Dependabot runs do not receive normal repository secrets, and GitHub warns against executing untrusted PR code under `pull_request_target`. ([GitHub Docs][3])

### Edge lane

```text
IPI-667 · SB-EDGE-001
and
IPI-669 · SB-CI-002
```

These can run in parallel. Supabase officially recommends Deno unit tests with mocked network boundaries and no production dependency. ([Supabase][4])

For IPI-667, “one delete per PR” is unnecessarily expensive. Prefer:

1. One evidence/inventory decision.
2. One controlled cleanup PR or operation.
3. Execute an explicit delete command for each confirmed orphan.
4. Verify every endpoint individually.

Do not use broad pruning first.

## Task-specific improvements

| Task                                                                                       | Efficient improvement                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **IPI-653 · PLN-DATA-003 — Planner Instance Creation Service**                             | If rebasing 13 historical commits creates migration conflicts, rebuild from current `main` using the final seven-file diff.                                                                                                                                           |
| **IPI-670 · PLN-DATA-003B — Enforce Complete Workflow Phase Materialization**              | Add zero-phase, empty, missing, duplicate, cross-workflow and exact-set probes; assert no residual instance/task/event/assignment rows after every rejection.                                                                                                         |
| **IPI-665 · SB-CI-001 — Linked Migration Drift, DB Lint, and Types Gates in CI**           | Pin the CLI; compare PR-added migration filenames against dry-run output; generate types with `--project-id`; serialize linked jobs. Supabase confirms dry-run only prints migrations that would be applied—it is not a full schema-equivalence test. ([Supabase][5]) |
| **IPI-668 · SB-TEST-001 — Require Verify-RLS on Trusted CI, Expand Matrix, Assert Grants** | First make the existing suite mandatory; expand domain coverage separately to avoid one oversized PR.                                                                                                                                                                 |
| **IPI-650 · PLN-HUB-002 — Create Planner Instance Flow**                                   | Start immediately after IPI-670; do not wait for unrelated CI/Edge tasks.                                                                                                                                                                                             |
| **IPI-671 · PLN-ENG-001 — Normalize Planner Phase Starts to Business Days**                | Decide whether weekend normalization is a product requirement. If yes, land before IPI-650 launch.                                                                                                                                                                    |
| **IPI-672 · PLN-DATA-003C — Serialize Planner Creation Idempotency Keys**                  | Keep P3. No current corruption, so its placement is correct.                                                                                                                                                                                                          |

## Missing from the checklist

Add these:

```text
[ ] Remove completed IPI-664 blocker relations from IPI-665 and IPI-668
[ ] Add concurrency control for linked Supabase CI jobs
[ ] Verify rejected IPI-670 requests leave zero database rows
[ ] Decide whether IPI-671 gates Hub release
[ ] Update PR #427 body before merge
```

## Final decision

* **Will the plan succeed?** Yes.
* **Is the blocking path correct?** Yes: IPI-653 → IPI-670 → IPI-650.
* **Should CI work block the Hub UI?** No.
* **Should IPI-671 remain purely optional?** Only if weekend starts are accepted product behavior.
* **Should migration repair be used?** No. Supabase documents that it changes only migration-history records and is appropriate only when those records are factually wrong. ([Supabase][6])

[1]: https://supabase.com/docs/guides/deployment/managing-environments?utm_source=chatgpt.com "Managing Environments | Supabase Docs"
[2]: https://docs.github.com/actions/writing-workflows/choosing-what-your-workflow-does/control-the-concurrency-of-workflows-and-jobs?utm_source=chatgpt.com "Control the concurrency of workflows and jobs - GitHub Docs"
[3]: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows?utm_source=chatgpt.com "Events that trigger workflows - GitHub Docs"
[4]: https://supabase.com/docs/guides/functions/unit-test?utm_source=chatgpt.com "Testing your Edge Functions | Supabase Docs"
[5]: https://supabase.com/docs/reference/cli/supabase-db-push?utm_source=chatgpt.com "CLI Reference | Supabase Docs"
[6]: https://supabase.com/docs/guides/deployment/database-migrations?utm_source=chatgpt.com "Database Migrations | Supabase Docs"
