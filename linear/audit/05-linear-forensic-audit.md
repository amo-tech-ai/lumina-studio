# Forensic audit — Linear export vs local state

**Verdict:** 🟡 Stable. 11 open PRs, 2 need attention. Production code clean. 4 stale PRs should be closed.

The task system is well-organized — 59 specs with Linear links, 17 recently improved. The biggest risk is not bad specs but stale PRs, high worktree count (14), and uncommitted production changes in one worktree.

## Grading system

| Dot | Score | Meaning |
|-----|-------|---------|
| 🟢 | 90–100 | Ready / mergeable |
| 🟡 | 75–89 | Good, minor fixes needed |
| ⚪ | 50–74 | Needs attention |
| 🔴 | 0–49 | Blocker / stale |

## Executive score

| Area | Score | Grade | Audit note |
|------|-------|-------|------------|
| PR health | 88 | 🟡 | #261 mergeable; #164 Vercel failure; rest docs |
| Worktree hygiene | 72 | ⚪ | 14 worktrees; 2 with dirty files |
| Source code safety | 95 | 🟢 | 0 staged source changes, no unpushed prod code |
| Stale cleanup | 50 | 🔴 | 4 old PRs (#7/#17/#22/#75) not closed |
| **Overall** | **76** | 🟡 | Ship #261, close old PRs, commit wt-ipi-337 |

## Highest-priority corrections

| Pri | PR/Branch | Issue | Correction |
|-----|-----------|-------|------------|
| 🟢 P0 | **#261** shoot-asset-raw | Mergeable, all CI green | Ship it — 2 files, 20 lines |
| 🟡 P1 | **#164** intel panel phase B | Vercel FAILURE + Codacy issues | Triage before merge; 15 production files |
| 🟡 P1 | **wt-ipi-337** | 5 uncommitted UI files (shoots/page.tsx, operator-panel, etc.) | Commit or stash before context switch |
| ⚪ P2 | **#236** lean CI fix | app-build FAILURE but non-urgent (CI config) | Rebase and fix if blocking other PRs |
| ⚪ P2 | **#7/#17/#22/#75** | Stale PRs, legacy code, CI failures | Close or rebase; no source conflicts today |

## PR-by-PR audit

| PR | Branch | Grade | Action |
|----|--------|-------|--------|
| **#261** | shoot-asset-raw | 🟢 | Merge (all CI green, 20 lines) |
| **#236** | lean-audit-p0-fixes | 🟡 | app-build failing but CI-only; non-urgent |
| **#214** | adoring-snyder (worktree fix) | 🟡 | Codacy needs review; CI skips (no app changes) |
| **#188** | claude-skills-git | 🟡 | Skill tracking; Codacy ACTION_REQUIRED |
| **#187** | docs-audit-linear-sync | 🟡 | Codacy + CodeRabbit PENDING; docs only |
| **#165** | docs-nextjs16-pr-fix | 🟡 | Codacy; docs/tooling only |
| **#164** | 286-route-aware-sections | ⚪ | **Vercel FAILURE** — 15 prod files, triage needed |
| **#75** | optibot-setup | 🔴 | Stale 12d; app-build fail; close |
| **#22** | brand-intake-complete | 🔴 | Stale 15d; legacy Vite; close |
| **#17** | com-010d-repo-integration-v2 | 🔴 | Stale 19d; close |
| **#7** | com-010a-commerce-docs | 🔴 | Stale 23d; close |

## Worktree health

| Status | Count | Worktrees |
|--------|-------|-----------|
| ✅ Clean | 10 | main, 286, 397, 426, 451-*, docs-audit, lean-audit, pr-165, shoot-asset-raw, verify-451 |
| 🟡 Dirty | 2 | **337** (5 prod files), **372** (untracked .env) |
| 🟡 Notes | 2 | adoring-snyder (auto-named), 426 (untracked tooling) |

## Will the tasks succeed?

**Yes,** if the priority order is followed:
1. Ship #261 (ready, mergeable)
2. Triage #164 (Vercel failure block?)
3. Commit/stash wt-ipi-337
4. Close stale PRs #7/#17/#22/#75
5. Worktree prune: `npm run worktree:audit -- --write`

## Production-ready?

**Yes for the main branch.** 0 staged source changes, 0 pending source commits on main. All active work happens in isolated worktrees. The only concern: wt-ipi-337 has uncommitted production UI changes that could be lost on forced cleanup.
