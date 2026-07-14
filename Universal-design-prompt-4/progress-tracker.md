# Progress Tracker — Design (`Universal-design-prompt-4/Pages`) vs. Real Implementation (`app/`)

**Date:** 2026-07-12
**Method:** For every screen mockup in `Universal-design-prompt-4/Pages/*.dc.html`, verified against the real Next.js app at `/home/sk/ipix/app/src/app/(operator)/` — confirmed the route exists, read the page + its main components, checked for a real Supabase/RPC/API data source vs. hardcoded mock data, checked structural parity against the `.dc.html`, grepped for stub markers (TODO/FIXME/"coming soon"/placeholder), and checked for a matching test file. Read-only pass, no files modified.
**Legend:** 🟢 Complete (≥85%, real data, tested, no blocking stubs) · 🟡 In progress (40-84%, real but partial/scoped-down) · 🔴 Failed/broken stub (1-39%, placeholder or unwired despite code existing) · ⚪ Not started (0%, confirmed no implementation)

**In plain English:** about half the app is real, working, and tested. The other half splits into two different problems — some screens are just empty placeholders (Analytics, Assets, Campaigns), and some have a fully-built backend nobody wired a screen to yet (Planner, Notifications). Every screen below now links to its actual Linear ticket, so "what's the status" and "what's the ticket for it" are answered in the same place.

---

## Executive summary

| Status | Count | Meaning |
|---|--:|---|
| 🟢 Complete | 7 | Real data, tests, structurally matches design |
| 🟡 In progress | 10 | Real and wired, but scoped down vs. design or missing pieces |
| 🔴 Failed / stub / disconnected | 8 | Either a bare placeholder, or real backend code with **zero** UI wiring |
| ⚪ Not started | 13 | Confirmed no code anywhere |
| **Total screens tracked** | **38** | Covers all 37 `Pages/*.dc.html` files + the CRM Hub (no design spec, real route) |

**Overall weighted completion: ~52%.** The core Operator surface (Command Center, Brand List/Detail, Shoots List, Channel Preview) and most of CRM + Matching + Booking are real, RPC-backed, and tested. The two biggest gaps are **Planner** (a fully-designed 4-screen feature with a real 440-line backend engine + test suite that no route or component ever imports) and a cluster of screens with **zero implementation** (Analytics, Notifications UI, Collaboration, Talent Profile/Onboarding/Availability, Role Dashboards, and all mobile-responsive layouts).

---

## Operator core screens

| Screen             | Design file                              | Route                                          | Data source                                                                 | Tests                                |                               Linear                               |   % | Status |
| ------------------ | ---------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------ | :----------------------------------------------------------------: | --: | :----: |
| Command Center     | `Command Center.v2.image-first.dc.html`  | `app/(operator)/app/page.tsx`                  | Real — `supabase.from("brands")` + `fetchCommandCenterKpis()`               | `command-center-brand-sync.test.tsx` |                                 —                                  |  90 |   🟢   |
| Brand List         | `Brand List.v2.image-first.dc.html`      | `app/(operator)/app/brand/page.tsx`            | Real — `brands` + `brand_scores` join                                       | 3 test files                         |                            IPI-271/272                             |  95 |   🟢   |
| Brand Detail       | `Brand Detail.v2.image-first.dc.html`    | `app/(operator)/app/brand/[id]/page.tsx`       | Real — parallel queries + HITL `reanalyzeBrand` server action               | 2 test files                         |                               IPI-17                               |  95 |   🟢   |
| Shoots List        | `Shoots List.v2.image-first.dc.html`     | `app/(operator)/app/shoots/page.tsx`           | Real — `shoot_portfolio_view`                                               | 3 test files                         |                              IPI-273                               |  95 |   🟢   |
| Shoot Detail       | `Shoot Detail.v2.image-first.dc.html`    | `app/(operator)/app/shoots/[shootId]/page.tsx` | Real — `get_shoot_detail` RPC                                               | 2 test files (1 of 9 tabs tested)    | IPI-337 — Edit/Share/More + "Generate shot list" disabled, Phase 2 |  80 |   🟡   |
| Shoot Wizard       | `Shoot Wizard.v2.image-first.dc.html`    | `app/(operator)/app/shoots/new/page.tsx`       | Real — Mastra `/api/workflows/shoot-wizard` + `/api/shoots/commit`          | None for page                        |              IPI-274 — scope-locked to 6 of 10 steps               |  55 |   🟡   |
| Channel Preview    | `Channel Preview.v2.image-first.dc.html` | `app/(operator)/app/preview/page.tsx`          | Real — `getAllChannelSpecs()` server data, live spec-driven frame preview   | —                                    |                                 —                                  |  90 |   🟢   |
| Onboarding (Brand) | `Onboarding.v2.zeely.dc.html`            | `app/(operator)/app/onboarding/page.tsx`       | Real — org/brand insert + `start-brand-crawl`/`brand-intelligence` edge fns | 2 test files (logic only)            |                                 —                                  |  55 |   🟡   |
| Campaigns          | `Campaigns.v2.image-first.dc.html`       | `app/(operator)/app/campaigns/page.tsx`        | **Mock/stub** — bare `<SectionPlaceholder>`, zero data fetch                | None                                 |                     **IPI2-119** "Coming soon"                     |   5 |   🔴   |
| Assets             | `Assets.v2.image-first.dc.html`          | `app/(operator)/app/assets/page.tsx`           | **Mock/stub** — same `<SectionPlaceholder>` pattern                         | Helper-only test, not the route      |                     **IPI-248** "Coming soon"                      |   8 |   🔴   |

**Real gap called out:** the Shoot Wizard's real flow has 6 steps vs. the design's 10 (no Moodboard/Production Plan/Timeline/Call Sheet); the Onboarding page is a 3-step light-theme form vs. the design's 13-screen dark image-first wizard. Both are functioning, tested-at-the-logic-level features — just materially smaller in scope than what was designed.

---

## CRM screens

| Screen | Design file | Route | Data source | Tests | Linear | % | Status |
|---|---|---|---|---|:--:|--:|:--:|
| Companies List | `SCR-26-CRM-Companies-List.dc.html` | `app/(operator)/app/crm/companies/page.tsx` | Real — `listCompanies()`/`getProfileNames()` | `companies-workspace.test.tsx` | IPI-363 — New/Filter disabled; some chips dropped (documented) | 80 | 🟡 |
| Company Detail | `SCR-27-CRM-Company-Detail.dc.html` | `app/(operator)/app/crm/companies/[id]/page.tsx` | Real — `getCompanyDetail()` | `company-detail-workspace.test.tsx` | IPI-363 — AI relationship-summary card dropped (no backing RPC) | 85 | 🟡 |
| Contacts List | `SCR-28-CRM-Contacts-List.dc.html` | `app/(operator)/app/crm/contacts/page.tsx` | Real — `listContacts()`, jsonb email/phone | `contacts-workspace.test.tsx` (9 tests) | IPI-364 — same dropped-chip pattern as Companies | 80 | 🟡 |
| Contact Detail | `SCR-29-CRM-Contact-Detail.dc.html` | `app/(operator)/app/crm/contacts/[id]/page.tsx` | Real — `getContactDetail()` | `contact-detail-workspace.test.tsx` (12 tests) | IPI-364 | 85 | 🟡 |
| Pipeline | `SCR-30-CRM-Pipeline.dc.html` | `app/(operator)/app/crm/pipeline/page.tsx` | Real — `listDeals()`, 6-stage kanban | `pipeline-workspace.test.tsx` (16 tests) | IPI-395 — "at risk" is a 14-day heuristic, not a real score | 85 | 🟡 |
| Deal Detail | `SCR-31-CRM-Deal-Detail.dc.html` | `app/(operator)/app/crm/pipeline/[id]/page.tsx` | **404-gate only** — `crm_deals` existence check, no data rendered | None | **IPI-373** (design sign-off, In Progress) → **IPI-396** (React) | 15 | 🔴 |
| CRM Hub | *(no design spec exists)* | `app/(operator)/app/crm/page.tsx` | N/A — pure `redirect("/app/crm/companies")` | N/A | — | 100 (of its real, tiny scope) | 🟢 |

**Biggest single gap in CRM:** Deal Detail (`SCR-31`) is fully designed (stage control, Won/Lost approval gate, activity timeline, intelligence panel) but the route only auth/404-gates and shows a placeholder — explicitly pending a separate Linear ticket (`IPI-373`).

---

## Matching & Booking

| Screen | Design file | Route | Data source | Tests | Linear | % | Status |
|---|---|---|---|---|:--:|--:|:--:|
| Talent Matching | `Matching.v2.image-first.dc.html` | `app/(operator)/app/matching/page.tsx` | Real — `search_talent`/`get_or_create_shortlist`/`toggle_shortlist_item` RPCs | `talent-tab.test.tsx` | **IPI-528** — fixes the disabled "Request booking" button + mislabeled ticket refs | 82 | 🟡 |
| Booking Wizard | `booking/SCR-21-Booking-Wizard.plan.md` (extends `Shoot Wizard.v2.image-first.dc.html`) | `app/(operator)/app/matching/talent/[id]/book/page.tsx` | Real — `check_talent_availability` RPC, `create_booking_request` RPC, deterministic quote-draft | `booking-wizard-workspace.test.tsx` (18 tests) + 5 more test files | IPI-311 | 88 | 🟡 |
| Booking Detail | `booking/SCR-22-Booking-Detail.plan.md` | `app/(operator)/app/bookings/[id]/page.tsx` | Real — `get_booking`/`transition_booking`/`confirm_booking` RPCs, optimistic-lock concurrency | `booking-detail-workspace.test.tsx` (12 tests) + 2 more | IPI-312 | 90 | 🟢 |
| SCR-09 (alt Matching spec) | `SCR-09-Matching-Talent.dc.html` | *(none — superseded)* | — | — | — (superseded by the design file actually implemented) | 0 (of this specific spec) | ⚪ |

**Note on the row above:** `talent-tab.tsx` also has Creator/Asset/Product tabs disabled and no talent-photo rendering despite "image-first" naming — both are separate, smaller gaps folded into `IPI-528`'s scope alongside the booking-button fix.

**Note:** the design docs (`tasks/screens/SCR-21…`) say these two booking screens are "greenfield, 0%," while `booking/*.plan.md` says "BUILT" — the docs contradict each other, and the real code is further along than either claims. Both wizard and detail are genuinely real, RPC-backed, and heavily tested.

---

## Planner — designed, backend-real, zero UI (distinct "disconnected" bucket)

**Why 🔴/⚪ and not "in progress":** `app/src/lib/planner/engine.ts` (440 lines) + `types.ts` (166 lines) + `engine.test.ts` (406 lines) are real, tested business logic — but `grep -rl "lib/planner" app/src` outside that folder returns **zero results**. No route, no API handler, no component imports it yet. This is genuinely ~1000 lines of real, tested, currently-dead code waiting on the UI to be built — not a design gap, an implementation-sequencing fact. As of 2026-07-12 it's fully broken into a Linear plan (`Universal-design-prompt-4/planner/implementation-roadmap.md`) — every row below now has a real ticket, not just a status dot.

### Foundation & shared layer — build once, all 4 screens depend on it

**Ticket count corrected 2026-07-12 (verified live against Linear, not assumed):** 33 issues were created during roadmap execution, then ladder-reviewed to **10 active implementation tickets + 23 cancelled** (5 oversized parent trackers + 18 absorbed leaves, all still viewable in Linear as Canceled for traceability). `IPI-543` below was one of the 23 — its one useful piece (fixture→schema field mapping) is a checklist line inside `IPI-536` Foundation, not a standalone ticket. No further Planner tickets should be created for v1 unless a real blocker appears.

| Layer | What it does | Linear | Status |
|---|---|---|:--:|
| Schema + reusable engine | The 10-table `planner.*` schema, RLS, and the pure `PlannerEngine` class | [IPI-476](https://linear.app/amo100/issue/IPI-476) | 🟢 Done (94/100) |
| Shoot production timeline template | The default "5-Week Product Shoot" workflow, seeded for every org | [IPI-477](https://linear.app/amo100/issue/IPI-477) | 🟢 Done |
| Routes, state-mgmt decision, core infra | Route stubs, the shell, the state-library decision, shared constants | [IPI-536](https://linear.app/amo100/issue/IPI-536) | ⚪ Not started |
| Data & Repository layer | The one place that talks to Supabase + wraps `PlannerEngine` safely | [IPI-538](https://linear.app/amo100/issue/IPI-538) | ⚪ Not started |
| Shared components & hooks | Card/header/filter/status-chip/empty-state + the shared React hooks, built once for all 4 screens | [IPI-542](https://linear.app/amo100/issue/IPI-542) | ⚪ Not started |
| ~~Documentation & data contract~~ | ~~Maps every design mockup field to its real database column~~ | ~~IPI-543~~ | 🚫 **Cancelled** — folded into IPI-536 as a checklist line |
| Security hardening | Closes a real anon-access gap found in this audit + permission tests | [IPI-544](https://linear.app/amo100/issue/IPI-544) | ⚪ Not started |

### The 4 screens

| Screen | Design file | Route (once built) | Linear | % | Status |
|---|---|---|:--:|--:|:--:|
| Workspace — Timeline view | `SCR-32-Planner-Workspace.dc.html` | `/app/planner/[instanceId]` | [IPI-478](https://linear.app/amo100/issue/IPI-478) (shell) + [IPI-552](https://linear.app/amo100/issue/IPI-552) (Timeline) | 0 | 🔴 |
| Workspace — Kanban/Calendar/List | same | same | [IPI-553](https://linear.app/amo100/issue/IPI-553) | 0 | 🔴 |
| Dashboard | `SCR-33-Planner-Dashboard.dc.html` | `/app/planner/dashboard` | [IPI-479](https://linear.app/amo100/issue/IPI-479) (permissions) + [IPI-555](https://linear.app/amo100/issue/IPI-555) | 0 | 🔴 |
| Instance Settings | `SCR-34-Planner-Instance-Settings.dc.html` | `/app/planner/[instanceId]/settings` | IPI-479 + [IPI-556](https://linear.app/amo100/issue/IPI-556) | 0 | 🔴 |
| Hub | `SCR-35-Planner-Hub.dc.html` | `/app/planner` | [IPI-526](https://linear.app/amo100/issue/IPI-526) | 0 | 🔴 |
| Mobile/tablet (all 4 above) | `SCR-MOBILE-Planner-Gallery.dc.html` | — | [IPI-557](https://linear.app/amo100/issue/IPI-557) | 0 | ⚪ |

**Why "Timeline" and "Kanban/Calendar/List" are 2 separate tickets under one screen:** Timeline is the single hardest, newest piece of UI in the whole feature (~6 days alone); bundling it with the 3 simpler view modes would make one ticket too large to review as one PR.

**Not yet ticketed at leaf level (correctly deferred, not forgotten):** the AI assistant tools, CopilotKit approval flow, and Cloudflare real-time/notifications — all tracked at the epic level ([IPI-480](https://linear.app/amo100/issue/IPI-480), [IPI-481](https://linear.app/amo100/issue/IPI-481), [IPI-482](https://linear.app/amo100/issue/IPI-482), [IPI-483](https://linear.app/amo100/issue/IPI-483)) but genuinely gated by a separate, unrelated epic (the Mastra/Cloudflare provider cutover, `IPI-485`) — see `implementation-roadmap.md` for why this isn't a Planner-specific delay.

---

## Not started (confirmed zero implementation)

| Screen | Design file | Evidence searched | Linear | Status |
|---|---|---|:--:|:--:|
| Analytics | `Analytics.v2.image-first.dc.html` | No route, no component, no placeholder named "Analytics" | — not yet ticketed | ⚪ |
| Campaign Performance | `Campaign Performance.v2.image-first.dc.html` | No route anywhere; the one thing at `/app/campaigns` is an unrelated `SectionPlaceholder` stub | — not yet ticketed | ⚪ |
| Notification Center | `SCR-15-Notification-Center.dc.html` | **API-only** — `app/api/notifications/route.ts` + `/read/route.ts` fully built, auth-gated, validated, tested — but zero UI consumers found (no bell/dropdown/panel anywhere) | **IPI-527** | 🔴 (backend real, UI zero) |
| Collaboration / Activity Audit | `SCR-18-Collaboration-Audit.dc.html` | Zero matches for "collaboration"/"activity audit"/"activity log" | — not yet ticketed | ⚪ |
| Talent Profile | `SCR-20-Talent-Profile.dc.html` | Only the `[id]/book` sub-route exists; no `[id]` profile index page | — not yet ticketed | ⚪ |
| Availability Editor | `SCR-23-Availability-Editor.dc.html` | Zero matches for "availability" anywhere in `app/src` | — not yet ticketed | ⚪ |
| Talent Onboarding | `SCR-24-Talent-Onboarding.dc.html` | Only route named "onboarding" is Brand Onboarding (different feature, name collision only) | — not yet ticketed | ⚪ |
| Role Dashboards | `SCR-25-Role-Dashboards.dc.html` | Zero matches for "role-dashboard" or any role-variant dashboard route | — not yet ticketed | ⚪ |

---

## Mobile / responsive layouts

| Design reference | Real implementation | Evidence | Status |
|---|---|---|:--:|
| `SCR-MOBILE-Gallery.dc.html` | None | No `useMediaQuery`/`matchMedia` hook anywhere in `app/src` | ⚪ |
| `SCR-MOBILE-CRM-Gallery.dc.html` | None | No mobile-specific CRM layout | ⚪ |
| `SCR-MOBILE-Planner-Gallery.dc.html` | None | Planner has no UI at all yet (see above) | ⚪ |
| `SCR-MOBILE-BottomSheet.dc.html` | None | No `BottomSheet`/`BottomNavigation` component anywhere in `app/src` | ⚪ |
| `SCR-MOBILE-Booking-Shell.dc.html` | None | Booking screens have no distinct mobile layout | ⚪ |

**Finding:** zero deliberate mobile-responsive strategy exists for the operator app today. The only responsive Tailwind breakpoint usage (`sm:`/`md:`/`lg:`) found in the codebase is incidental — marketing/landing pages and shared UI primitives (`button.tsx`, `dialog.tsx`, `sheet.tsx`) — not applied to any operator screen. This is a genuine, repo-wide gap against all 5 mobile-gallery design references.

---

## Key risks & recommended next actions

1. **Planner is the single highest-value next build, and it's now fully ticketed** — the backend (`IPI-476`, `IPI-477`) is Done, the design is frozen, and the remaining work is **10 active Linear tickets** ([IPI-536](https://linear.app/amo100/issue/IPI-536), [IPI-538](https://linear.app/amo100/issue/IPI-538), [IPI-542](https://linear.app/amo100/issue/IPI-542), [IPI-544](https://linear.app/amo100/issue/IPI-544), [IPI-526](https://linear.app/amo100/issue/IPI-526), [IPI-555](https://linear.app/amo100/issue/IPI-555), [IPI-552](https://linear.app/amo100/issue/IPI-552), [IPI-553](https://linear.app/amo100/issue/IPI-553), [IPI-556](https://linear.app/amo100/issue/IPI-556), [IPI-557](https://linear.app/amo100/issue/IPI-557)) — 23 over-scoped tickets from the original draft were cancelled for traceability, not deleted. See `Universal-design-prompt-4/todo.md` Lane B for the finalized build order and `Universal-design-prompt-4/planner/implementation-roadmap.md`'s status banner for how the ~54-ticket draft became these 10.
2. **CRM Deal Detail (`SCR-31`) is the weakest link in an otherwise-strong CRM module** — everything else in CRM is 🟡 80-85%; this one is a bare placeholder pending `IPI-373`.
3. **Notification Center backend is fully built and completely unused** — [IPI-527](https://linear.app/amo100/issue/IPI-527) tracks wiring an existing, tested API to a UI bell/panel — a small lift relative to the API work already done.
4. **Matching → Booking handoff is disconnected by a UI toggle, not a missing feature** — [IPI-528](https://linear.app/amo100/issue/IPI-528) tracks re-enabling "Request booking," which is disabled even though the real Booking Wizard route already works.
5. **Mobile responsiveness is a zero, not a partial, across the entire operator app** — every one of the 5 mobile design references has no corresponding implementation. Planner's slice of this is tracked ([IPI-557](https://linear.app/amo100/issue/IPI-557)); Command Center/Brand/Shoots/CRM are not yet ticketed for mobile and should be scoped as their own initiative rather than assumed to "come along" with each screen.
6. **Campaigns and Assets are the two most design-complete, most implementation-empty screens** — both have fully detailed `.dc.html` mockups (400+ lines each) and a one-line `<SectionPlaceholder>` in production, tracked under `IPI2-119` and `IPI-248` respectively.
