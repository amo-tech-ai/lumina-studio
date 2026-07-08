# Design implementation tracker

**Updated:** 2026-07-06 · **MCP-verified Supabase** · CI 🟢  
**Task hub:** [`README.md`](./README.md) · **Checklists:** [`checklists.md`](./checklists.md) · **Discipline:** [`../plan/designtoreact.md`](docs/designtoreact.md)  
**Supabase audit:** [`../plan/data/supabase-plan.md`](../plan/data/supabase-plan.md) · **Linear audit:** [`../plan/audit/03-linear-audit.md`](../plan/audit/03-linear-audit.md)  
**Full audit:** [`../plan/02-implementation-audit.md`](../plan/audit/02-implementation-audit.md) · **Build sequence:** [`../plan/implement.md`](docs/implement.md) · [`../plan/refactor/build-order.md`](refactor/README.md)  
**Design HTML:** [`../HTML.md`](../HTML.md) · [`../Pages/`](../Pages/)

**Legend:** 🟢 ≥90% / shipped · 🟡 in progress / partial · 🔴 blocked / not started · ⚪ greenfield · ⏸ deferred · ✅ done — do not rebuild

> **Read top-to-bottom.** One row = one PR (one concern). Parallel rows share a step when safe.

---

## Master queue — implementation order

### Shipped — foundation + operator core (do not rebuild)

| ID | Task | React | Spec |
|---|---|:--:|---|
| F1 | Tokens · OperatorShell · providers | 🟢 | [implement.md Ph1](docs/implement.md) |
| **SCR-01** | Command Center | 🟢 90% | [SCR-01](./screens/SCR-01-command-center.md) |
| **SCR-02** | Brand List | 🟢 95% | [SCR-02](./screens/SCR-02-brand-list.md) |
| **SCR-03** | Brand Detail | 🟢 95% | [SCR-03](./screens/SCR-03-brand-detail.md) |
| **SCR-04** | Shoots List | 🟢 85% | [SCR-04](./screens/SCR-04-shoots-list.md) |
| **SCR-06** | Shoot Wizard | 🟢 80% | [SCR-06](./screens/SCR-06-shoot-wizard.md) |
| **SCR-10** | Channel Preview | 🟢 90% | [SCR-10](./screens/SCR-10-channel-preview.md) |
| **SCR-11** | Onboarding | 🟢 90% | [SCR-11](./screens/SCR-11-onboarding.md) |
| — | CRM tables · RLS · `talent.*` booking · FSM RPCs · notifications RPCs · `transition_booking` | 🟢 BE | [supabase-plan](../plan/data/supabase-plan.md) |

---

### Phase 2 — Shared atoms (P0)

| Step | ID | Task | Track | Pri | Status | Spec |
|:--:|:---|:---|:---|:--:|:--:|---|
| **1** | **RF-01** | StatusChip + CRM status tokens | Refactor | P0 | 🔴 | [RF-01](./refactor/RF-01-status-chip.md) |
| **1b** | **RF-A7b** | EmptyState + ErrorState | Refactor | P0 | 🔴 | [RF-A7b](./refactor/RF-A7b-empty-error-state.md) |
| **2** | **RF-02** | EntityList template | Refactor | P0 | 🔴 | [RF-02](./refactor/RF-02-entity-list.md) |

---

### Phase 5 — CRM UI (backend ✅ — highest ROI)

| Step | ID | Task | Track | Pri | Status | Deps | Spec |
|:--:|:---|:---|:---|:--:|:--:|---|---|
| **3** | **RF-03** | CRM Companies + Contacts **lists** | Refactor | P1 | 🔴 | 1–2 | [RF-03](./refactor/RF-03-crm-list-screens.md) · [IPI-388](https://linear.app/amo100/issue/IPI-388) |
| 3 | **SCR-26** | CRM Companies list | Screen | P1 | 🟡 stub | RF-03 | [SCR-26](./screens/SCR-26-crm-companies.md) · [IPI-389](https://linear.app/amo100/issue/IPI-389) |
| 3 | **SCR-28** | CRM Contacts list | Screen | P1 | 🟡 stub | RF-03 | [SCR-28](./screens/SCR-28-crm-contacts.md) · [IPI-390](https://linear.app/amo100/issue/IPI-390) |
| **4a** | **RF-04a** | CRM Company detail | Refactor | P1 | 🔴 | 3 | [RF-04a](./refactor/RF-04a-crm-company-detail.md) · [IPI-391](https://linear.app/amo100/issue/IPI-391) |
| 4a | **SCR-27** | CRM Company detail | Screen | P1 | 🟡 stub | RF-04a | [SCR-27](./screens/SCR-27-crm-company-detail.md) · [IPI-393](https://linear.app/amo100/issue/IPI-393) |
| **4b** | **RF-04b** | Contact detail + Profile360 extract | Refactor | P1 | 🔴 | 4a | [RF-04b](./refactor/RF-04b-profile360-extract.md) · [IPI-392](https://linear.app/amo100/issue/IPI-392) |
| 4b | **SCR-29** | CRM Contact detail | Screen | P1 | 🟡 stub | RF-04b | [SCR-29](./screens/SCR-29-crm-contact-detail.md) · [IPI-394](https://linear.app/amo100/issue/IPI-394) |
| 4b | **SCR-30** | CRM Pipeline kanban | Screen | P1 | 🟡 stub | RF-04b | [SCR-30](./screens/SCR-30-crm-pipeline.md) · [IPI-395](https://linear.app/amo100/issue/IPI-395) |
| 4b | **SCR-31** | CRM Deal detail | Screen | P1 | 🟡 stub | RF-04b | [SCR-31](./screens/SCR-31-crm-deal-detail.md) · [IPI-396](https://linear.app/amo100/issue/IPI-396) |
| *rule* | **RF-05** | Token cleanup (same PR as consumer) | Refactor | P2 | rule | touch | [RF-05](./refactor/RF-05-token-touch-as-you-go.md) |

---

### Phase 4 — Core operator gaps

| Step | ID | Task | Track | Pri | Status | Deps | Spec |
|:--:|:---|:---|:---|:--:|:--:|---|---|
| **5** | **SCR-05** | Shoot Detail 6 tabs (IPI-371) | Screen | P1 | 🟡 40% | CRM optional | [SCR-05](./screens/SCR-05-shoot-detail.md) · [IPI-371](https://linear.app/amo100/issue/IPI-371) |
| **6** | **SCR-08** | Assets read-only masonry | Screen | P2 | 🔴 5% | RF-01 | [SCR-08](./screens/SCR-08-assets.md) · [IPI-404](https://linear.app/amo100/issue/IPI-404) |
| **7** | **SCR-09** | Matching tabs + Casting Review | Screen | P2 | 🟡 60% | RF-02 | [SCR-09](./screens/SCR-09-matching.md) · [IPI-405](https://linear.app/amo100/issue/IPI-405) |
| **8** | **SCR-15** | Notifications inbox | Screen | P2 | ⚪ 0% | — | [SCR-15](./screens/SCR-15-notifications.md) · [IPI-407](https://linear.app/amo100/issue/IPI-407) |

---

### Phase 7 — Booking (agent + UI)

| Step | ID | Task | Track | Pri | Status | Deps | Spec |
|:--:|:---|:---|:---|:--:|:--:|---|---|
| **9** | **BE-B0b** | Booking Mastra agent (draft-only) | Backend | P2 | 🔴 | SCR-08 | [BE-B0b](./backend/BE-B0b-booking-mastra-agent.md) · [IPI-397](https://linear.app/amo100/issue/IPI-397) |
| **10** | **SCR-20** | Talent Profile | Screen | P2 | ⚪ | RF-04b | [SCR-20](./screens/SCR-20-talent-profile.md) · [IPI-409](https://linear.app/amo100/issue/IPI-409) |
| **11** | **SCR-21** | Booking Wizard | Screen | P2 | ⚪ | B0b | [SCR-21](./screens/SCR-21-booking-wizard.md) · [IPI-410](https://linear.app/amo100/issue/IPI-410) |
| **12** | **SCR-22** | Booking Detail | Screen | P2 | ⚪ | B0b | [SCR-22](./screens/SCR-22-booking-detail.md) · [IPI-411](https://linear.app/amo100/issue/IPI-411) |

---

### Phase 6 — Campaigns + analytics

| Step | ID | Task | Track | Pri | Status | Deps | Spec |
|:--:|:---|:---|:---|:--:|:--:|---|---|
| **13** | **BE-D1** | Campaigns schema (IPI-268) | Backend | P2 | 🔴 | — | [BE-D1](./backend/BE-D1-campaigns-schema-IPI-268.md) · [IPI-268](https://linear.app/amo100/issue/IPI-268) |
| **14** | **SCR-07** | Campaigns UI | Screen | P2 | 🔴 5% | D1 | [SCR-07](./screens/SCR-07-campaigns.md) · [IPI-249](https://linear.app/amo100/issue/IPI-249) |
| **15** | **BE-D2** | Analytics views + RPCs | Backend | P3 | ⚪ | D1 | [BE-D2](./backend/BE-D2-analytics-views-rpcs.md) · [IPI-399](https://linear.app/amo100/issue/IPI-399) |
| **16** | **SCR-16** | Analytics dashboard | Screen | P3 | ⚪ | D2 | [SCR-16](./screens/SCR-16-analytics.md) · [IPI-296](https://linear.app/amo100/issue/IPI-296) |
| **17** | **SCR-17** | Campaign Performance | Screen | P3 | ⚪ | D2 | [SCR-17](./screens/SCR-17-campaign-performance.md) · [IPI-297](https://linear.app/amo100/issue/IPI-297) |

---

### Phase 8 — Backend wiring (parallel when unblocked)

| Step | ID | Task | Track | Pri | Status | Unblocks | Spec |
|:--:|:---|:---|:---|:--:|:--:|---|---|
| ∥6 | **BE-ST1** | Storage buckets | Backend | P2 | ⚪ | SCR-08 upload | [BE-ST1](./backend/BE-ST1-storage-buckets.md) · [IPI-400](https://linear.app/amo100/issue/IPI-400) |
| ∥8 | **BE-RT1** | Realtime: notifications + bookings | Backend | P3 | ⚪ | SCR-15 · SCR-22 live | [BE-RT1](./backend/BE-RT1-realtime-notifications-bookings.md) · [IPI-401](https://linear.app/amo100/issue/IPI-401) |
| ∥12 | **BE-B4** | `set_availability_batch` RPC | Backend | P3 | ⚪ | SCR-23 | [BE-B4](./backend/BE-B4-set-availability-batch.md) · [IPI-402](https://linear.app/amo100/issue/IPI-402) |
| ∥4 | **BE-CRM-OPT** | CRM convenience RPCs | Backend | P3 | ⚪ | SCR Quick-Add | [BE-CRM-OPT](./backend/BE-CRM-opt-convenience-rpcs.md) · [IPI-403](https://linear.app/amo100/issue/IPI-403) |

---

### Phase 7b — Booking / talent remainder

| Step | ID | Task | Track | Pri | Status | Deps | Spec |
|:--:|:---|:---|:---|:--:|:--:|---|---|
| **18** | **SCR-23** | Availability editor | Screen | P3 | ⚪ | B4 | [SCR-23](./screens/SCR-23-availability.md) · [IPI-413](https://linear.app/amo100/issue/IPI-413) |
| **19** | **SCR-24** | Talent onboarding | Screen | P3 | ⚪ | — | [SCR-24](./screens/SCR-24-talent-onboarding.md) · [IPI-412](https://linear.app/amo100/issue/IPI-412) |
| **20** | **SCR-25** | Role dashboards | Screen | P3 | ⚪ | — | [SCR-25](./screens/SCR-25-role-dashboards.md) · [IPI-414](https://linear.app/amo100/issue/IPI-414) |
| **21** | **BE-ACT1** | Org activity log + `list_org_activity` RPC | Backend | P3 | ⚪ | — | [BE-ACT1](./backend/BE-ACT1-org-activity-log.md) · [IPI-398](https://linear.app/amo100/issue/IPI-398) |
| **22** | **SCR-18** | Collaboration / activity | Screen | P3 | ⚪ | ACT1 | [SCR-18](./screens/SCR-18-collaboration.md) · [IPI-408](https://linear.app/amo100/issue/IPI-408) |

---

### Phase 10 — Mobile (gate: steps 3–8 done)

**SSOT:** [`../docs/Mobile/MOBILE-PLAN.md`](../docs/Mobile/MOBILE-PLAN.md) · Index: [`mobile/README.md`](./mobile/README.md)  
Replaces canceled Linear IPI-251 / IPI-298–301 · breakpoint `<1024px`

| Step | ID | Task | Track | Pri | Status | Deps | Spec |
|:--:|:---|:---|:---|:--:|:--:|---|---|
| **23** | **MOB-01** | BottomSheet primitive (3 detents, focus-trap) | Mobile | P3 | ⚪ | desktop parity | [MOB-01](./mobile/MOB-01-bottom-sheet-primitive.md) · [IPI-417](https://linear.app/amo100/issue/IPI-417) |
| **24** | **MOB-02** | BottomNavigation + TopAppBar + More sheet | Mobile | P3 | ⚪ | MOB-01 | [MOB-02](./mobile/MOB-02-bottom-navigation-shell.md) · [IPI-416](https://linear.app/amo100/issue/IPI-416) |
| **25** | **MOB-03** | Composer primitive (persistent dock) | Mobile | P3 | ⚪ | MOB-02 | [MOB-03](./mobile/MOB-03-composer-primitive.md) · [IPI-418](https://linear.app/amo100/issue/IPI-418) |
| **26** | **MOB-04** | OperatorShell `<1024px` integration | Mobile | P3 | ⚪ | MOB-03 | [MOB-04](./mobile/MOB-04-operator-shell-integration.md) · [IPI-415](https://linear.app/amo100/issue/IPI-415) |
| **27** | **MOB-10** | MVP operator screens (SCR-01/02/03/04/08/11) | Mobile | P3 | ⚪ | MOB-04 | [MOB-10](./mobile/MOB-10-mvp-operator-screens.md) · [IPI-419](https://linear.app/amo100/issue/IPI-419) |
| **28** | **MOB-20** | Phase 2: Wizard, Campaigns, Matching | Mobile | P3 | ⚪ | MOB-10 | [MOB-20](./mobile/MOB-20-phase2-flows.md) · [IPI-420](https://linear.app/amo100/issue/IPI-420) |
| **29** | **MOB-31** | Selection gestures + mobile a11y | Mobile | P3 | ⚪ | MOB-01 | [MOB-31](./mobile/MOB-31-selection-gestures-a11y.md) · [IPI-421](https://linear.app/amo100/issue/IPI-421) |
| **30** | **MOB-90** | Verification @390·430·768·1024 | Mobile | P3 | ⚪ | MOB-20/31 | [MOB-90](./mobile/MOB-90-verification-pass.md) · [IPI-424](https://linear.app/amo100/issue/IPI-424) |
| ∥28 | **MOB-30** | Channel Preview carousel | Mobile | P4 | ⚪ | SCR-10 | [MOB-30](./mobile/MOB-30-channel-preview-mobile.md) · [IPI-422](https://linear.app/amo100/issue/IPI-422) |
| ∥28 | **MOB-32** | Tablet 768–1024 verify + 2-pane decision | Mobile | P4 | ⚪ | MOB-04 | [MOB-32](./mobile/MOB-32-tablet-breakpoints.md) · [IPI-423](https://linear.app/amo100/issue/IPI-423) |
| **31** | **MOB-40** | Booking set mobile (7 SCRs) | Mobile | P3 | ⚪ | SCR-20–22 | [MOB-40](./mobile/MOB-40-booking-set-mobile.md) · [IPI-425](https://linear.app/amo100/issue/IPI-425) |

---

### Deferred — no task file / no trigger

| ID | Task | Why deferred | Spec |
|:---|:---|---|---|
| **RF-A1** | WizardShell + shoot/booking flow configs | 801-line blast radius | [RF-A1](./refactor/RF-A1-wizard-shell-split.md) |
| **RF-A1b** | DetailShell + booking flow config | After SCR-05 stable | [RF-A1b](./refactor/RF-A1b-detail-shell.md) |
| **RF-A3** | Icon standardization (emoji → lucide) | Cosmetic | [RF-A3](./refactor/RF-A3-icon-cleanup.md) |
| **RF-A6** | Analytics / KPI kit | No analytics route yet | [RF-A6](./refactor/RF-A6-kpi-kit.md) |
| **RF-A9** | Matching.v2 vs SCR-09 registry doc | Docs-only | [RF-A9](./refactor/RF-A9-matching-registry.md) |
| **RF-OPT** | ShootCard → StatusChip migration | After RF-01 | [RF-OPT](./refactor/RF-OPT-shootcard-statuschip.md) · [IPI-406](https://linear.app/amo100/issue/IPI-406) |
| SCR-12 | Product Catalog | No route / no spec | — |
| SCR-13 | Collections | No route / no spec | — |
| SCR-14 | Asset→PDP | No route / no spec | — |
| SCR-19 | Event Management | No route / no spec | — |

*(SCR-12–14, 19 listed above — no task files.)*

**Already done in React (reference):** A2 AppShell (`OperatorPanel`/`NavSidebar`) · A8 `tokens.css`

---

## Current focus

| Next steps | Status |
|---|---|
| **Step 1** [RF-01 StatusChip](./refactor/RF-01-status-chip.md) · [IPI-385](https://linear.app/amo100/issue/IPI-385) | 🔴 |
| **Step 1b** [RF-A7b EmptyState/ErrorState](./refactor/RF-A7b-empty-error-state.md) · [IPI-386](https://linear.app/amo100/issue/IPI-386) | 🔴 |
| **Step 2** [RF-02 EntityList](./refactor/RF-02-entity-list.md) · [IPI-387](https://linear.app/amo100/issue/IPI-387) | 🔴 |
| **Step 3** RF-03 + SCR-26/28 CRM lists | 🔴 after 1–2 |

> **Correction:** `transition_booking`, `search_talent`, `toggle_shortlist_item`, `talent.bookings` are **live on remote**. Booking UI blocked on **B0b agent** (step 9) + React routes.

---

## Task inventory

| Track | Active | Deferred | Total specs | Index |
|---|---:|---:|---:|---|
| **Refactor** ([`refactor/`](./refactor/)) | 7 | 6 | **13** | Steps 1–4, RF-05 |
| **Screens** ([`screens/`](./screens/)) | 27 | — | **27** | Steps 3–22, shipped |
| **Backend** ([`backend/`](./backend/)) | 8 | — | **8** | Steps 9, 13–15, 21, ∥ |
| **Mobile** ([`mobile/`](./mobile/)) | 11 | — | **11** | Steps 23–31 |
| **Meta** | — | — | 5 | README · MATRIX · checklists · wireframes · diagrams |
| **Grand total** | **53** | **6** | **59** | |

Deferred SCRs (no task file): SCR-12 Product Catalog · SCR-13 Collections · SCR-14 Asset→PDP · SCR-19 Event Management

---

## Rollup

| Metric | Value |
|--------|-------|
| DC screens (SCR IDs) | **31** (27 with task files) |
| Operator-core REAL | **8** — SCR-01–04, 06, 10–11 |
| Overall implementation | **~38 / 100** |
| Supabase backend | **~62 / 100** ([audit](../plan/data/supabase-plan.md)) |
| Next milestone | Steps 1–4b → CRM UI live (6 screens) |

---

## Implementation readiness

| Dimension | Score |
|---|:--:|
| Design spec | 95 |
| Platform (shell/AI) | 82 |
| Supabase backend | 62 |
| Operator-core screens | 72 |
| CRM (UI) | 25 |
| Booking (UI + agent) | 15 |
| Analytics / Notifications | 3 |
| Mobile | 10 |
| **Overall implementation** | **~38** |

---

## Skills per track

| Track | Skills |
|---|---|
| Screens | `design-to-production` · `ipix-wireframe` · `mermaid-diagrams` · `frontend-design` · `task-verifier` |
| Refactor | `refactor-plan` · `design-to-production` · `nextjs-developer` |
| Backend | `ipix-supabase` · Supabase MCP |
| Booking agent | `mastra` · `copilotkit` · `gemini` |
| Assets | `cloudinary` · `ipix-supabase` |
| Mobile | `design-to-production` · `frontend-design` · `accessibility` · `COMPOSER-PRIMITIVE.spec.md` |

---

## Deep dives

| Topic | Doc |
|-------|-----|
| Master backlog + graphs | [`README.md`](./README.md) |
| Implementation tracker (this file) | [`todo.md`](./todo.md) |
| Backend tasks | [`./`](./) (BE-*.md) |
| Refactor tasks | [`refactor/`](./refactor/) |
| Screen tasks | [`screens/`](./screens/) |
| Screen wireframes (ASCII) | [`screens/wireframes/`](./screens/wireframes/) |
| Screen diagrams (Mermaid) | [`screens/diagrams/`](./screens/diagrams/) |
| Mobile tasks | [`mobile/`](./mobile/) |
| Screen matrix | [`screens/MATRIX.md`](./screens/MATRIX.md) |
| PR checklists | [`checklists.md`](./checklists.md) |
| Design → React discipline | [`../plan/designtoreact.md`](docs/designtoreact.md) |
| Supabase live audit | [`../plan/data/supabase-plan.md`](../plan/data/supabase-plan.md) |
| Linear audit | [`../plan/audit/03-linear-audit.md`](../plan/audit/03-linear-audit.md) |
| Refactor audit | [`../plan/REFACTOR.md`](docs/REFACTOR.md) |
| Build sequence detail | [`../plan/refactor/build-order.md`](refactor/README.md) |
| DC HTML index | [`../HTML.md`](../HTML.md) · [`../Pages/`](../Pages/) |
