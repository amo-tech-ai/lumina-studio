# Worktree management — iPix

**Run audit:** `npm run worktree:audit -- --write`  
**Command:** `/worktree` · **Skill:** `.claude/skills/worktrees/SKILL.md`

## Quick start

```bash
# Create (standard naming)
npm run worktree:add -- IPI-286 route-aware-sections
cd ../wt-ipi-286-route-aware-sections

# Inventory + health score
npm run worktree:audit
npm run worktree:audit -- --write   # → docs/development/worktree-tracker.md

# Cleanup merged / gone
/worktree clean
/clean-gone
```

## Conventions

| | Pattern |
|---|---------|
| Branch | `ipi/<issue>-<slug>` |
| Path | `../wt-ipi-<issue>-<slug>` (sibling only) |
| Base | `origin/main` |
| Env | `.worktreeinclude` |

## Status legend

| | Meaning |
|---|---------|
| 🟢 | Active / open PR |
| 🟡 | Draft PR / idle |
| ⚪ | Merged — safe to remove |
| 🔴 | Stale / remote gone (check dirty) |

## Never

- Nest worktrees inside repo
- `rm -rf` without `git worktree remove`
- `--force` remove without stash/backup
- Keep merged worktrees (disk cost ~6GB each with node_modules)

## Tracker

Generated file: [`docs/development/worktree-tracker.md`](../docs/development/worktree-tracker.md)

Full policy prompts: historical audit notes in `.@worktrees/`.
