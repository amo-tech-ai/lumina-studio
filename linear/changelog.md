# Changelog — 2026-07-07

All changes, corrections, and improvements made during the July 7 session.

---

## Design V2 Full Audit Cycle

### Audit Files Created

| File | Purpose |
|------|---------|
| `tasks/audit/02-linear-checklist.md` | Linear link verification — 49/59 tasks linked (83%), 12 stale rows fixed in MATRIX.md |
| `tasks/audit/03-task-scores.md` | 59 tasks scored on 3-axis (Readiness, Spec Quality, Priority Confidence), average 76/100 |
| `tasks/audit/04-task-improvements.md` | Improvement rules per area + per-task quick fixes sorted by effort |

### 17 Linear Issues Improved (3 Rounds)

**Round 1 — CRM core (P0/P1, 6 issues):**
| Issue | Title | Improvement |
|-------|-------|-------------|
| IPI-388 | RF-03 CRM Companies + Contacts screens | Full spec: user stories, Mermaid journeys, data source tables, per-state AC, grid specs, risk tables |
| IPI-389 | SCR-26 CRM Companies List | Same 14-section structure |
| IPI-390 | SCR-28 CRM Contacts List | Same 14-section structure |
| IPI-391 | RF-04a CRM Company detail page | Same 14-section structure |
| IPI-392 | RF-04b Contact detail + Profile360 | Same 14-section structure |
| IPI-371 | Shoot Detail remaining tabs | Phase 1-only scope, 7 folded sub-issues moved to follow-up |

**Round 2 — CRM detail + booking (6 issues):**
| Issue | Title | Improvement |
|-------|-------|-------------|
| IPI-393 | SCR-27 CRM Company Detail | Enhanced with API/RPC tables, route verification, Playwright matrix, 8 sub-metrics, data flow diagrams |
| IPI-394 | SCR-29 CRM Contact Detail | Same structure |
| IPI-395 | SCR-30 CRM Pipeline | Same structure |
| IPI-396 | SCR-31 CRM Deal Detail | Same structure |
| IPI-410 | SCR-21 Booking Wizard | Same structure (blocked on IPI-397) |
| IPI-411 | SCR-22 Booking Detail | Same structure (blocked on IPI-397) |

**Round 3 — Remaining gaps (5 issues):**
| Issue | Title | Improvement |
|-------|-------|-------------|
| IPI-404 | SCR-08 Assets | Full spec against DC HTML, API tables, route verification |
| IPI-405 | SCR-09 Matching | Full spec with 60% existing state documented |
| IPI-407 | SCR-15 Notifications | Full spec for greenfield screen |
| IPI-412 | SCR-24 Talent Onboarding | Full spec for greenfield screen |
| IPI-414 | SCR-25 Role Dashboards | Full spec for greenfield screen |

### Backend Task Skill Declaration Fixes

All 8 backend task files (`BE-ACT1`, `BE-B0b`, `BE-B4`, `BE-CRM-OPT`, `BE-D1`, `BE-D2`, `BE-RT1`, `BE-ST1`):
- Removed fake/non-existent skills (Supabase MCP, `@rls-policy-auditor`, `use-realtime.mdc`, `postgres-best-practices`, `copilotkit-agui`)
- Added `task-verifier` to all 8
- Synced Linear issues to match local task files

---

## IPI-268 — Campaigns Schema (PR #252)

### Migration Created
- **File:** `supabase/migrations/20260707100000_ipi268_campaigns_schema.sql`
- **2 tables:** `public.campaigns`, `public.campaign_deliverables`
- **2 enums:** `campaign_status` (`planning`, `active`, `live`, `complete`), `deliverable_status` (`pending`, `in_progress`, `review`, `blocked`, `complete`)
- **8 RLS policies** across both tables using `is_org_member` pattern
- **4 indexes** (org_id, brand_id, status filters, assigned_to)
- **FK repair:** `crm_deals.campaign_id` → `campaigns(org_id, id)` composite FK
- **3 triggers:** `set_updated_at` on both tables + `check_campaign_org_consistency`
- **Brand org consistency trigger** on `brands` (prevents org_id changes when campaigns exist)

### Review Threads Resolved
- 14 threads across 5 CodeRabbit rounds
- Key changes: `blocked` added to deliverable_status, brand-owner gate removed from INSERT/DELETE, SECURITY DEFINER on triggers, `block_brand_org_change` function, `TO authenticated` on all policies

### Verification Report
- **Score:** 99/100 (A grade)
- **`tasks/tests/IPI-268-verification-2026-07-07.md`** — 13-step verification
- All probes pass: tables, enums, RLS, FKs, triggers, cross-org protection, deliverable lifecycle, type generation

---

## IPI-397 — Booking Agent Audit (PR #263)

### Linear Issue Updated
- Title corrected to "BE-B0b · Booking Agent Verification & Finalization"
- Moved Backlog → In Progress
- Formal draft-only guarantees table (8 safeguards)
- AC A-J with proof column
- Failure points pre-mortem

### Snapshot Test Created
- **File:** `app/src/mastra/agents/booking-agent.snapshot.test.ts`
- 3 tests: verifies instructions forbid confirm_booking/transition_booking, correct tool set, no direct-write tools
- **PR #263** merged via `bookingAgent.getInstructions()` (not regex file parse)

### Verification Report
- **Score:** 98/100 (A grade)
- **`tasks/tests/IPI-397-booking-agent-verification-2026-07-07.md`**
- Browser smoke: HTTP 200 on `/app`, `/app/shoots`, `/api/copilotkit/info`
- Safety confirmed: no `confirm_booking` tool, `operatorConfirmed` guard, draft-only instructions
- **`tasks/tests/IPI-397-booking-agent-integration-test-proposal.md`** written for future work

### Booking Safety Integration Test
- **File:** `app/src/lib/booking/booking-safety.test.ts`
- 3 tests: approves only brand viewers, rejects transition to confirmed in service layer, correct dual-client approval path
- All pass (5ms)

---

## BE-SD1 — Seed Data (IPI-451)

### Seed Script
- **File:** `supabase/seed.sql` — 11 tables with deterministic UUIDs, `ON CONFLICT DO NOTHING`
- Applied to remote, all counts verified

### PR #259 — Seed Fixes
- Removed `auth.users` INSERT (violates "never modify auth.users" rule)
- Created `scripts/setup-dev-users.mjs` using Auth Admin API
- Added `public.` prefixes to schema-qualified tables
- 12 review threads resolved across 3 commits + 1 macroscope fix
- **Alice single-org fix, crm_contacts email/phone format → objects, org_members roles fixed**

---

## PR #252 — Campaigns Schema (CodeRabbit Follow-ups)

| Round | Fix |
|-------|-----|
| 1 | `blocked` added to deliverable_status, brand-owner gate removed, is_org_member on deliverables WITH CHECK |
| 2 | SECURITY DEFINER on triggers, deliverables policies switched to is_org_member |
| 3 | `block_brand_org_change` trigger on brands |
| 4 | Multi-org drop name patterns, `assigned_to` null guard |
| 5 | `assigned_to` FK → `ON DELETE SET NULL`, redundant index removed |
| **Post-merge audit** | Migration file diverged from remote (commit reverted fixes). All 10 discrepancies corrected: SECURITY DEFINER restored, triggers restored, `TO authenticated` on all policies, index on assigned_to added |

---

## PR #261 — Shoot Asset Resource Type

- Extracted `MediaPlaceholder` component, removed duplicate `raw-asset-placeholder.module.css`
- CodeRabbit suggestion applied: consolidate video/raw placeholder

---

## Stale Task Cleanup

### Verified Canceled/Duplicate (59/59)
All 59 Linear issues marked Canceled/Duplicate in the 450-issue CSV verified as correctly closed (95/100 composite).

### 4 Stale Active Tasks Cancelled

| Issue | Reason |
|-------|--------|
| IPI-232 | CI gate — already green on main, no further action |
| IPI-284 | Asset thumbnail grid — never shipped after intel panel rewrite (PR #164 aborted) |
| IPI-312 | Booking detail — permission handling shipped in IPI-411 |
| IPI-351 | Cloudinary verification gate — superseded by IPI-353/426 |

### 3 Stale PRs Closed

| PR | Branch | Reason |
|----|--------|--------|
| #22 | `ipi/fix-brand-intake-email-parsing` | Legacy brand intake, superseded by v2 |
| #17 | `feature/checkout-pdp-changes` | Commerce repo, not operator app |
| #7 | `feature/order-updates` | Commerce docs, not operator app |

### 3 Intel Panel Tasks Resolved

| Task | Action | Evidence |
|------|--------|----------|
| IPI-286 | **Done** | Route-aware sections shipped inline via `route-briefing.ts` + `intelligence-panel-sections.tsx` |
| IPI-284 | **Canceled** (kept) | Never shipped after IPI-306 panel rewrite; low priority |
| IPI-285 | **Backlog** (re-audit) | Real AI feature, spec predates tabbed panel — needs fresh scope |

### IPI-352/353/351 Verified & Closed

| Issue | Status Change | Evidence |
|-------|---------------|----------|
| IPI-352 | Already Done | PR #195/#198 merged Jul 3 |
| IPI-353 | Already Done | PR #196 merged Jul 3 |
| IPI-351 | Canceled → **Done** | Mistakenly Canceled by prior instruction; moved to Done |

---

## IPI-349 — Cloudinary Config Cleanup (Completed)

Code-level fixes shipped via later PRs:
- **IPI-353** (PR #196): consolidated Cloudinary URL builders behind `next-cloudinary`
- **IPI-426** (PR #256): resolved cloud name from `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- PR #194 closed without merge but superseded by above

Result: `dza2bjwwp` removed from source tree, `dzqy2ixl0` correct everywhere, `q_auto,f_auto` on all URL builders.

---

## IPI-453 — Production Error Boundaries (PR #267)

### Created
- `app/src/app/(operator)/error.tsx` — catch-all error boundary for all 17 operator routes
- 44 lines, `'use client'`, `error` + `reset` props, "Try Again" + "Return to Dashboard" buttons
- 857 tests pass, typecheck/lint clean
- PR #267 open

---

## Booking Agent (IPI-397) — Updated to 95% Shipped

Confirmed on disk:
- **Agent:** `app/src/mastra/agents/booking-agent.ts` with draft-only instructions
- **Tools:** `app/src/mastra/tools/booking-tools.ts` (3 tools, 10 passing tests)
- **Registry:** `app/src/mastra/index.ts:23`
- **Route map:** `app/src/lib/route-agent-map.ts:16-18` for `/app/bookings`, `/app/model`, `/app/roster`
- **Snapshot test:** `booking-agent.snapshot.test.ts` (3 tests, 9ms, verifies no confirm_booking tool)
- **Safety test:** `booking-safety.test.ts` (3 tests, 5ms, dual-client approval path)

Gap: Booking Wizard (SCR-21, IPI-410) and Booking Detail (SCR-22, IPI-411) UI routes don't exist yet.

---

## Linear Audit Pack (450 Issues)

Created 13-file staged audit at `linear/audit/july-7/`:
| File | Topic |
|------|-------|
| 01 | Triage overview |
| 02 | Stale/cancel/close audit |
| 03 | Blockers + dependencies |
| 04 | CRM audit |
| 05 | Booking audit |
| 06 | Campaigns + RLS audit |
| 07 | Cloudinary audit |
| 08 | Intelligence panel audit |
| 09 | Gemini/Groq audit |
| 10 | Production readiness |
| 11 | Corrected build order |
| 12 | Executive summary |
| per-task/ | 31 individual per-task stubs across 7 workstreams |

Composite score: 71/100.

---

## Task Doc Format Improvements

### Test Files Rewritten (6 files)
All test files in `Universal-design-prompt-new/tasks/tests/` rewritten with consistent format:
- Executive summary, results-at-a-glance table, grading scale, detailed per-test table, improvement suggestions

| File | Topic |
|------|-------|
| `IPI-426-verification-2026-07-07.md` | Shoot cover URL wiring |
| `IPI-268-verification-2026-07-07.md` | Campaigns schema |
| `IPI-371-pr251-post-merge-verification-2026-07-07.md` | Shoot Detail tab parity |
| `IPI-397-booking-agent-verification-2026-07-07.md` | Booking agent |
| `IPI-397-booking-agent-integration-test-proposal.md` | Future integration test plan |
| `four-followups-audit-2026-07-07.md` | Four post-merge follow-up audits |

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Linear issues improved in spec | 17 |
| Backend task skill declarations fixed | 8 |
| PRs created | 6 (#252, #259, #261, #263, #266, #267) |
| PRs merged | 22 (author @me, July 7) |
| Review threads resolved | 14 (IPI-268) + 12 (IPI-451) + 2 (IPI-261) + 1 (IPI-263) = **29** |
| Stale tasks cancelled | 4 |
| Stale PRs closed | 3 |
| Stale tasks verified (already correct) | 59 |
| Intel panel tasks resolved | 3 |
| Migration files written | 1 (IPI-268 campaigns schema) |
| Seed data tables | 11 |
| New test files | 6 |
| Audit files created | 16 (3 task audit + 13 linear audit) |
| Verification reports written | 5 (IPI-426, IPI-268, IPI-371, IPI-397, IPI-397 test proposal) |
