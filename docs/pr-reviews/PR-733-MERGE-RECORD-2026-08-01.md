# PR #733 — Merge Record

**Task:** [IPI-854 · SUPABASE-DRIFT-001](https://linear.app/amo100/issue/IPI-854) — Document local-first migrations and remote-only recovery
**PR:** [#733](https://github.com/amo-tech-ai/lumina-studio/pull/733) — IPI-854 · SUPABASE-DRIFT-001 — Document Local-First Migrations and Remote-Only Recovery
**Merge SHA:** `39370466896f84d5ae5dd1bb95587d7296f76802` (`main`)
**Merged:** 2026-08-01 18:21:07 -0400

## Purpose

Documentation-only fix for a ticket whose original premise no longer held: IPI-854 assumed remote
migration `20260801091009` had no matching file in the repo. Investigation found the file already
existed on `main` (`ipi896_revoke_default_table_privileges`, landed via
[PR #719](https://github.com/amo-tech-ai/lumina-studio/pull/719), merged 09:20:32 — ten minutes
after the migration was applied to the remote at 09:10:09). No capture migration was written, since
doing so would have created a duplicate file for a version already accounted for.

Instead, this PR adds the missing process guidance to
`.claude/skills/ipix-supabase/references/project-rules/supabase-migrations.md`, which previously
had zero mentions of `remote`, `db push`, or `drift`: required order of operations (file → commit →
review → merge → apply → regenerate types), a ban on Dashboard SQL-editor schema changes, how to
check drift in `--main` vs `--pr` mode (including the stale-checkout false-positive trap), an
emergency remote-only recovery procedure (extract applied statements losslessly, recreate the file
at the exact remote version, do not re-apply), and the 2026-08-01 incident as a worked example.

## Files / systems changed

| Path | Change |
| --- | --- |
| `.claude/skills/ipix-supabase/references/project-rules/supabase-migrations.md` | +122/-0, docs only |

No migrations, application code, infrastructure, or production data were touched.

## Tests / CI results

Docs-only PR; no build/lint/test suite applies to code. Verification cited in the PR description:

- `node scripts/check-supabase-migration-drift.mjs --main` → `ok: main ledger aligned; dry-run up
  to date` (exit 0)
- `supabase migration list --linked` (281 rows) → zero remote-only, zero local-only entries

## Production impact

None. Documentation change only; no schema, RLS, grants, or application behavior modified.

## Known limitations

- The stale-checkout trap documented here is real and reproducible: a disk 6 commits behind
  `origin/main` reports drift that does not exist. The new docs warn about it but do not prevent it.
- No pre-push drift check was added by design (CI's `supabase-linked-gates` /
  `check-supabase-migration-drift.mjs` already covers this pre-merge; adding a Supabase network
  round-trip to the local pre-push hook was deliberately rejected as redundant and flaky).
- The drift gate still compares against the PR's *base* branch rather than `origin/main`, so a
  long-lived branch can keep reporting drift that `main` has already resolved (see Follow-ups).

## Rollback / cleanup notes

- Single-file, additive markdown change — revertable with `git revert 3937046` if guidance is later
  found inaccurate.
- No migrations, feature flags, secrets, or deployments to clean up.

## Follow-up tasks

- Decide the fate of worktree `wt-ipi-854-capture-remote-migrations`: 27 untracked files (mostly
  `supabase/migrations/2026073003*.sql` — RLS initplan wrapping, duplicate-index drops, permissive
  policy consolidation), 41 commits behind `main`. At least `20260730032032_wrap_auth_rls_initplan.sql`
  is confirmed not yet on `main`. Needs a decision before this uncommitted work is lost.
- Consider changing `supabase-linked-gates` to diff against `origin/main` regardless of the PR's
  base branch, so long-lived/stale-based branches stop reporting drift that `main` has already
  fixed (this is what caused PR #729 to fail at 09:34:51 for a different reason than the original
  09:10–09:20 drift window).