# Disk Cleanup — One-Task Prompts for Cursor

Focused, low-risk prompts. Run **one at a time**; review output before the next.

| # | Task | Status (2026-07-01 session) |
|---:|---|---|
| 1 | Docker cleanup | ✅ Done — 0 B (no dangling images) |
| 2 | Inspect npm cache | ✅ Done — `_npx` 3.9G, `_logs` 1.3G |
| 3 | Remove only `_npx` | ⏳ Pending |
| 4 | Verify disk space | ⏳ Pending |
| 5 | Remove merged worktree | ⏳ Pending (per PR; #162 still OPEN) |
| 6 | Review old worktrees | ⏳ Pending |
| 7 | Safe cleanup report | ⏳ Pending |

---

## 1. Docker cleanup

```text
Clean up unused Docker images only.

Tasks:
1. Show current Docker disk usage.
2. Run:
   docker image prune
3. Show how much space was reclaimed.
4. Verify with:
   docker system df

Do not remove containers, volumes, or networks.
Report:
- Before size
- After size
- Space recovered
```

---

## 2. Inspect npm cache

```text
Inspect ~/.npm and identify the largest directories.

Run:
du -sh ~/.npm/*

Report:
- Largest folders
- Size of each
- Recommend what is safe to remove.

Do not delete anything yet.
```

---

## 3. Remove only `_npx`

```text
Clean only the npx cache.

Tasks:
1. Verify ~/.npm/_npx exists.
2. Show its size.
3. Remove:
   rm -rf ~/.npm/_npx
4. Verify it was removed.
5. Show updated ~/.npm size.

Do not delete any other npm cache.
```

---

## 4. Verify disk space

```text
Verify current disk usage.

Run:
df -h /
du -sh ~/.npm ~/.cache 2>/dev/null
docker system df

Report:
- Free disk space
- Docker usage
- npm cache size
- cache size
- Estimated remaining cleanup opportunities
```

---

## 5. Remove merged worktree (after PR merge)

```text
Remove the merged worktree only.

Tasks:
1. Verify the PR is merged.
2. Verify there are no uncommitted changes.
3. Remove:
   git worktree remove ~/wt-ipi-270
4. Run:
   git worktree prune
5. Verify the worktree list.

Do not remove any other worktrees.
```

> **Note:** Adjust path/branch per worktree. Example paths:
> - `~/wt-ipi-270-design-010-tokens` (PR #162)
> - `~/wt-ipi-middleware-config` (PR #163)
> - `~/wt-ipi-design-tokens` (PR #135)

---

## 6. Review old worktrees

```text
Audit all Git worktrees.

For each worktree report:
- Path
- Size
- Branch
- PR number
- Open or merged
- Uncommitted changes
- Safe to remove? (Yes/No)
- Reason

Do not delete anything.
```

---

## 7. Safe cleanup report

```text
Perform a safe disk cleanup audit.

Classify everything into:

1. Safe to remove now
2. Remove after PR merges
3. Keep
4. Needs manual review

Estimate disk space recoverable for each category.

Do not delete anything.
```

---

## Session totals (so far)

| Action | Recovered |
|---|---:|
| 21 merged worktrees | ~36 GB |
| npm `cache clean --force` | ~7 GB |
| Playwright + Puppeteer | ~1 GB |
| Chrome backup | ~8 GB |
| Docker `image prune` | 0 B |
| **Free space now** | **~53 GB** (from 2.2 GB) |

**Next low-risk win:** Task 3 (`~/.npm/_npx` → ~3.9 GB)
