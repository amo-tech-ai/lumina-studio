# PR #693 — Merge Record

**Task:** CHLOG-001 — Changelog Governance: The Two-Audience Split *(internal task ID; no Linear IPI ticket exists for this work — inventing one would create an unresolvable reference. Author committed to retitling the PR if an issue is filed.)*
**PR:** `CHLOG-001 — Changelog Governance: The Two-Audience Split` (#693)
**Merge SHA:** `93d991748cb5a2941385d17d81eaf2a7fab30761` (squash, `main`)
**Author:** amo-tech-ai · **Merged:** 2026-07-31 13:12:41 -0400

---

## Purpose

Docs-only PR, split out of PR #691 after both reviewers flagged it against `AGENTS.md`'s one-concern rule. Establishes written changelog voice rules, splits the single engineering changelog into two audience-specific files, backfills 39 commits that had landed without a changelog entry, and documents the governance review behind the change — including why a per-PR changelog gate was rejected in favor of a `main`-branch staleness budget (shipped separately in PR #692).

## Files / systems changed

- `CHANGELOG_STYLE.md` (new, +106/-0) — voice rules for `changelog.md` (8 rules) and `SHIPPED.md` (5 rules), plus an anti-pattern table.
- `SHIPPED.md` (new, +72–74/-0) — weekly plain-language digest using Keep a Changelog's six change types; first entry for week of 2026-07-27, plus a quiet-week entry for 2026-07-20 and a reusable template.
- `changelog.md` (edit, +98/-4) — removed the "loosely follows Keep a Changelog" header claim, linked out to `CHANGELOG_STYLE.md` and `SHIPPED.md`, and backfilled the 2026-07-26 → 07-31 gap (39 commits: access-control hardening, Hyperdrive, Worker bundle, Brand Intelligence, onboarding, migrations/CI/DX) plus two new dated entries for the docs/stack audit (#691) and this changelog split (#693).
- `docs/changelog/PRACTICE.md` (new, +368/-0) — the governance review: current-state audit, tool-landscape comparison (rejected installing any of five competing changelog skills), Keep a Changelog conformance assessment, the two-file model rationale, and the CI staleness-gate design (implemented in #692).
- No production code, infrastructure, database, or secrets touched — confirmed by the PR's own verification: `git diff --name-only origin/main...HEAD` → 4 files, all `.md`.

## Tests / CI results

- Documentation-only change; no application build, lint, or test suite applies.
- Verification performed and recorded in the PR:
  - `git rev-list --count aa5d433..origin/main` → **39** (commits since the last change any entry covered)
  - `git rev-list --count 3fee13b..origin/main` → **36** (commits since `changelog.md` was last touched)
  - Every backfilled PR checked for a `merged_at` timestamp before being listed as shipped; five superseded/closed-unmerged PRs (#659, #679, #684, #685, #687) were deliberately excluded.
- No CI pipeline result recorded in the merged PR context beyond the standard merge.

## Production impact

None. Docs-only — no `app/` source, Wrangler config, Supabase schema/grants, or CI workflow files are in the diff. The staleness-gate CI job described in `PRACTICE.md` is documentation of a design; it is implemented and enforced separately in PR #692.

## Known limitations

- The two-file split (`changelog.md` / `SHIPPED.md`) is **provisional** until the `release-notes` skill is updated in PR #692 — until then, the skill still drafts only `changelog.md` in its own embedded style, so following `CHANGELOG_STYLE.md` by hand is required.
- The staleness metric documented in `PRACTICE.md` §6 measures last **file touch**, not last **commit covered** — a 3-commit under-reporting gap (36 vs. 39) that the gate will always have unless GitHub branch protection ("require branches to be up to date before merging") is enabled. That protection does not currently exist on `main` (tracked as IPI-763 · Branch protection residual).
- Onboarding screen count in the backfilled entry is deliberately left unasserted — the source PR (#657) claimed "13 screens" but the merged tree shows ~7 distinct components plus shared chrome; the discrepancy is noted rather than resolved.
- Root cause of the recurring `public.mastra_*` / `chatbot_*` / `lead_intake_drafts` ACL drift (three occurrences) remains unknown, tracked separately as IPI-876 · MASTRA-PG-014.

## Rollback / cleanup notes

- All four files are new or additive edits to markdown; revertable with `git revert 93d9917` if content is later found inaccurate.
- No migrations, feature flags, secrets, or deployments to clean up.
- Five secondary changelogs (`tasks/changelog.md`, `tasks/cloudflare/changelog.md`, `linear/changelog.md`, and two design-import copies) are flagged in `PRACTICE.md` §5/§8 for archival but were **not** touched or archived by this PR — a basename-based link sweep is called out as a prerequisite (needed to catch relative links like `tasks/cloudflare/todo.md:5` → `./changelog.md`).

## Follow-up tasks

- Merge PR #692 (CHLOG-002 — Changelog Staleness Gate, Weekly SHIPPED Draft Job, and Release-Notes Skill Update) — this PR must land before it, since #692's gate measures `main` and would otherwise go red across all open PRs.
- Point the `release-notes` skill at `CHANGELOG_STYLE.md` and the two-file split (`PRACTICE.md` §8, task 8).
- Sweep and archive the five secondary changelogs by basename, not full path (`PRACTICE.md` §8, task 7).
- Add the Friday-scheduled job that drafts `SHIPPED.md` from the week's merges (`PRACTICE.md` §8, task 6).
- Investigate the root cause of the recurring ACL/grant drift (IPI-876 · MASTRA-PG-014), referenced but not resolved in the backfilled entry.