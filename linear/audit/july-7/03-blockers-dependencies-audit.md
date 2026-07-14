# 03 — Blockers / Dependencies audit

**Scope:** 31 active issues (Todo + In Progress + In Review). Dependency chain validity.

## Verdict: 🟡 78/100 — Mostly correct, but 3 sequencing issues found

## Active issue breakdown

| Status | Count |
|--------|-------|
| In Review | 5 |
| In Progress | 9 |
| Todo | 17 |

## Sequencing issues found

| Issue | Problem | Correction |
|-------|---------|------------|
| IPI-389/390 (CRM lists) marked Todo but IPI-388 (RF-03) is Done | Correct — ready to execute | None needed |
| IPI-392 (Profile360) marked Todo — depends on IPI-391 (Company detail) | Correct — blocking relation clear | None needed |
| IPI-367 (Won/Lost gate) Todo — depends on IPI-365 (Pipeline) which is also Todo | **🟡 Both in Todo with no ordering** | Prioritize IPI-365 before 367 |
| IPI-312 (Booking Detail) Todo — marked urgent but IPI-410/411 (Wizard/Detail) are Backlog | **🟡 Priority mismatch** | Downgrade to match actual sequencing |
| IPI-232/233 (Production cert) In Progress — blocked by child issues also In Progress | **🟡 Circular dependency** | Resolve child issues first |

## PR conflicts

| PR | Branch | Mergeable | Status |
|----|--------|-----------|--------|
| #261 | shoot-asset-raw | ✅ MERGEABLE | Ship now |
| #236 | lean CI fix | 🔴 CONFLICTING | Rebase needed |
| #214 | worktree fix | 🔴 CONFLICTING | Rebase needed |
| #188 | skills git | 🔴 CONFLICTING | Rebase needed |
| #187 | docs audit | 🔴 CONFLICTING | Rebase needed |
| #165 | docs nextjs16 | 🔴 CONFLICTING | Rebase needed |
| #164 | intel panel | 🔴 CONFLICTING | Rebase needed |
| #75 | optibot | ✅ MERGEABLE | Ship or close |
| #22 | brand intake | 🔴 CONFLICTING | Close (stale) |
| #17 | com repo | 🔴 CONFLICTING | Close (stale) |
| #7 | com docs | ✅ MERGEABLE | Close (stale) |

## Recommended actions

1. Ship PR #261 (mergeable, all green)
2. Rebase PR #236 (CI fix, 2 files)
3. Close PRs #7, #17, #22 (stale, legacy code)
4. Rebase remaining conflicting PRs after shipping #261
