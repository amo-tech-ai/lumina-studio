# PR #695 — Merge Record

**Task:** IPI-884 · CHLOG-003 — Make the weekly SHIPPED draft workflow actually run
**PR:** `IPI-884 · CHLOG-003 — Make the weekly SHIPPED draft workflow actually run` (#695)
**Merge SHA:** `67184d6fa293428f719a7c32b9ee63a1d3efa5c8` (squash, `main`)
**Author:** amo-tech-ai (Claude Code co-author) · **Merged:** 2026-07-31 18:07:52 -0400

---

## Purpose

Fix `.github/workflows/shipped-weekly.yml`, shipped in #692, which had never completed a run and would have failed on its first scheduled fire (Fri 2026-08-07 16:00 UTC) and then failed differently every week after on its own recovery path. Four reproduced defects were corrected: the week heading was derived from `SINCE` instead of the period end (colliding with an existing `SHIPPED.md` section on first run), the resume path ran `git checkout` after the scaffold step had already dirtied the working tree, the generated section was missing its trailing `---` rule, and `gh … | grep -q` could fail open on PR-existence checks. Two additional guards were added for a missing `SHIPPED.md` and a duplicate `## Week of` heading, coordinated through a single `proceed` output shared by the scaffold and PR-creation steps. A second review round (folded into the same PR/merge) further hardened the duplicate-week path to fail loudly with the collected merge list instead of silently discarding work, and switched the resume path to an isolated `git worktree` instead of an in-place checkout.

## Files / systems changed

- `.github/workflows/shipped-weekly.yml` — **only file touched** (+145/-17):
  - Week heading now anchored on the covered period's **end** date, not `SINCE` (08-07→08-03, 08-14→08-10, 08-21→08-17 — distinct every week)
  - Manual `workflow_dispatch` collection bounded to an explicit seven-day range; only the cron run stays open-ended
  - Added a shared `proceed`/`reason` output from the `collect` step, gating both the scaffold and PR-creation steps
  - Guards added for missing `SHIPPED.md` and a duplicate `## Week of <week>` heading (duplicate-week now fails the job with the collected `#NNN` list and recovery guidance rather than discarding merges)
  - Scaffold output now ends with a trailing `---` separator
  - Existing-PR detection changed from `gh … | grep -q` (fails open on SIGPIPE/pipefail) to an assigned variable, scoped to `--state open` only
  - Resume path (branch pushed, no PR) no longer runs `git checkout "$BRANCH"` in-place (which collided with scaffold changes and aborted under `set -e`); it now refreshes the remote branch via an isolated `git worktree`
  - Comments added documenting the repo-level "Allow GitHub Actions to create and approve pull requests" requirement and the fact that PRs opened with `GITHUB_TOKEN` do not trigger `on: pull_request` Actions workflows
- No application code, migrations, endpoints, or other workflow files changed.

## Tests / CI results

- No runtime test categories apply (CI/config-only, single workflow file) — logic was extracted and exercised directly.
- Static/logic harness: **59/59 assertions passing** across two review rounds (initial 34/34, then 42/42 including 8 new after the dispatch-window fix, plus further coverage in the final round), covering: week-heading correctness and the exact regression case (old formula → `2026-07-27`, already present in `SHIPPED.md`; new formula → `2026-08-03`, absent), the `proceed` gate (missing file / zero PRs / duplicate week / happy path), the trailing `---` rule via a real `awk` run against the real `SHIPPED.md`, removal of the anti-patterns (`grep -q` pipeline, in-place checkout), YAML schema validation (jobs/cron/step count), and `bash -n` on all four `run:` bodies.
- End-to-end verification succeeded after a repo owner enabled "Allow GitHub Actions to create and approve pull requests": `workflow_dispatch` run `30667545213` created draft PR #696 (labelled `no-changelog`); a second run `30667660066` detected the existing open PR, created no duplicate, and exited 0. Generated output was confirmed to have a Monday heading, exactly one occurrence, a trailing `---`, and six Keep-a-Changelog headings. The test PR and branch were deleted afterward; `SHIPPED.md` on `main` was left unchanged by the test.
- Pre-push gate: 244 test files · 2511 passed · 12 skipped, typecheck clean (not meaningful for this diff — zero `app/**` changes — but run rather than bypassed).
- `actionlint` was not run: the ticket called for it, but no working npm-distributed binary was available (`npx -y actionlint` and `@rhysd/actionlint` both fail to resolve to a runnable binary) and installing a Go binary unilaterally was avoided. Substituted with YAML schema parsing and `bash -n` on all `run:` bodies, which catches syntax but not GitHub expression/context errors — recorded as a known gap rather than silently skipped.

## Production impact

CI/config-only change, one file, no application code touched. Functionally, this is what makes the previously non-functional `shipped-weekly` cron able to complete a run at all: it can now open a draft PR that adds a `## Week of <date>` section to `SHIPPED.md`, or exit cleanly with a stated reason when there is nothing to do. It also unblocks the `changelog-staleness` gate (added alongside the original workflow), which depends on this job actually producing weekly catch-up drafts. Required to actually run: the repository setting "Allow GitHub Actions to create and approve pull requests" was flipped on by a repo owner as part of this verification (confirmed in the PR objectives/comments); `default_workflow_permissions` remains `read`, and only this workflow calls `gh pr create`.

## Known limitations

- PRs opened by this workflow via `GITHUB_TOKEN` do not trigger `on: pull_request` GitHub Actions workflows (recursion prevention) — measured on the test PR #696: 3 GitHub App checks present (Vercel Preview Comments, Vercel deploy, Supabase Preview), 0 Actions runs, including `changelog-staleness`. This is harmless while `main` is unprotected, but once IPI-794 (CF-GOV-001 — Protect Main with a GitHub Ruleset) makes `changelog-staleness` required, this workflow's own PRs would become unmergeable and the `no-changelog` label would not help, since the check never runs to read it. Documented as a fix-later item, not addressed in this PR.
- `actionlint` was not run against the workflow (see Tests/CI above) — covered instead by YAML schema parsing and `bash -n`, which does not catch GitHub Actions expression/context errors.
- The duplicate-week guard cannot automatically merge newly collected PR entries into an existing hand-edited `## Week of` section (the scaffold's `#NNN` list is deleted once a human rewrites it into prose); it fails the run with the merge list and manual recovery guidance instead.

## Rollback / cleanup notes

- Single-file, workflow-only change — revertable with a straight `git revert 67184d6` if the new behavior needs to be undone; no migrations, feature flags, secrets, or deployed infrastructure to clean up.
- The end-to-end verification's throwaway draft PR (#696) and its branch were already deleted as part of testing; `SHIPPED.md` on `main` was confirmed unchanged by that test run.
- No changes to `default_workflow_permissions` (remains `read`); the "Allow GitHub Actions to create and approve pull requests" toggle change is a repo-admin setting, not part of this diff, and would need to be reverted separately by a repo owner if this workflow is ever disabled.

## Follow-up tasks

- IPI-885 · CHLOG-004 — Review/adjust the `changelog-staleness` gate in `ci.yml` now that this workflow can actually produce weekly drafts.
- IPI-887 · CHLOG-005 — Re-date the four `SHIPPED.md` entries filed under the wrong week (sequencing note: land before or after this PR's duplicate-week guard, but not concurrently against `SHIPPED.md`).
- IPI-886 · STACK-DOCS-002 — `docs/stack/` factual corrections (out of scope here).
- IPI-794 · CF-GOV-001 — Branch protection / GitHub Ruleset on `main`; will make the `GITHUB_TOKEN`-triggered-workflow limitation above load-bearing once enacted.
- Run `actionlint` against `.github/workflows/shipped-weekly.yml` once a viable install path (e.g., downloading the Go binary deliberately) is agreed, to catch GitHub expression/context errors not covered by the current YAML/`bash -n` checks.