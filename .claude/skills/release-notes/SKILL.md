---
name: release-notes
description: >
  Draft a changelog.md or SHIPPED.md entry from merged PRs + closed Linear IPI issues
  since the last entry. Use after a batch of commits lands, before tagging a release, or
  when the changelog-staleness CI job blocks a PR. Triggers: "write release notes",
  "update the changelog", "draft changelog entry", "summarize what shipped",
  "changelog-staleness is failing". Do NOT use for the pre-merge gate check — that's `/release`.
---

# Release Notes

**Read [`CHANGELOG_STYLE.md`](../../../CHANGELOG_STYLE.md) first** — it holds the voice rules,
the anti-pattern table, and the two-audience split. This skill applies those rules; it does not
restate or override them.

Two files, two readers:

| File | Reader | Cadence | Grouping |
|------|--------|---------|----------|
| `changelog.md` | An engineer debugging this in six months | Every merged PR | By ticket / theme |
| `SHIPPED.md` | Teammate, stakeholder, prospect | Weekly | Keep a Changelog's six change types |

Ask which one is wanted if the request is ambiguous. "Update the changelog" almost always
means `changelog.md`.

⚠️ `changelog.md` does **not** follow Keep a Changelog, despite what an older header claimed —
entries group by ticket, there are no versions, SemVer isn't asserted. KaC's structure is used
in `SHIPPED.md` only.

**Announce at start:** "I'm using the release-notes skill to draft the next changelog entry."

## Steps

1. **Find the range.** Read the most recent dated entry to find the last commit it covered, then `git log --oneline --no-merges <last-known-commit>..HEAD`.

2. **Read the merged PRs, not just the commits.** This is the step that decides whether the
   entry is any good. PR titles and bodies carry the *why*; commit subjects carry a squashed
   *what*.

   ```
   gh pr list --state merged --base main --search "merged:>=YYYY-MM-DD" \
     --limit 100 --json number,title,url,mergedAt,body
   ```

   - Filter on `merged:>=` in the search, **not** on the REST `merged` field — that field is
     `false` for squash merges and silently drops everything.
   - A PR with no `mergedAt` did **not** ship. Superseded/duplicate PRs are common here; never
     list one as shipped.
   - Real example: commit subject *"stop booking-gate CI writing fixtures to production"* vs PR
     title *"Stop CI creating fake companies in the live database on every pull request"* (#641).
     Use the second.

3. **Read the migrations for anything touching the database.** Headers in
   `supabase/migrations/` state intent, plan, rollback, and the follow-up ticket. They are the
   most accurate documents in this repo, and skipping them has produced wrong entries before.
4. **Pull closed Linear context.** For each `IPI-NNN`/`IPI2-NNN` id, look up the issue (via the `linear` skill or MCP) for its title and acceptance criteria. Always pair an id with its title on first mention — `IPI-812 · BRAND-REG-003`, never a bare number.
5. **Group by theme, not by commit.** Nine Hyperdrive commits are one Hyperdrive paragraph. Commit hash inline (`` `2c8affb` ``), PR linked. Never paste `git log` output.
6. **Insert in the right place — the two files differ.**

   | File | Where |
   |------|-------|
   | `changelog.md` | Under `## [Unreleased]`, above the existing dated entries |
   | `SHIPPED.md` | Directly beneath the intro `---` rule, as a new `## Week of YYYY-MM-DD` section — there is **no** `[Unreleased]` heading in this file |

   `SHIPPED.md`'s structure is also written by `.github/workflows/shipped-weekly.yml`; keep the two in step.
7. **Show the user the draft before writing it** — prose describing shipped work, not a mechanical transform.

## Unblocking `changelog-staleness`

**Read the failure before acting on it.** The job measures the *base branch*, not the PR it
runs on. It fails when `changelog.md` on `main` has fallen more than `MAX_BEHIND` commits
behind — so the red check on someone's PR is almost never about that PR.

| Situation | Do |
|-----------|-----|
| A PR is red and its diff is unrelated to the changelog | **Do not add a changelog entry to that PR.** Open a separate docs-only PR that catches `changelog.md` up. That clears the check for every open PR at once |
| You are writing that catch-up PR | Draft it with this skill. `git log --oneline <last-changelog-commit>..origin/main` is the work list. **Rebase onto current `main` before merging** — the gate counts from when `changelog.md` was last committed, so a stale draft resets the budget without covering what landed while it sat in review |
| You are writing a `SHIPPED.md`-only PR | It will **not** satisfy this gate — the gate measures `changelog.md`. Use the `no-changelog` label, which the weekly workflow already applies to its own draft |
| Genuinely must merge before the debt can be paid | Apply the `no-changelog` label — break-glass, not routine |

Bundling a changelog entry into a code PR to turn the check green breaks `AGENTS.md`'s
one-concern rule, and the gate is designed so you never need to. Never add an empty or filler
entry either — that defeats the point and pollutes the record.

## What this skill does NOT do

- Doesn't run any gates (typecheck/build/CI) — that's `/release`.
- Doesn't cut a version number or tag — this repo's changelog uses dated `[Unreleased]` entries, not semver sections, so don't introduce version numbers unless the user asks for them.
- Doesn't touch Linear issue status — read-only against Linear.

## Save to

`changelog.md` or `SHIPPED.md` (repo root) — edit in place, newest entry first. Docs-only per
the one-concern-per-PR rule; never bundle with code changes.
