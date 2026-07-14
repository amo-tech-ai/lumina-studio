# July 7 Linear Audit — Master Index

**Source:** `linear/ALL issues (3).csv` — 450 issues  
**Generated:** 2026-07-07  
**Verdict:** 🟡 71/100 composite — Safe to execute after 3 fixes

## Files

| # | File | Grade | Purpose |
|---|------|-------|---------|
| 01 | [01-linear-triage-overview.md](july-7/01-linear-triage-overview.md) | 🟡 | Big picture: 450 issues, 52% Backlog |
| 02 | [02-stale-cancel-close-audit.md](july-7/02-stale-cancel-close-audit.md) | 🟢 | 59 Canceled/Duplicate — all correct |
| 03 | [03-blockers-dependencies-audit.md](july-7/03-blockers-dependencies-audit.md) | 🟡 | 3 sequencing issues, 7 conflicting PRs |
| 04 | [04-crm-audit.md](july-7/04-crm-audit.md) | 🟡 | CRM: backend done, UI chain correct |
| 05 | [05-booking-audit.md](july-7/05-booking-audit.md) | 🟡 | Booking: agent safe, UI deferred |
| 06 | [06-campaigns-rls-audit.md](july-7/06-campaigns-rls-audit.md) | 🟡 | Campaigns: schema solid, RLS auth gap |
| 07 | [07-cloudinary-audit.md](july-7/07-cloudinary-audit.md) | 🟡 | Cloudinary: config broken, 34 backlog items |
| 08 | [08-intelligence-panel-audit.md](july-7/08-intelligence-panel-audit.md) | 🟡 | Intel panel: Phase B merged, specs stale |
| 09 | [09-gemini-groq-audit.md](july-7/09-gemini-groq-audit.md) | 🟡 | Groq: 4/7 phases done, golden eval pending |
| 10 | [10-production-readiness-audit.md](july-7/10-production-readiness-audit.md) | 🔴 | 0 error.tsx files — P0 blocker |
| 11 | [11-corrected-build-order.md](july-7/11-corrected-build-order.md) | 🟡 | Safe next steps prioritized |
| 12 | [12-final-executive-summary.md](july-7/12-final-executive-summary.md) | 🟡 | Final scores + next 3 PRs |

## Quick commands

```bash
# Verify error.tsx gap
find app/src/app -name 'error.tsx'

# Check PR status
gh pr list --state open --json number,headRefName,mergeable

# Worktree health
npm run worktree:health

# Full app gate
cd app && npm run lint && npm run typecheck && npm test
```

## Top 5 immediate fixes

1. **🚀 Ship PR #261** — mergeable, all green, 20 lines
2. **🛡️ Add error.tsx** — 17 routes with zero error boundaries
3. **🔄 Rebase PR #236** (lean CI fix — 2 files, simple rebase)
4. **🔧 Fix CLOUDINARY_CLOUD_NAME** (IPI-349 — blocks upload)
5. **🚮 Close stale PRs** #7, #17, #22, #75 (legacy, no source changes)
