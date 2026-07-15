# Worktrees audit — iPix (2026-07-15)

## Current state

| Metric | Value |
|---|---|
| **Total repositories** | 4 (ipix, mdeai/mdeapp, startupai16L, mde) |
| **Total registered worktrees** | **113** |
| **ipix worktrees** | 95 (1 main + 10 OpenCode + 1 Claude + 83 sibling) |
| **Safe to delete now** | **59** (merged/closed, clean, no unique files) |
| **Estimated recovery** | **~128 GB** (Phase 2) |
| **Free disk** | 520 GB |

**Full forensic audit:** [`WORKTREE-MASTER-AUDIT.md`](./WORKTREE-MASTER-AUDIT.md) (2026-07-15)

---

## Cleanup phases (pending approval)

| Phase | What | Worktrees | Recovery | Risk |
|---|---|---:|---:|---|
| 1 | Phantoms + prune stale refs | 9 | <1 MB | None |
| 2 | Merged/closed + clean | 59 | ~128 GB | None (all verified) |
| 3 | Merged + trivial generated junk | 7 | ~23 GB | Low (`.infisical.json`, `test-results/`) |
| 4 | Salvage-first (unique files) | 5 | ~4 GB | Medium (must copy first) |
| 5 | Open PR worktrees (after merge) | 6 | ~13 GB | Wait for PR resolution |
| 6 | Detached/unknown | 3 | ~9 GB | Manual review |
| 7 | OpenCode pool | 10 | ~5 GB | Do NOT touch yet |

---

## Active/protected worktrees

| Worktree | PR | Status | Why |
|---|---:|---|---|
| `/home/sk/ipix` (main) | — | Primary | Never delete |
| `wt-docs-pr-workflow-fixes` | 349 | OPEN | Active PR |
| `wt-opencode-workflow` | 373 | OPEN | Active CI PR |
| `wt-cf-gw-001-scope-fix` | 374 | OPEN | Active docs PR |
| `wt-cf-wf-skill-fixes` | 372 | OPEN | Active skills PR |
| `wt-docs-dedupe-design-prompt-new` | 369 | OPEN | Active dedup PR |
| `wt-fix-vitest-pool-config` | 356 | OPEN | Active test fix PR |
| `wt-ipi-575-main-fix` | 387 | MERGED (dirty) | Post-merge work in progress |
| `/home/sk/wt-main-audit` | — | DETACHED | **DO NOT TOUCH** — protected verification checkout |

---

## History

### 2026-07-05 — Disk emergency cleanup

| Before | After | Recovered |
|--------|-------|-----------|
| **3.3 GB free** | **~55 GB free** | **~52 GB** |

| Action | ~Recovered |
|--------|------------|
| npm `_npx` + `_cacache` (`npm cache clean --force`) | ~4.7 GB |
| 18 merged worktrees removed (`git worktree remove --force`) | ~28 GB |
| Docker images prune (30d+ unused) | ~9.5 GB |
| Orphan dirs removed (`383-tomain`, `270`, `273`, `shoot-shotlist`) | ~0.3 GB |

---

## Refresh commands

```bash
npm run worktree:audit -- --write
git worktree list
df -h /
```
