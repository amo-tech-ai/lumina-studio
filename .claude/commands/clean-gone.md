---
description: "Remove local branches and worktrees whose upstream was deleted after merge."
allowed-tools: ["Bash"]
---

# /clean-gone — Stale branch + worktree cleanup

**Inspired by:** [Anthropic commit-commands /clean_gone](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/commit-commands)

**Rule:** `@pr-workflow` · maintenance only — no product code changes.

---

## Injected context

- Current branch: !`git branch --show-current`
- Fetch status: !`git fetch --prune --dry-run 2>&1 | head -5 || git remote -v`
- Gone branches: !`git branch -vv | grep ': gone]' || echo "none (run git fetch --prune first)"`

---

## Workflow

0. **Audit first** — get the full worktree health picture before touching anything:

   ```bash
   npm run worktree:audit
   ```

1. **Update remote tracking:**

   ```bash
   git fetch --prune
   ```

2. **List `[gone]` branches, excluding protected:**

   ```bash
   git branch -vv | grep ': gone]' | grep -vE '^\*|main|master'
   ```

3. **For each gone branch:**
   - If associated worktree exists (`git worktree list`) → `git worktree remove <path>` first
   - Delete branch: `git branch -D <branch>`

4. **Never delete** current branch or `main`/`master`.

5. **Report:** branches removed, worktrees removed, or "nothing to clean".

---

## When

- After merging PRs and deleting remote branches
- Weekly repo hygiene
- Before starting a new `ipi/<task>-<slug>` worktree
