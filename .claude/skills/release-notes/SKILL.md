---
name: release-notes
description: >
  Draft a changelog.md entry from git log + closed Linear IPI issues since the last entry.
  Use after a batch of commits lands or before tagging a release, when you need human-readable
  release notes rather than the /release gate checklist (which checks readiness, not prose).
  Triggers: "write release notes", "update the changelog", "draft changelog entry",
  "summarize what shipped". Do NOT use for the pre-merge gate check — that's `/release`.
---

# Release Notes

Draft a new entry for root `changelog.md` — this repo already maintains one by hand, in
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) style with commit hashes and technical
detail (see the existing `[Unreleased]` section for the exact voice to match). This skill drafts
the next entry in that same style; it does not invent a new format or location.

**Announce at start:** "I'm using the release-notes skill to draft the next changelog entry."

## Steps

1. **Find the range.** Read `changelog.md`'s most recent dated entry to find the last commit it covered. Get everything since: `git log --oneline <last-known-commit>..HEAD`.
2. **Pull closed Linear context.** For each commit referencing an `IPI-NNN`/`IPI2-NNN` id, look up that issue (via the `linear` skill or MCP) for its title and acceptance criteria — this is what turns a commit subject into a real description of *what changed and why*, matching the existing entries' level of technical detail (bug root causes, security hardening specifics, migration ids).
3. **Group by theme, not by commit.** Match the existing file's structure: a dated header naming the ticket/feature, then sub-bullets per commit with the commit hash inline (`` `2c8affb` ``), same as the current `[Unreleased]` section. Don't just paste `git log` output — synthesize what a reader who wasn't in the room needs to know.
4. **Draft under `[Unreleased]`**, above the existing entries (newest first, matching the file's stated order).
5. **Show the user the draft entry before writing it** — this is prose describing shipped work, not a mechanical transform; get a sanity check before it goes in.

## What this skill does NOT do

- Doesn't run any gates (typecheck/build/CI) — that's `/release`.
- Doesn't cut a version number or tag — this repo's changelog uses dated `[Unreleased]` entries, not semver sections, so don't introduce version numbers unless the user asks for them.
- Doesn't touch Linear issue status — read-only against Linear.

## Save to

`changelog.md` (repo root) — edit in place, inserting the new entry at the top of `[Unreleased]`. This is a docs-only change per the repo's one-concern-per-PR rule — don't bundle it with code changes.
