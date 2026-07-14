# Worktree Cleanup Run — 2026-07-01

## Disk

| When | Used | Free | % |
|---|---:|---:|---:|
| Before | 567 GB | 2.2 GB | 100% |
| After | 532 GB | **38 GB** | 94% |
| **Recovered** | — | **~36 GB** | — |

---

## Removed (21 worktrees)

| Worktree | Branch | Size | Notes |
|---|---|---:|---|
| `/home/sk/wt-ipi-264` | `ipi/264-mobile-react-pass` | 3.1G | `--force` (test-results/) |
| `/home/sk/wt-ipi-218` | `ipi/218-3panel-active-brand` | 2.9G | `--force` (.env backed up) |
| `/home/sk/wt-b01-wizard-provider` | `fix/b01-wizard-copilotkit-provider` | 2.7G | clean |
| `/home/sk/wt-ipi-260-brand-intelligence-wiring` | `ipi/260-brand-intelligence-wiring` | 2.9G | partial git remove + orphan dir cleaned (175M left) |
| `/home/sk/ipix/wt-ipi-209` | `ipi/209-shoot-detail-page` | 1.7G | clean |
| `/home/sk/wt-ipi-197` | `ipi/197-contextual-copilot-sidebar` | 1.6G | `--force` (.env backed up) |
| `/home/sk/wt-ipi-219` | `ipi/219-asset-grid` | 1.6G | clean |
| `/home/sk/wt-ipi-225` | `ipi/225-migration-drift-sync` | 1.6G | clean |
| `/home/sk/wt-ipi-226` | `ipi/supabase-types-sync` | 1.6G | clean |
| `/home/sk/wt-ipi-228` | `ipi/shoot-commit-rpc` | 1.7G | clean |
| `/home/sk/wt-ipi-228-audit` | `ipi/228-audit-doc` | 117M | clean |
| `/home/sk/wt-ipi-229` | `ipi/229-social-discovery-refactor` | 1.6G | clean |
| `/home/sk/wt-ipi-243` | `ipi/243-intelligence-panel` | 1.7G | clean |
| `/home/sk/wt-ipi-246` | `ipi/246-evidence-block-review-fixes` | 1.7G | clean |
| `/home/sk/wt-ipi-247` | `ipi/247-route-agent-map` | 1.7G | clean |
| `/home/sk/wt-ipi-257-cloudinary-rls` | `ipi/257-cloudinary-rls` | 1.6G | clean |
| `/home/sk/wt-ipi-278` | `ipi/278-unregister-brand-approval-scaffold` | 1.6G | `--force` (.env backed up) |
| `/home/sk/wt-ipi-docs-audit-sync` | `ipi/docs-audit-sync-rev4` | 1.6G | clean |
| `/home/sk/wt-ipi-mastra-agent-workflows` | `ipi/mastra-agent-workflows` | 1.7G | clean |
| `/home/sk/wt-ipi-mastra-tests` | `ipi/mastra-test-stabilization` | 1.7G | clean |
| `/home/sk/wt-ipix-graphify-rebuild` | `ipi/tooling-graphify-app-rebuild` | 1.6G | clean |

`.env` backups: `/home/sk/ipix/.@worktrees/env-backups/` (197, 218, 278)

---

## Kept (7 worktrees + main)

| Worktree | Branch | Size | Reason |
|---|---|---:|---|
| `/home/sk/ipix` | `ipi/docs-planning-sync-2026-06-30` | ~10G | **Main repo** (209 removed) |
| `/home/sk/wt-ipi-270-design-010-tokens` | `ipi/270-design-010-tokens` | 2.8G | **OPEN PR #162** |
| `/home/sk/wt-ipi-middleware-config` | `ipi/fix-middleware-config-inline` | 1.7G | **OPEN PR #163** |
| `/home/sk/wt-ipi-design-tokens` | `ipi/design-system-tokens` | 1.6G | **OPEN PR #135** |
| `/home/sk/wt-batch2-prep` | `batch2/prep` | 3.2G | Untracked scripts + `.env` — manual review |
| `/home/sk/wt-ipi-255` | `ipi/255-live-intelligence-data` | 1.7G | Untracked test source files |
| `/home/sk/wt-ipi-17-command-center` | `ipi/17-command-center` | 119M | Modified + new source files |

---

## Skipped (requires your decision)

### `wt-ipi-255` — 1.7 GB
Untracked:
- `app/src/components/intelligence-panel/intelligence-panel.test.tsx`
- `app/src/lib/intelligence/use-intelligence-panel.test.ts`

PR #161 merged. Copy tests to main if needed, then:
```bash
git -C /home/sk/ipix worktree remove --force /home/sk/wt-ipi-255
git -C /home/sk/ipix worktree prune
```

### `wt-batch2-prep` — 3.2 GB
Untracked: `.env`, scripts, `test-results/`. No PR. Review before remove.

### `wt-ipi-17-command-center` — 119 MB
Active uncommitted work in `command-center/` components. **Do not remove.**

---

## Follow-up cleanup (2026-07-01 continued)

| Action | Recovered |
|---|---:|
| `rm -rf ~/.npm/_npx` | ~3.9 GB |
| `rm -rf ~/.npm/_logs/*` | ~1.3 GB |
| Orphan wt stubs | negligible |
| Chrome backup (earlier) | ~7.9 GB |
| Docker `image prune` | 0 B |
| **Free space after** | **~59 GB** (from 2.2 GB start) |

---

## Below 80 GB free — next safest targets (ask before running)

Current free: **~59 GB**. Need **~21 GB more** for 80 GB target.

| Target | Size | Risk | Command |
|---|---:|---|---|
| `/home/sk/.npm` | 12 GB | LOW | `npm cache clean --force` |
| `/home/sk/.config/google-chrome.backup` | 7.9 GB | MED | Review profile, then `rm -rf ~/.config/google-chrome.backup` |
| `/home/sk/.cache/ms-playwright` | 646 MB | LOW | `rm -rf ~/.cache/ms-playwright` |
| `/home/sk/.cache/puppeteer` | 285 MB | LOW | `rm -rf ~/.cache/puppeteer` |
| Docker unused images | ~3.4 GB | MED | `docker image prune` |
| `wt-ipi-255` + `wt-batch2-prep` | ~4.9 GB | MED | After manual review |

**Combined LOW-risk (npm + playwright + puppeteer): ~13 GB → ~51 GB free**
