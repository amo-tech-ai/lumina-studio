# Disk Forensic Audit — 2026-07-01

**Host:** `/dev/nvme0n1p6` (ext4) · **User:** `sk` · **Repo:** `/home/sk/ipix`  
**Auditor mode:** read-only — no files deleted.

---

## 1. Disk Overview

### Commands run

```bash
df -h /
df -h
lsblk -f
```

### Results

| Metric | Value |
|---|---|
| **Total disk** | 600 GB |
| **Used** | 567 GB |
| **Free** | 2.2 GB |
| **Percent used** | **100%** (critical) |
| **Full partition** | `/dev/nvme0n1p6` mounted on `/` |
| **Boot EFI** | `/dev/nvme0n1p1` 420M (49% used — OK) |
| **Swap** | `nvme0n1p7` + `zram0` |

**Immediate risk:** only **2.2 GB** free on root. Builds, apt, browser caches, and log writes can fail.

---

## 2. Top Space Users in `/home/sk`

### Commands run

```bash
du -xh --max-depth=1 /home/sk 2>/dev/null | sort -h
du -xh --max-depth=2 /home/sk 2>/dev/null | sort -h | tail -50
```

### `/home/sk` total: **461 GB** (~77% of 600 GB disk)

| Rank | Path | Size | % of 600 GB disk |
|---:|---|---:|---:|
| 1 | `/home/sk/Pictures` | **174 GB** | **29.0%** |
| 2 | `/home/sk/.config` | 40 GB | 6.7% |
| 3 | `/home/sk/.lmstudio` | 27 GB | 4.5% |
| 4 | `/home/sk/mdeai` | 18 GB | 3.0% |
| 5 | `/home/sk/.config/Cursor` | 18 GB | 3.0% |
| 6 | `/home/sk/.npm` | 12 GB | 2.0% |
| 7 | `/home/sk/ipix` (main repo) | 12 GB | 2.0% |
| 8 | `/home/sk/apps` | 11 GB | 1.8% |
| 9 | `/home/sk/mdeai-tasks-backup-20260609` | 11 GB | 1.8% |
| 10 | `/home/sk/startupai16L` | 9.8 GB | 1.6% |
| 11 | `/home/sk/Documents` | 9.5 GB | 1.6% |
| 12 | `/home/sk/Downloads` | 9.2 GB | 1.5% |
| 13 | `/home/sk/.local` | 7.8 GB | 1.3% |
| 14 | `/home/sk/opencode-backup` | 6.5 GB | 1.1% |
| 15 | `/home/sk/snap` | 5.7 GB | 1.0% |
| 16 | `/home/sk/.cache` | 5.4 GB | 0.9% |
| 17 | `/home/sk/mde` | 5.1 GB | 0.9% |
| — | **All iPix sibling worktrees (`/home/sk/wt-*`)** | **~49 GB** | **~8.2%** |
| — | **Nested worktree (`/home/sk/ipix/wt-ipi-209`)** | **1.7 GB** | **0.3%** |
| — | **Worktrees combined** | **~51 GB** | **~8.5%** |

### Pictures breakdown (174 GB — not worktree-related)

| Subfolder | Size |
|---|---:|
| Anisha Wedding | 65 GB |
| Sanjiv Photos | 34 GB |
| nikon | 30 GB |
| models | 9.2 GB |
| 1 | 8.9 GB |
| I Love Caribbean | 8.3 GB |
| socialmediaville | 5.1 GB |

### Main repo breakdown (12 GB)

| Subfolder | Size |
|---|---:|
| `app/` (incl. `node_modules` 1.4G + `.next` 2.0G) | 3.5 GB |
| `my-marketplace/` | 2.0 GB |
| `wt-ipi-209/` (nested worktree) | 1.7 GB |
| `github/` | 2.0 GB |
| `b2c-storefront/` | 1.6 GB |
| `.git/` | 665 MB |

---

## 3. Git Worktree Audit

### Command run

```bash
cd /home/sk/ipix && git worktree list --porcelain
```

**28 worktrees** registered (1 main + 27 extras).

### Per-worktree summary

| Path | Branch | Commit | PR | Size | Top internals |
|---|---|---|---|---:|---|
| `/home/sk/ipix` | `ipi/docs-planning-sync-2026-06-30` | `cf9b07c` | #146 MERGED | 12 GB | `app/` 3.5G, dirty (408 files) |
| `/home/sk/ipix/wt-ipi-209` | `ipi/209-shoot-detail-page` | `440b7f5` | #150 MERGED | 1.7 GB | `app/node_modules` 1.4G |
| `/home/sk/wt-b01-wizard-provider` | `fix/b01-wizard-copilotkit-provider` | `1038d09` | #159 MERGED | 2.7 GB | `app/.next` 1.2G + `node_modules` 1.4G |
| `/home/sk/wt-batch2-prep` | `batch2/prep` | `9471e41` | NO PR | 3.2 GB | `app/.next` 1.7G + `node_modules` 1.4G |
| `/home/sk/wt-ipi-17-command-center` | `ipi/17-command-center` | `f5065ad` | NO PR | 119 MB | local code changes |
| `/home/sk/wt-ipi-197` | `ipi/197-contextual-copilot-sidebar` | `c55d225` | #156 MERGED | 1.6 GB | `app/node_modules` 1.4G, `?? .env` |
| `/home/sk/wt-ipi-218` | `ipi/218-3panel-active-brand` | `fd05a41` | #127 MERGED | 2.9 GB | `app/.next` 1.3G + `node_modules` 1.4G |
| `/home/sk/wt-ipi-219` | `ipi/219-asset-grid` | `746c3ee` | #128 MERGED | 1.6 GB | `app/node_modules` 1.4G |
| `/home/sk/wt-ipi-225` | `ipi/225-migration-drift-sync` | `7b80072` | #130 MERGED | 1.6 GB | clean |
| `/home/sk/wt-ipi-226` | `ipi/supabase-types-sync` | `16afe51` | #133 MERGED | 1.6 GB | clean |
| `/home/sk/wt-ipi-228` | `ipi/shoot-commit-rpc` | `c6e6284` | #136 MERGED | 1.7 GB | clean |
| `/home/sk/wt-ipi-228-audit` | `ipi/228-audit-doc` | `f060a74` | #137 MERGED | 117 MB | docs-only tree |
| `/home/sk/wt-ipi-229` | `ipi/229-social-discovery-refactor` | `8ed28b2` | #139 MERGED | 1.6 GB | clean |
| `/home/sk/wt-ipi-243` | `ipi/243-intelligence-panel` | `b1e0f2f` | #149 MERGED | 1.7 GB | clean |
| `/home/sk/wt-ipi-246` | `ipi/246-evidence-block-review-fixes` | `1f78c31` | #153 MERGED | 1.7 GB | clean |
| `/home/sk/wt-ipi-247` | `ipi/247-route-agent-map` | `74e4b09` | #147 MERGED | 1.7 GB | clean |
| `/home/sk/wt-ipi-255` | `ipi/255-live-intelligence-data` | `29ac14d` | #161 MERGED | 1.7 GB | 2 untracked test files |
| `/home/sk/wt-ipi-257-cloudinary-rls` | `ipi/257-cloudinary-rls` | `d21d8b0` | #158 MERGED | 1.6 GB | clean |
| `/home/sk/wt-ipi-260-brand-intelligence-wiring` | `ipi/260-brand-intelligence-wiring` | `adc7b35` | #157 MERGED | 2.9 GB | `app/.next` 1.4G |
| `/home/sk/wt-ipi-264` | `ipi/264-mobile-react-pass` | `bceefe6` | #152 MERGED | 3.1 GB | `app/.next` 1.5G |
| `/home/sk/wt-ipi-270-design-010-tokens` | `ipi/270-design-010-tokens` | `6a38904` | **#162 OPEN** | 2.8 GB | `app/.next` 1.3G |
| `/home/sk/wt-ipi-278` | `ipi/278-unregister-brand-approval-scaffold` | `705e185` | #155 MERGED | 1.6 GB | `?? .env` |
| `/home/sk/wt-ipi-design-tokens` | `ipi/design-system-tokens` | `8a71d29` | **#135 OPEN** | 1.6 GB | `?? .env` |
| `/home/sk/wt-ipi-docs-audit-sync` | `ipi/docs-audit-sync-rev4` | `7a91bed` | #138 MERGED | 1.6 GB | clean |
| `/home/sk/wt-ipi-mastra-agent-workflows` | `ipi/mastra-agent-workflows` | `b5783a2` | #141 MERGED | 1.7 GB | clean |
| `/home/sk/wt-ipi-mastra-tests` | `ipi/mastra-test-stabilization` | `75de9ce` | #140 MERGED | 1.7 GB | clean |
| `/home/sk/wt-ipi-middleware-config` | `ipi/fix-middleware-config-inline` | `5794985` | **#163 OPEN** | 1.7 GB | clean |
| `/home/sk/wt-ipix-graphify-rebuild` | `ipi/tooling-graphify-app-rebuild` | `902f05b` | #160 MERGED | 1.6 GB | clean |

### Worktree space pattern

Each full iPix worktree ≈ **1.6–3.2 GB**, dominated by:

- `app/node_modules` — **1.4 GB** (duplicated per worktree)
- `app/.next` — **0–1.7 GB** (build cache, rebuildable)

**Combined worktree footprint: ~51 GB** (49 GB siblings + 1.7 GB nested `wt-ipi-209`; main repo counted separately at 12 GB).

---

## 4. Duplicated Heavy Folders

### Commands run

```bash
find /home/sk -type d \( -name node_modules -o -name .next -o -name dist -o -name build -o -name coverage -o -name .turbo -o -name .cache \) -prune -exec du -sh {} \; 2>/dev/null | sort -h

du -sh ~/.cache ~/.npm ~/.pnpm-store ~/.local/share/pnpm ~/.config/Cursor ~/.config/Claude ~/.claude ~/.ollama 2>/dev/null
docker system df 2>/dev/null
```

### iPix worktree duplication (largest hits)

| Path | Size |
|---|---:|
| 22× `app/node_modules` across worktrees | ~1.4 GB each ≈ **31 GB total** |
| 8× `app/.next` across worktrees | **~9 GB total** |
| `/home/sk/ipix/app/.next` | 2.0 GB |
| `/home/sk/ipix/app/node_modules` | 1.4 GB |

### User-level caches

| Path | Size |
|---|---:|
| `/home/sk/.npm` | 12 GB |
| `/home/sk/.npm/_cacache` | 6.9 GB |
| `/home/sk/.npm/_npx` | 3.9 GB |
| `/home/sk/.local/share/pnpm` | 7.0 GB |
| `/home/sk/.cache` | 5.4 GB |
| `/home/sk/.cache/google-chrome` | 2.5 GB |
| `/home/sk/.cache/ms-playwright` | 646 MB |
| `/home/sk/.cache/puppeteer` | 285 MB |
| `/home/sk/.config/Cursor` | 18 GB |
| `/home/sk/.config/google-chrome.backup` | 7.9 GB |
| `/home/sk/.config/google-chrome-beta` | 5.4 GB |
| `/home/sk/.lmstudio/models` | 24 GB |
| `/home/sk/.ollama` | 28 KB (negligible) |

### Docker

| Type | Total | Reclaimable |
|---|---:|---:|
| Images | 30.92 GB | 3.43 GB (11%) |
| Containers | 63 MB | 1 MB |
| Volumes | 2.69 GB | 1.46 GB (54%) — **review before touching** |

---

## 5. Cleanup Plan

| Rank | Path | Type | Size GB | % Disk | Risk | Recommendation |
|---:|---|---|---:|---:|---|---|
| 1 | `/home/sk/Pictures` | User photos | 174 | 29.0% | **HIGH** | Not caused by worktrees. Archive to external drive if space needed long-term. |
| 2 | Merged iPix worktrees (22 trees) | Git worktree + node_modules/.next | **~40** | 6.7% | LOW–MED | Remove merged branches with clean git status (see §6). Biggest safe win. |
| 3 | `/home/sk/.npm` + `_cacache` + `_npx` | npm cache | **12** | 2.0% | **LOW** | `npm cache clean --force` after worktree removal. |
| 4 | `/home/sk/.lmstudio/models` | LLM models | 24 | 4.0% | **HIGH** | Manual — only delete models you no longer use. |
| 5 | `/home/sk/.config/Cursor` | IDE state/cache | 18 | 3.0% | MED | Cursor: clear old indexes / unused extensions; don't bulk-delete. |
| 6 | `/home/sk/.local/share/pnpm` | pnpm store | 7.0 | 1.2% | LOW | `pnpm store prune` if you use pnpm. |
| 7 | `/home/sk/.config/google-chrome.backup` | Browser backup | 7.9 | 1.3% | MED | Review — likely safe if current Chrome profile works. |
| 8 | `/home/sk/mdeai` + backups | Other project | 18+11 | 4.8% | **HIGH** | Separate project; review manually. |
| 9 | Open iPix worktrees (3) | Active PR work | 6.1 | 1.0% | MED | **KEEP** until PRs #135, #162, #163 merge. |
| 10 | `/home/sk/wt-batch2-prep` | Unmerged prep tree | 3.2 | 0.5% | MED | Review — has `.env`, scripts, test-results. |
| 11 | `/home/sk/.cache/ms-playwright` | Test browser cache | 0.65 | 0.1% | **LOW** | Safe to delete; re-downloads on next test run. |
| 12 | Docker unused images | Container images | 3.4 | 0.6% | MED | `docker image prune` (not volumes). |

---

## 6. Worktree Deletion Plan

> **Do not run these until you confirm each row.** Commands are suggestions only.

| Worktree | Branch | Size GB | Git Status | Last Commit | Classification | Safe Command |
|---|---|---:|---|---|---|---|
| `/home/sk/ipix/wt-ipi-209` | `ipi/209-shoot-detail-page` | 1.7 | Clean | `440b7f5` feat shoot detail | **DELETE CANDIDATE** (#150 merged) | `git -C /home/sk/ipix worktree remove /home/sk/ipix/wt-ipi-209` |
| `/home/sk/wt-b01-wizard-provider` | `fix/b01-wizard-copilotkit-provider` | 2.7 | Clean | `1038d09` | **DELETE CANDIDATE** (#159 merged) | `git -C /home/sk/ipix worktree remove /home/sk/wt-b01-wizard-provider` |
| `/home/sk/wt-ipi-219` | `ipi/219-asset-grid` | 1.6 | Clean | `746c3ee` | **DELETE CANDIDATE** (#128 merged) | `git -C /home/sk/ipix worktree remove /home/sk/wt-ipi-219` |
| `/home/sk/wt-ipi-225` | `ipi/225-migration-drift-sync` | 1.6 | Clean | `7b80072` | **DELETE CANDIDATE** (#130 merged) | `git -C /home/sk/ipix worktree remove /home/sk/wt-ipi-225` |
| `/home/sk/wt-ipi-226` | `ipi/supabase-types-sync` | 1.6 | Clean | `16afe51` | **DELETE CANDIDATE** (#133 merged) | `git -C /home/sk/ipix worktree remove /home/sk/wt-ipi-226` |
| `/home/sk/wt-ipi-228` | `ipi/shoot-commit-rpc` | 1.7 | Clean | `c6e6284` | **DELETE CANDIDATE** (#136 merged) | `git -C /home/sk/ipix worktree remove /home/sk/wt-ipi-228` |
| `/home/sk/wt-ipi-228-audit` | `ipi/228-audit-doc` | 0.12 | Clean | `f060a74` | **DELETE CANDIDATE** (#137 merged) | `git -C /home/sk/ipix worktree remove /home/sk/wt-ipi-228-audit` |
| `/home/sk/wt-ipi-229` | `ipi/229-social-discovery-refactor` | 1.6 | Clean | `8ed28b2` | **DELETE CANDIDATE** (#139 merged) | `git -C /home/sk/ipix worktree remove /home/sk/wt-ipi-229` |
| `/home/sk/wt-ipi-243` | `ipi/243-intelligence-panel` | 1.7 | Clean | `b1e0f2f` | **DELETE CANDIDATE** (#149 merged) | `git -C /home/sk/ipix worktree remove /home/sk/wt-ipi-243` |
| `/home/sk/wt-ipi-246` | `ipi/246-evidence-block-review-fixes` | 1.7 | Clean | `1f78c31` | **DELETE CANDIDATE** (#153 merged) | `git -C /home/sk/ipix worktree remove /home/sk/wt-ipi-246` |
| `/home/sk/wt-ipi-247` | `ipi/247-route-agent-map` | 1.7 | Clean | `74e4b09` | **DELETE CANDIDATE** (#147 merged) | `git -C /home/sk/ipix worktree remove /home/sk/wt-ipi-247` |
| `/home/sk/wt-ipi-257-cloudinary-rls` | `ipi/257-cloudinary-rls` | 1.6 | Clean | `d21d8b0` | **DELETE CANDIDATE** (#158 merged) | `git -C /home/sk/ipix worktree remove /home/sk/wt-ipi-257-cloudinary-rls` |
| `/home/sk/wt-ipi-260-brand-intelligence-wiring` | `ipi/260-brand-intelligence-wiring` | 2.9 | Clean | `adc7b35` | **DELETE CANDIDATE** (#157 merged) | `git -C /home/sk/ipix worktree remove /home/sk/wt-ipi-260-brand-intelligence-wiring` |
| `/home/sk/wt-ipi-264` | `ipi/264-mobile-react-pass` | 3.1 | `?? test-results/` only | `bceefe6` | **DELETE CANDIDATE** (#152 merged) | `git -C /home/sk/ipix worktree remove /home/sk/wt-ipi-264` |
| `/home/sk/wt-ipi-docs-audit-sync` | `ipi/docs-audit-sync-rev4` | 1.6 | Clean | `7a91bed` | **DELETE CANDIDATE** (#138 merged) | `git -C /home/sk/ipix worktree remove /home/sk/wt-ipi-docs-audit-sync` |
| `/home/sk/wt-ipi-mastra-agent-workflows` | `ipi/mastra-agent-workflows` | 1.7 | Clean | `b5783a2` | **DELETE CANDIDATE** (#141 merged) | `git -C /home/sk/ipix worktree remove /home/sk/wt-ipi-mastra-agent-workflows` |
| `/home/sk/wt-ipi-mastra-tests` | `ipi/mastra-test-stabilization` | 1.7 | Clean | `75de9ce` | **DELETE CANDIDATE** (#140 merged) | `git -C /home/sk/ipix worktree remove /home/sk/wt-ipi-mastra-tests` |
| `/home/sk/wt-ipix-graphify-rebuild` | `ipi/tooling-graphify-app-rebuild` | 1.6 | Clean | `902f05b` | **DELETE CANDIDATE** (#160 merged) | `git -C /home/sk/ipix worktree remove /home/sk/wt-ipix-graphify-rebuild` |
| `/home/sk/wt-ipi-197` | `ipi/197-contextual-copilot-sidebar` | 1.6 | `?? .env` | `c55d225` | **REVIEW MANUALLY** (#156 merged) | Copy `.env` if needed, then remove |
| `/home/sk/wt-ipi-218` | `ipi/218-3panel-active-brand` | 2.9 | `?? .env` | `fd05a41` | **REVIEW MANUALLY** (#127 merged) | Copy `.env` if needed, then remove |
| `/home/sk/wt-ipi-278` | `ipi/278-unregister-brand-approval-scaffold` | 1.6 | `?? .env` | `705e185` | **REVIEW MANUALLY** (#155 merged) | Copy `.env` if needed, then remove |
| `/home/sk/wt-ipi-255` | `ipi/255-live-intelligence-data` | 1.7 | 2 untracked test files | `29ac14d` | **REVIEW MANUALLY** (#161 merged) | Copy tests if wanted, then remove |
| `/home/sk/wt-ipi-270-design-010-tokens` | `ipi/270-design-010-tokens` | 2.8 | Clean | `6a38904` | **KEEP** (#162 OPEN) | — |
| `/home/sk/wt-ipi-design-tokens` | `ipi/design-system-tokens` | 1.6 | `?? .env` | `8a71d29` | **KEEP** (#135 OPEN) | — |
| `/home/sk/wt-ipi-middleware-config` | `ipi/fix-middleware-config-inline` | 1.7 | Clean | `5794985` | **KEEP** (#163 OPEN) | — |
| `/home/sk/wt-batch2-prep` | `batch2/prep` | 3.2 | 5 untracked files | `9471e41` | **REVIEW MANUALLY** (no PR) | Inspect scripts/.env first |
| `/home/sk/wt-ipi-17-command-center` | `ipi/17-command-center` | 0.12 | Modified + new files | `f5065ad` | **KEEP** (active local work) | — |
| `/home/sk/ipix` | `ipi/docs-planning-sync-2026-06-30` | 12 | 408 dirty files | `cf9b07c` | **KEEP** (main working tree) | — |

### Batch remove script (merged + clean only — review before running)

```bash
# Dry-run: list what would be removed
git -C /home/sk/ipix worktree list

# Remove one at a time (safest):
git -C /home/sk/ipix worktree remove /home/sk/ipix/wt-ipi-209
git -C /home/sk/ipix worktree remove /home/sk/wt-ipi-219
# ... continue from DELETE CANDIDATE rows above

# If git complains about stale entries:
git -C /home/sk/ipix worktree prune
```

**Estimated recovery from DELETE CANDIDATE rows alone: ~32 GB** (18 clean merged trees).  
**+ REVIEW MANUALLY merged trees: ~8 GB more** (197, 218, 255, 278).  
**Total merged worktree recovery potential: ~40 GB.**

---

## 7. Final Verdict

### Was the disk warning caused by worktrees?

**Partial — yes for the recent spike, no as the sole root cause.**

- **Baseline hog:** `/home/sk/Pictures` at **174 GB (29% of disk)** predates worktrees and is the single largest consumer.
- **Recent spike (likely last week):** **~51 GB** from **27 iPix worktrees**, each carrying a full **`app/node_modules` (1.4 GB)** and often **`app/.next` (up to 1.7 GB)**. Creating ~25 worktrees in one week easily explains going from "fine" to **100% full**.
- **Amplifiers:** `/home/sk/.npm` (12 GB), Cursor config (18 GB), LM Studio models (24 GB) — not worktree-specific but leave no headroom.

### Biggest cause

1. **Pictures (174 GB)** — dominant static usage  
2. **iPix worktrees (~51 GB)** — dominant **recent** growth vector  
3. **npm + duplicated node_modules (~43 GB combined across .npm + worktrees)**

### Recoverable space

| Category | GB |
|---|---:|
| **Safely (LOW risk)** — merged clean worktrees + npm cache + playwright cache | **~45 GB** |
| **After manual review (MED)** — .env-only merged trees, batch2-prep, chrome backup, docker image prune | **~15 GB** |
| **High risk / user data** — Pictures, LM Studio, mdeai backups | 200+ GB (only if you choose) |

### Exact next 3 commands

```bash
# 1. Confirm breathing room target — re-check disk
df -h /

# 2. Remove the largest merged+clean worktree first (immediate ~3 GB)
git -C /home/sk/ipix worktree remove /home/sk/wt-ipi-264

# 3. Batch-remove remaining merged clean worktrees (repeat or script from §6), then clear npm cache
npm cache clean --force
```

After step 2–3, re-run `df -h /` and `git -C /home/sk/ipix worktree list` to verify.

---

## Appendix: Commands Reference

```bash
# Disk
df -h / && df -h && lsblk -f

# Home usage
du -xh --max-depth=1 /home/sk 2>/dev/null | sort -h
du -xh --max-depth=2 /home/sk 2>/dev/null | sort -h | tail -50

# Worktrees
cd /home/sk/ipix && git worktree list --porcelain
git -C <path> status --short
git -C <path> branch --show-current
git -C <path> log -1 --oneline

# Heavy dirs
find /home/sk -type d \( -name node_modules -o -name .next -o -name dist -o -name build -o -name coverage -o -name .turbo -o -name .cache \) -prune -exec du -sh {} \; 2>/dev/null | sort -h

# Caches
du -sh ~/.cache ~/.npm ~/.local/share/pnpm ~/.config/Cursor ~/.config/Claude ~/.claude ~/.ollama
docker system df
```

**Report generated:** 2026-07-01 · **No deletions performed.**
