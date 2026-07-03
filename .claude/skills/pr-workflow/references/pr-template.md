# PR body, sign-off, waiver, and quick-checklist templates

## PR title

```
[IPI-XXX] SPEC-ID — Short task name
```

## PR body

```markdown
## Summary
One paragraph — what and why (MVP proof #N if applicable).

## Changes
- Bullet list of files/behavior

## Verification
Paste command output or ✅ with date:
- [ ] `infisical run -- npm run build` (root — if `src/` touched)
- [ ] `infisical run -- npm run test`
- [ ] `infisical run -- npm run supabase:verify`
- [ ] `infisical run -- npm run supabase:verify-rls`
- [ ] `cd app && npm run lint && npm run build && npm test` (if `app/**` touched)
- [ ] (conditional verify scripts — see `verify-matrix.md`)

Mark `[x]` only after the command actually passed on the PR branch — not aspirationally.

## Screenshots / evidence
- UI: `docs/ecommerce/evidence/YYYY-MM-DD/<slug>/`
- Commerce: link to evidence md
- Edge/AI: verify script excerpt

## Risks
Blast radius, rollback notes

## Rollback
How to revert safely

## Linear
IPI-XXX · Full task name — https://linear.app/ipix/issue/IPI-XX
```

## Sign-off comment (post after every thread is resolved)

```markdown
## Review sign-off — all threads resolved ✅
| Finding | Fix | Commit |
|---------|-----|--------|
| … | … | `abc1234` |
Verified: `<commands>` on `<sha>`.
```

## Waiver (High/Critical findings only — put in both the PR body and the thread reply)

```
Bugbot/Human: <finding>
Waiver: <why safe for this PR> · Follow-up: IPI-XXX
```

## Quick checklist (copy into the PR description while working)

```
[ ] Branch ipi/<task>-<slug>
[ ] One Linear issue · plan references tasks/plan/todo.md row
[ ] graphify if multi-file · smallest safe diff
[ ] Base + conditional verify scripts green (verify-matrix.md)
[ ] Cursor PR Review / Bugbot — High/Critical fixed or waived
[ ] Each PR review thread: verify fix → reply → resolve on GitHub
[ ] All PR review threads resolved (GraphQL count = 0)
[ ] Assign PR Reviewers if >200 LOC or sensitive paths (migrations, RLS, auth, edge, secrets)
[ ] PR body Verification boxes [x] with date
[ ] Merge → Linear Done · issue md checkboxes · todo.md tracker updated (ipix-task-lifecycle Phase 5)
```

## Required evidence before merge

```
✅ Build passes (root and/or app/)
✅ Tests pass
✅ Verification output (paste or link)
✅ Screenshots if UI
✅ Evidence doc updated if user-facing / commerce / E2E
✅ Linear state → In Review (PR open) → Done (merged)
✅ docs/linear/issues/IPI-XX-*.md checkboxes updated when spec changed
✅ tasks/plan/todo.md Progress Task Tracker row updated if a P0/MVP item moved
✅ Cursor PR Review run (link, or note "clean")
✅ All PR review threads resolved or waived in the PR body
```
