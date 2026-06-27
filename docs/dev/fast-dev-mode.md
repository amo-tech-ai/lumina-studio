# Fast dev mode

One-time setup on each machine. Run once; sticks until reboot (add to `/etc/cpupower` to persist).

```bash
sudo cpupower frequency-set -g performance
powerprofilesctl set performance
```

## Before starting a session

```bash
# Fresh graph so Claude reads dependencies correctly (if >10 src files changed)
graphify update

# Check CI is green before pushing
gh run list --limit 3 --json conclusion,displayTitle --jq '.[] | "\(.conclusion) — \(.displayTitle)"'
```

## Local gate (runs on every `git push`)

```
typecheck (tsc --noEmit) → vitest run   ≈ 1 min
```

**Before opening a PR**, switch to the full gate (adds `next build`):

```bash
cp .git/hooks/pre-push-full .git/hooks/pre-push
```

Switch back after merge:

```bash
cp .git/hooks/pre-push-light .git/hooks/pre-push
```

## Worktree hygiene

```bash
# Create
git worktree add ../wt-<name> -b <branch>

# Remove when done (keeps disk and git status fast)
git worktree remove ../wt-<name>

# Audit stale ones
bash scripts/repo-hygiene.sh
```

## Key scripts (`app/`)

| Command | What | Time |
|---|---|---|
| `npm run typecheck` | tsc --noEmit | ~15s |
| `npm test` | vitest run | ~30s |
| `npm run build` | next build (full) | ~2-3min |
| `npm run dev` | turbopack + mastra | instant HMR |

## Sibling repos at root

`github/`, `my-marketplace/`, `b2c-storefront/` live inside `/ipix` but are unrelated projects. They are excluded from `.claudeignore` and graphify. Move them to `~/repos/` when convenient to reduce root clutter.
