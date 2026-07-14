Linear shows RF-01/02/03/04a/04b, SCR-21, SCR-22, BE-B0b, and BE-D1 as **Done** — directly contradicting todo.md's 🔴 markings. That's the kind of status-field lie this skill exists to catch. Dispatching parallel agents to verify actual code before trusting either source.

Four verification agents are running in parallel (core screens, CRM+refactors, assets/matching/campaigns/booking, backlog confirmation). I'll wait for them to complete before synthesizing the tracker.

Waiting for the background agents to finish — I'll be notified automatically when they complete.

One agent done — confirms all 7 "Backlog" screens are genuinely not started (notifications has a dead backend API with zero UI). Waiting on the other 3.

Waiting for the remaining three verification agents to finish.

CRM refactor line (RF-01→04b, SCR-26/27/28/29) verified fully built — todo.md was stale there. But SCR-30 Pipeline is a bare placeholder despite Linear marking it "Done." Waiting on the last two agents.

Still waiting on the "core operator screens" and "assets/matching/campaigns/booking" verification agents to finish before I can synthesize the tracker.

Key finding: this worktree is **57 commits behind origin/main**, and booking (SCR-21/22) + campaigns schema (BE-D1) are actually built on main — todo.md just never got updated after merge. Also found a second, conflicting todo.md. One more agent to go.

The worktree is 58 commits behind `origin/main` (hard-block threshold is 30) — some agents checked local disk only. Let me spot-check origin/main for the "backlog" screens before finalizing, since booking turned out to be merged upstream but invisible locally.

CRM Pipeline (SCR-30/31) has a real `pipeline-workspace.tsx` + CSS module + tests on `origin/main` — the CrmScreenGate stub found by the CRM agent was stale local-branch state. Let me verify it's not a stub too.

Now I have full ground truth. Updating [todo.md](Universal-design-prompt-new/tasks/todo.md) with the verified statuses — several rows were significantly stale in both directions (CRM/booking underreported, SCR-05 underreported, SCR-03/SCR-10 overreported).

Now updating the rollup/readiness scores and current-focus section to reflect verified reality.

## Verification report — 2026-07-10 · DESIGN V2 Operator React Parity

**Method:** 4 parallel forensic agents read actual `app/` source + Supabase migrations against each SCR spec, cross-checked against Linear (`list_issues`, 139 issues) and `tasks/todo.md`. No status field was trusted without a code citation. **Critical finding:** this worktree is **58 commits behind `origin/main`** (hard-block threshold 30) — some screens (Booking Wizard/Detail, CRM Pipeline, Campaigns schema) only exist upstream and were invisible on first local pass.

### Progress tracker (27 screens with task files)

| Screen | Status | % | Evidence | Notes |
|---|:--:|--:|---|---|
| SCR-01 Command Center | 🟢 | 90 | `app/page.tsx:49-87`, `command-center/queries.ts` | Real Supabase KPI/brand fetch |
| SCR-02 Brand List | 🟢 | 92 | `brand/page.tsx:15-89` | Real query + DNA score |
| SCR-03 Brand Detail | 🟡 | 80 | `brand-detail-workspace.tsx:271-286` | **Assets grid is fake** — hash-derived stock images, fake count |
| SCR-04 Shoots List | 🟢 | 85 | `shoots/page.tsx:22-25` | Real `shoot_portfolio_view` query |
| SCR-05 Shoot Detail | 🟢 | 85 | `app/src/components/shoot/*-tab.tsx` (9 files) | **Was tracked at 40% — false.** Zero `Placeholder` refs left, all 9 tabs real |
| SCR-06 Shoot Wizard | 🟢 | 80 | `shoots/new/page.tsx:66-74` | 6-step scope-lock matches spec exactly |
| SCR-07 Campaigns | 🔴 | 5 | `campaigns/page.tsx` (12 lines) | `SectionPlaceholder` only |
| SCR-08 Assets | 🔴 | 5 | `assets/page.tsx` (16 lines) | `SectionPlaceholder` only; API exists, no UI |
| SCR-09 Matching | 🟡 | 60 | `talent-tab.tsx` (373 lines) | Talent tab real, Supabase-wired; Creator/Asset/Product disabled |
| SCR-10 Channel Preview | 🟡 | 75 | `channel-preview-studio.tsx` | Real switcher/spec fetch; bare div shell, static sandbox asset |
| SCR-11 Onboarding | 🟢 | 87 | `onboarding/page.tsx:43-79` | Real 3-step flow; **Linear says "Todo" — Linear is stale, not code** |
| SCR-15 Notifications | 🔴 | 15 | `api/notifications/*` | Backend only, zero UI consumer |
| SCR-16 Analytics | ⚪ | 0 | none found | Confirmed not started |
| SCR-17 Campaign Performance | ⚪ | 0 | none found | Confirmed not started |
| SCR-18 Collaboration/Activity | ⚪ | 0 | none found | Confirmed not started |
| SCR-20 Talent Profile | ⚪ | 0 | none found | Confirmed not started |
| SCR-21 Booking Wizard | 🟢 | 90 | `booking-wizard-workspace.tsx` (462 ln, 18 tests) | **`origin/main` only** — todo.md's 0% was false |
| SCR-22 Booking Detail | 🟢 | 85 | `booking-detail-workspace.tsx` (513 ln, 12 tests) | **`origin/main` only** — todo.md's 0% was false |
| SCR-23 Availability Editor | ⚪ | 0 | none found | Confirmed not started (migrations exist, no UI) |
| SCR-24 Talent Onboarding | ⚪ | 0 | none found | No Linear issue tracking it either |
| SCR-25 Role Dashboards | ⚪ | 0 | none found | Confirmed not started |
| SCR-26 CRM Companies List | 🟢 | 95 | `crm/companies/page.tsx` | Real; filter buttons stubbed |
| SCR-27 CRM Company Detail | 🟢 | 95 | `company-detail-workspace.tsx` | 4 real tabs |
| SCR-28 CRM Contacts List | 🟢 | 95 | `crm/contacts/page.tsx` | Real; filter buttons stubbed |
| SCR-29 CRM Contact Detail | 🟢 | 95 | `contact-detail-workspace.tsx` | 3 real tabs |
| SCR-30 CRM Pipeline | 🟢 | 85 | `pipeline-workspace.tsx` (207 ln) | **`origin/main` only** — real kanban, 6 stages, at-risk filter. Local branch showed a stub; that was stale-branch, not reality |
| SCR-31 CRM Deal Detail | 🔴 | 15 | `crm/pipeline/[id]/page.tsx` | Org-scoped existence guard only, `CrmScreenGate` stub past that |

**Refactor prerequisites** — all previously tracked 🔴/🟡, all verified 🟢 done: RF-01 StatusChip, RF-A7b EmptyState/ErrorState, RF-02 EntityList, RF-03/RF-04a/RF-04b CRM shells. **Backend**: BE-D1 Campaigns schema 🟢 done (migration live, `origin/main` only), BE-B0b Booking agent 🟢 done.

### Composite

| Dimension | Was tracked | Verified | 
|---|--:|--:|
| Operator-core screens | 72 | **84** |
| CRM (UI) | 25 | **80** |
| Booking (UI+agent) | 15 | **85** |
| Analytics/Notifications | 3 | 4 |
| **Overall** | **~38/100** | **~64/100** |

### Red flags

| Flag | Sev | Evidence |
|---|---|---|
| Worktree 58 commits behind `origin/main` | 🔴 | `scripts/worktree-health.mjs` hard-blocks at 30 |
| Two conflicting trackers | 🟡 | `Universal-design-prompt-new/todo.md` (repo root) vs `tasks/todo.md` — the one just updated |
| SCR-03 fake asset grid violates spec's own anti-fake rule | 🟡 | `sample-images.ts` hash-derived stock pool |
| Linear "Done" ≠ reality for SCR-30 pre-rebase view | 🟡 | resolved — real on `origin/main`, stub on this branch |

**Stop condition:** Not a code-change task, so no execute/no-execute gate applies — but **rebase this worktree before writing any new screen code**, since local disk currently disagrees with shipped reality on 3 screens.

### Next screens to build (ranked by payoff/effort)

1. **SCR-31 CRM Deal Detail** (15%→) — pipeline board already links to it; smallest remaining CRM gap, same patterns as SCR-27/29 already proven.
2. **SCR-07 Campaigns UI** (5%→) — schema (BE-D1) is already done and unblocked; only the UI is missing.
3. **SCR-08 Assets masonry** (5%→) — API route exists; matches CRM-list patterns (EntityList) already built.
4. **SCR-03 fix** — swap the fake asset grid for a real query; small, fixes a spec violation.
5. **SCR-15 Notifications inbox** — backend is already built and idle; wiring a UI to it is the highest-leverage "shipped but disconnected" fix per repo's continuous-improvement principle.

[Universal-design-prompt-new/tasks/todo.md](Universal-design-prompt-new/tasks/todo.md) is updated with all of the above.