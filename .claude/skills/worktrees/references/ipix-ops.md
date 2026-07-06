# iPix worktree operations — command playbooks

Command recipes for the iPix worktree workflow. The always-on guardrails (merge gate, never-run-blindly, leak guard, nested guard, backup rule) live in [../SKILL.md](../SKILL.md) under "iPix safety rails"; this file holds the longer how-to recipes those rules point at.

## Table of contents

- [Forensic audit](#forensic-audit) — what state am I actually in?
- [Production SHA check](#production-sha-check) — does local main match remote/deployed?
- [PR splitting playbook](#pr-splitting-playbook) — keep PRs reviewable
- [Weekly tidy ritual](#weekly-tidy-ritual) — clear stale branches/worktrees

## Forensic audit

Run before any merge, cleanup, or `--force`/`reset` so you can name exactly what exists and what would be lost. Never trust a "looks clean" impression — probe.

```bash
git status --short                          # staged, unstaged, untracked summary
git ls-files --others --exclude-standard    # untracked files (respecting .gitignore)
git ls-files --others | grep -E 'worktrees/|^github/|node_modules/' || echo "no leaks"  # leak check (incl. ignored)
git log --oneline origin/main..HEAD         # local commits NOT on remote main
git diff --stat origin/main...HEAD          # diff size (files + lines) vs merge-base
git diff --stat --staged                    # what's staged right now
git stash list                              # stashes you may have forgotten
```

Read the output before acting:
- Untracked files you don't recognize → investigate, don't blanket-clean.
- Local commits ahead of `origin/main` → these are unpushed; removing the worktree with `--force` destroys them.
- Large `diff --stat` → candidate for the [PR splitting playbook](#pr-splitting-playbook).

## Production SHA check

Confirm your local `main` (and your worktree's base) matches the remote/deployed `main` before branching or merging — a stale base produces conflicts and "works on my machine" surprises.

```bash
git fetch origin main
git rev-parse origin/main                   # remote main = what's deployed from lumina-studio
git rev-parse main                          # your local main
git rev-list --left-right --count origin/main...main   # "<behind>  <ahead>"
```

- `0  0` → in sync. Safe to branch/merge.
- behind > 0 → fast-forward local main (`git checkout main && git pull --ff-only`) before creating worktrees, so they branch from current code. (iPix worktrees default to `origin/main` via `claude --worktree`, which sidesteps this — but a manually based worktree inherits a stale local main.)
- ahead > 0 → you have unpushed commits on main; that should almost never happen on iPix (work goes on `ipi/*` branches). Investigate.

Cross-check against the deployment platform's reported commit SHA (e.g. the Vercel/host build for `lumina-studio`); `origin/main` should equal the live deployment's SHA.

## PR splitting playbook

Large agent-generated PRs are slow to review and risky to merge. Keep each PR to **one concern**.

**Split when** `git diff --stat origin/main...HEAD` shows roughly >400 changed lines or >15 files, **or** the change spans more than one layer (schema / edge function / frontend).

**How to split — by dependency layer, one worktree per slice:**

1. Schema + RLS migration → `ipi/<id>-schema` → PR #1
2. Edge functions that depend on the schema → `ipi/<id>-edge` → PR #2 (blocked by #1)
3. Frontend that calls the edge functions → `ipi/<id>-ui` → PR #3 (blocked by #2)

```bash
# one worktree per slice so each validates independently
git worktree add ../wt-ipi-117-schema -b ipi/117-schema origin/main
git worktree add ../wt-ipi-116-edge   -b ipi/116-edge   origin/main
```

- **Stack** dependent PRs: branch the later slice off the earlier branch (not `origin/main`) and note "Blocked by #N" in the PR body.
- Each slice runs the full [verify matrix](../../pr-workflow/references/verify-matrix.md) in its worktree.
- Prefer several small green PRs over one big PR that mixes concerns.

## Weekly tidy ritual

Run periodically (≈weekly) from the main worktree to keep branches and worktrees from accumulating.

```bash
git worktree list                       # audit what exists
git worktree prune                      # drop metadata for manually-deleted worktrees
git fetch -p                            # prune remote-tracking branches deleted upstream

# delete local branches already merged into origin/main (skips main + current)
git branch --merged origin/main | grep -vE '^\*|(^|\s)main$' | xargs -r git branch -d

# for each merged/abandoned worktree from `git worktree list`:
git worktree remove <path>              # add --force only after a backup (see SKILL.md)
```

Review the `git worktree list` and `git branch` output by hand before deleting — confirm each branch is truly merged or abandoned, and that no worktree holds uncommitted work (run the [forensic audit](#forensic-audit) on any you're unsure about).
