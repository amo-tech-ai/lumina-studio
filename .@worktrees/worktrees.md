# Worktrees audit — iPix (2026-07-05)

## Disk emergency cleanup (this session)

| Before | After | Recovered |
|--------|-------|-----------|
| **3.3 GB free** | **~55 GB free** | **~52 GB** |

### Actions taken

| Action | ~Recovered |
|--------|------------|
| npm `_npx` + `_cacache` (`npm cache clean --force`) | ~4.7 GB |
| 18 merged worktrees removed (`git worktree remove --force`) | ~28 GB |
| Docker images prune (30d+ unused) | ~9.5 GB |
| Orphan dirs removed (`383-tomain`, `270`, `273`, `shoot-shotlist`) | ~0.3 GB |

---

## Count (post-cleanup)

| Metric | Value |
|---|---|
| **Total checkouts** | **13** (1 main + 12 sibling worktrees) |
| **Orphans** | 0 |
| **Safe to delete now** | 0 (audit) — see optional below |
| **Health score** | 80/100 |

Live tracker: `docs/development/worktree-tracker.md` (refresh with `npm run worktree:audit -- --write`).

## Active worktrees — keep

| Worktree | Branch | Size | Notes |
|---|---|---:|---|
| `../ipix` (main) | `ipi/claude-skills-git` | 12G | primary checkout |
| `wt-ipi-274-shoot-wizard` | `ipi/274-shoot-wizard` | 1.7G | WIP |
| `wt-ipi-274-wizard` | `ipi/274-shoot-wizard-frame` | 3.2G | WIP |
| `wt-ipi-286` | `ipi/286-route-aware-sections` | 1.6G | active |
| `wt-ipi-337-shoot-detail-tabs` | `ipi/337-shoot-detail-tabs` | 3.2G | 23 dirty — real WIP |
| `wt-ipi-340-create-booking-request` | `main` | 1.8G | on main — review if still needed |
| `wt-ipi-348-booking-agent` | `ipi/ipi-348-…` | 1.6G | active |
| `wt-ipi-349-cloudinary-config` | `ipi/349-cloudinary-config-cleanup` | 1.6G | active |
| `wt-ipi-356-groq-002` | `ipi/groq-002-shared-client` | 1.6G | active (IPI-356) |
| `wt-ipi-372-shoots-list` | `ipi/372-shoots-list-parity` | 3.3G | **PR #219 MERGED** — optional remove |
| `wt-ipi-docs-audit-linear-sync` | `ipi/docs-audit-linear-sync` | 1.6G | #187 OPEN |
| `wt-ipi-pr-165` | `ipi/docs-nextjs16-pr-fix` | 1.6G | #165 OPEN |

**Total sibling worktrees:** ~22G

## Optional next wins (manual confirm)

| Target | Size | Risk |
|--------|-----:|------|
| `wt-ipi-372-shoots-list` (merged #219, untracked docs only) | 3.3G | low if WIP copied elsewhere |
| `wt-ipi-340-create-booking-request` (stale `main` checkout) | 1.8G | medium — verify unused |
| Docker unused volumes | ~2.2G | medium — may affect stopped containers |
| `~/.cache/google-chrome` | 2.7G | low — browser rebuilds cache |

## Refresh commands

```bash
npm run worktree:audit -- --write
git worktree list
df -h /
```
