# Merge Record

**Task:** [IPI-832 · ONB2-DB-001 — Onboarding Sessions, Atomic Materialization RPC, and Database Authorization Proof](https://linear.app/amo100/issue/IPI-832) (post-merge docs for slice A)
**PR:** #705 — docs · IPI-832 — PR #701 merge record and follow-ups
**Merge SHA:** `e981e0f419eae26ff3c62f66459bb1c55427e3ea` (merged to `main`)
**Merged:** 2026-08-01T02:11:51-04:00
**Recorded:** 2026-08-01

## Commit (squashed)

- `docs(ipi-832): align #705 merge docs with post-merge reality`

## Purpose

Adds the post-merge write-up for **IPI-832 · ONB2-DB-001** slice A after [#701](https://github.com/amo-tech-ai/lumina-studio/pull/701) landed on `main` (`91bf0395`). Corrects stale CI-agent claims (hold merge, migration not applied, slice B / **IPI-829** unfinished) and points at real remaining work: **IPI-891** / [#702](https://github.com/amo-tech-ai/lumina-studio/pull/702), **IPI-892**, **IPI-893** (pgTAP edges), and **IPI-894** (QA race).

**Single concern:** `tasks/design-docs/onboarding` post-merge docs for #701. No migrations, application code, or CI were touched, and **IPI-832** was not re-opened.

## Files / systems changed

| Path | Change |
| --- | --- |
| `tasks/design-docs/onboarding/ipi-832.md` | New — audit doc; marks slices A+B Done, adds scorecard, corrects Linear-vs-reality claims, links open children **IPI-893**/**IPI-894** (90 lines) |
| `tasks/design-docs/onboarding/pr-701-follow-up.md` | New — follow-up doc; status corrections, unresolved risks, missing-test list, deferred-scope trackers (48 lines) |
| `tasks/design-docs/onboarding/pr-701-merge-record.md` | New — merge record for #701; squashed commits, files changed, CI results, prod/QA apply status, rollback SQL (75 lines) |

No code, migration, or CI files were touched.

## Tests / CI at merge

- Test plan confirmed on the PR:
  - Diff limited to the three files under `tasks/design-docs/onboarding/`
  - Merge SHA in `pr-701-merge-record.md` matches `91bf039505f5616e5ce8c560327c041a28ece940`
  - Follow-up names **IPI-893** / **IPI-894** and does not instruct readers to hold #701/#703/#704
  - Rollback note warns to revert app (post-#703) before DROP
- Docs-only change; no build/test/CI pipeline runs required or affected.

## Production impact

None. This PR is documentation-only under `tasks/design-docs/onboarding/`; it does not touch migrations, application code, secrets, or CI configuration, and does not change the state of anything already applied to prod/QA under #701/#703.

## Known limitations

- Documents state as of 2026-08-01; any further schema/app changes (e.g. **IPI-893**, **IPI-894**, **IPI-891**/#702) will need their own follow-up/merge-record updates.
- Does not itself resolve the CI soft fails it documents (`supabase-linked-gates` → **IPI-891**/#702; `booking-gate` → **IPI-892**).

## Rollback / cleanup

None required — docs-only addition. If content needs correction, revert or edit the three files directly; no schema or app dependency exists on this PR's changes.

## Follow-ups

- **IPI-891** / [#702](https://github.com/amo-tech-ai/lumina-studio/pull/702) — ledger gap for remote-only `20260801051614`
- **IPI-892** — booking-gate QA IPv6
- **IPI-893** — harden `onboarding_sessions` RLS/RPC edge-case pgTAP coverage
- **IPI-894** — QA race: concurrent materialize returns identical org/brand