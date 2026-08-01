---
description: "PR status router — read-only state banner, recommends the next command."
argument-hint: "[PR#]"
allowed-tools: ["Bash", "Read"]
---

# /pr — PR status router (read-only)

Reports state and names the next command. **Never** commits, pushes, resolves, or undrafts —
those live in [`/pr-fix`](pr-fix.md).

## Injected context

- Branch: !`git branch --show-current`
- Toplevel: !`git rev-parse --show-toplevel`
- Uncommitted: !`git status --porcelain | wc -l`
- Diff vs main (first 20): !`{ git diff main...HEAD --stat 2>/dev/null || git diff --stat HEAD; } | head -20`
- Recent commits: !`git log -5 --oneline`
- Local HEAD: !`git rev-parse HEAD`
- Open PR: !`gh pr view $ARGUMENTS --json number,url,headRefName,headRefOid,isDraft,mergeable,statusCheckRollup 2>/dev/null || echo "no open PR"`

## Output

Report Branch · HEAD-vs-`headRefOid` · uncommitted count · PR state · CI · unresolved threads
(GraphQL query in [`/pr-fix`](pr-fix.md#merge-blockers--source-of-truth) — only these block
merge), then the next command from the table below. Then **stop**.

| State | Next |
|-------|------|
| On `main` with feature work | **STOP** → `npm run worktree:add -- IPI-NNN slug` |
| HEAD ≠ `headRefOid` | **STOP** → `cd` to the PR worktree |
| No PR, work uncommitted | `/review-pr` → commit → `gh pr create --draft` |
| Unresolved threads > 0 | `/pr-fix <N>` |
| Fixes local, not pushed | `/pr-fix <N> ship` |
| Fixes pushed, threads open | `/pr-fix <N> resolve` |
| Draft, threads 0, CI green | `/pr-fix <N> ready` |
| Ready, threads 0, CI green | merge when a human approves |
| Worktrees piling up | `npm run worktree:audit` · `/clean-gone` |
