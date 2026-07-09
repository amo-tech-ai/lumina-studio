# Design Tasks — Improvements (Claude Design only)

> **Single list of every DESIGN task** needed for the approved improvements. Design = screens, components, states, flows, AI-UX, mobile, motion, accessibility, content. **Engineering/backend tasks live in `IMPLEMENTATION-TASKS.md`** (Supabase, Cloudinary impl, OAuth, Edge Fns, Mastra, APIs) — not here.
> Status: ✅ done · 🟡 partial · 🔴 to do · ⚪ future. Effort: S(≤1d) · M(2–4d) · L(1–2w).

---

## Design vs Development Ownership

> **Claude Design** owns DC prototypes, layouts, components, responsive rules, AI UX, states, **accessibility specs**, screenshots, and design verification — and marks a task ✅ when the spec + prototype make the intent clear. **Claude Code / Cursor** owns React/Next.js routes, Tailwind classes, Supabase, CopilotKit, Mastra agents, Gemini, Cloudinary, Playwright/axe/Lighthouse, and production verification.
>
> **Moved from design → development** (design portion is ✅ *specified*; implementation is a Claude Code task): **Analytics/Campaign Performance React build**; **MOBILE-002** (≥44px hit-area enforcement); **MOBILE-003** (long-press select + mobile action sheet); **MOBILE-004** (focus-trap, streaming `aria-live`, keyboard audit). DC prototypes only *specify* this production behavior — they do not implement it. See `MOBILE-PLAN.md §17` and `docs/handoff/13-react-mobile-verification.md`.
>
> ⚠️ **Parity scope:** this is the **design** project — it contains no `app/` React code. Any "React vs Design drift" / `app/` parity check must run **in the code repo** against the handoff specs, not here.

---

## 0. Progress Task Tracker — verified 2026-06-30

> 🟢 complete & verified · 🟡 in progress / partial · 🔴 failing/blocked · ⚪ not started. **Verified** = loaded clean in-preview this pass (console clean) with the named interaction probed live, unless marked *(doc only)*.

### Area scorecard (/100)
| Area | Score | Grade | Evidence |
|---|--:|:--:|---|
| Design System (tokens, shared components) | 88 | 🟢 | 20 shared components; EvidenceBlock + selectable/draggable cards now canonical & reused, no forks |
| Shared Components | 90 | 🟢 | EvidenceBlock reused on 7 screens; AssetCard/CampaignCard selection via props, not duplicated |
| Navigation & IA | 86 | 🟢 | rail + mobile tab/More sheet wired; deep links; breadcrumbs on detail screens |
| User Journeys | 82 | 🟢 | Onboarding→CC→Brand→Shoot→Assets→Channel publish all traversable |
| AI UX (explainability/HITL) | 84 | 🟢 | Explain→EvidenceBlock→Approve→re-score on Brand/Assets/Matching/Campaigns/Channel |
| Accessibility | 72 | 🟡 | toasts now `aria-live`; roles/labels present; focus-trap + streaming live-region + full keyboard audit specified for React (D-A11Y2/4) |
| Mobile | 82 | 🟢 | tab bar + panel-as-sheet on all panels; bulk-bar wrap fixed; toast live-regions; 44px/long-press/focus-trap specified for React |
| Design Consistency | 89 | 🟢 | Zeely Editorial v3 held; one palette, Inter, image-first across all screens |
| Documentation | 83 | 🟢 | 13+ design docs; AI-EXPLAINABILITY + PATTERNS#selection added; this tracker |
| Production Readiness (design) | 80 | 🟢 | prototypes interactive & verified; remaining = new screens + a11y/motion pass |

**Overall design completion ≈ 70%** · **Overall design readiness 82/100** · **Prototype readiness 88/100** · **Production-design readiness 80/100**.

### Screen-by-screen (existing 13)
| Screen | Build | EvidenceBlock | Selection/Drag | States | Mobile | Verified |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| Command Center (SCR-01) | 🟢 | n/a | n/a | 🟢 5 states | 🟢 | 🟢 |
| Brand List (SCR-02) | 🟢 | n/a | 🟢 bulk header (D-BL1) | 🟢 | 🟢 | 🟢 |
| Brand Detail (SCR-03) | 🟢 | 🟢 per-pillar | n/a | 🟢 + DNA history | 🟢 sheet | 🟢 |
| Shoots List (SCR-04) | 🟢 | n/a | n/a | 🟢 | 🟢 | 🟢 |
| Shoot Detail (SCR-05) | 🟢 | n/a | n/a | 🟢 tabs + edit | 🟢 | 🟢 |
| Shoot Wizard (SCR-06) | 🟢 | 🟢 readiness dash | n/a | 🟢 10 steps | 🟢 mobile pass (D-SW1) | 🟢 |
| Campaigns (SCR-07) | 🟢 | 🟢 health | 🟢 grid + drop dock | 🟢 5 states | 🟢 @390 | 🟢 |
| Assets (SCR-08) | 🟢 | 🟢 DNA match | 🟢 masonry + drop dock | 🟢 + upload | 🟢 | 🟢 |
| Matching (SCR-09) | 🟢 | 🟢 creator fit | 🟢 table bulk | 🟢 5 states | 🟢 @390 | 🟢 |
| Channel Preview (SCR-10) | 🟢 | 🟢 readiness | n/a | 🟢 + publish flow | 🟢 @390 | 🟢 |
| Onboarding (SCR-11) | 🟢 | n/a | n/a | 🟢 13 screens | 🟢 | 🟢 |
| Analytics Overview (SCR-16) | 🟢 | 🟢 per metric/insight | n/a | 🟢 5 states | 🟢 @390 | 🟢 |
| Campaign Performance (SCR-17) | 🟢 | 🟢 per campaign/metric | n/a | 🟢 5 states | 🟢 @390 | 🟢 |

### Per-screen completion % (D-DS19)
> **Design** = DC prototype (layout, states, mobile, reuse, verified). **React** = ported to `app/` component + wired to real data/agents. **QA** = React parity + a11y + responsive signed off. **Production** = shipped behind flag / live. Design owns the first column; the other three are Claude Code and are **0% by design at this stage** (no React written yet — see scope note in `handoff.md`).

| Screen | Design | React | QA | Production |
|---|:--:|:--:|:--:|:--:|
| Command Center (SCR-01) | 100% | 0% | 0% | 0% |
| Brand List (SCR-02) | 100% | 0% | 0% | 0% |
| Brand Detail (SCR-03) | 100% | 0% | 0% | 0% |
| Shoots List (SCR-04) | 100% | 0% | 0% | 0% |
| Shoot Detail (SCR-05) | 100% | 0% | 0% | 0% |
| Shoot Wizard (SCR-06) | 100% | 0% | 0% | 0% |
| Campaigns (SCR-07) | 100% | 0% | 0% | 0% |
| Assets (SCR-08) | 100% | 0% | 0% | 0% |
| Matching (SCR-09) | 100% | 0% | 0% | 0% |
| Channel Preview (SCR-10) | 100% | 0% | 0% | 0% |
| Onboarding (SCR-11) | 100% | 0% | 0% | 0% |
| Analytics Overview (SCR-16) | 100% | 0% | 0% | 0% |
| Campaign Performance (SCR-17) | 100% | 0% | 0% | 0% |
| **New screens (SCR-12/13/14/15/18)** | 0% | 0% | 0% | 0% |
| **Design avg (13 built)** | **100%** | 0% | 0% | 0% |

**Rule:** a screen is **Design-100%** only when build + all states + mobile @390 + reuse (OperatorShell/tokens/components) + a live verified pass are all ✅. Update React/QA/Production columns in the code repo, not here.

### What's missing / needs attention
| Item | Status | Note |
|---|:--:|---|
| D-AS3 — Assets rights/usage/release metadata | 🟢 | built + verified — Rights & usage section (release/license/territory/expiry + flag + history) |
| ANALYTICS-PLAN.md (planning only) | 🟢 | written — SCR-16/17, reuse-only. **Chart/KPI gate CLEARED** (D-DS6/9/11 locked) → SCR-16 can start |
| D-DS9 · D-DS11 — chart + KPI patterns | 🟢 | LOCKED 2026-07-01 in `PATTERNS.md` (types · tooltips · states · score charts · EvidenceBlock · do/don't) |
| Mobile re-verify of new modals + selection | 🟢 | Campaigns/Matching/Channel EvidenceBlock + bulk @390 verified 2026-07-01 (rail hidden · tab bar · 0 overflow · modals reflow) |
| D-A11Y2 live regions · D-A11Y4 keyboard for modals/sheets | 🔴 | a11y pass before production |
| New screens SCR-12..19 | 🔴/⚪ | Catalog(12) · Collections(13) · PDP(14) · Notifications(15) · Collaboration(18) · Events(19) · Role dashboards(25). Analytics(16)/Campaign-Perf(17) built. **Model booking folded into SCR-05/06** (D-MB·; Booking Wizard/Detail/Availability removed). Canonical IDs → `../handoff/SCREEN-REGISTRY.md` |

---

## Summary
| Group | To do (🔴) | Partial (🟡) | Done (✅) | Total |
|---|:--:|:--:|:--:|:--:|
| Design System | 2 | 2 | 2 | 6 |
| Navigation & IA | 1 | 1 | 2 | 4 |
| AI Experience (UX) | 3 | 1 | 2 | 6 |
| Screens — existing | 8 | 4 | 11 | 23 |
| Screens — new (design) | 8 | 0 | 0 | 8 |
| Mobile | 1 | 0 | 3 | 4 |
| Accessibility | 3 | 1 | 0 | 4 |
| Content / copy | 3 | 0 | 0 | 3 |
| Motion | 1 | 0 | 0 | 1 |
| **Total** | **30** | **9** | **20** | **59** |

**Design progress: ~34% done, 15% partial, 51% to do.** (The 51% is mostly *new screens to design* + a11y + content, not backend.)

### Workspace at a glance
| Category | Count |
|---|--:|
| Components (shared) | 20 |
| Existing screens | 11 |
| New screens (to design) | 8 |
| AI patterns | 10 |
| Mobile patterns | 4 |
| Accessibility standards | 7 |
| User journeys | 8 |
| Design docs | 13 |

### Screen IDs (cross-reference)
`SCR-01` Command Center (D-CC) · `SCR-02` Brand List (D-BL) · `SCR-03` Brand Detail (D-BD) · `SCR-04` Shoots List (D-SL) · `SCR-05` Shoot Detail (D-SD) · `SCR-06` Shoot Wizard (D-SW) · `SCR-07` Campaigns (D-CM) · `SCR-08` Assets (D-AS) · `SCR-09` Matching (D-MT) · `SCR-10` Channel Preview (D-CH) · `SCR-11` Onboarding (D-ON). New: `SCR-12` Catalog · `SCR-13` Collections · `SCR-14` PDP crops · `SCR-15` Notifications · `SCR-16` Analytics · `SCR-17` Campaign Performance · `SCR-18` Collaboration · `SCR-19` Events · `SCR-25` Role dashboards. **Canonical numbering owned by `../handoff/SCREEN-REGISTRY.md`** (incl. model-booking SCR-20–24) — reference it, do not renumber here.

### Task convention
Every task carries (in the linked screen spec): **User** (who benefits) · **Uses** (components) · **AI Agent** · **Done-when** (acceptance). Two worked examples:

> **D-BD1 · Per-pillar DNA explainability** — *Screen:* SCR-03 Brand Detail · *User:* Brand Manager, Marketing · *AI Agent:* Brand Intelligence · *Uses:* BrandCard, StatusChip, ApprovalCard, EvidenceBlock(new), AI dock · **Done when:** ✓ click a pillar → why-this-score ✓ evidence (source pages/images) shown ✓ AI fix suggestions ✓ mobile sheet works ✓ a11y verified.

> **D-AS1 · Upload flow** — *Screen:* SCR-08 Assets · *User:* Designer, Photographer, Marketing · *AI Agent:* Creative Director / Asset Intelligence · *Uses:* AssetCard, EmptyState, ChatDock, toast · **Done when:** ✓ Upload → AI analysis → progress → success → review states ✓ auto-DNA on complete ✓ failure → inline retry ✓ mobile ✓ a11y.

*(Per-screen User · Uses · Agent · Done-when for all tasks live in the screen specs — see `../handoff/02-screen-map.md` + `AI-UX.md`.)*

---

## 1. Design System
| ID | Task | Effort | Status |
|---|---|:--:|:--:|
| D-DS1 | Token reference complete (`DESIGN-TOKENS.md`) | — | ✅ |
| D-DS2 | StatusChip full variant set | — | ✅ |
| D-DS3 | Route inline empty-states through `EmptyState` component | S | 🟡 |
| D-DS4 | One `BottomSheet` primitive (3 detents · drag handle · focus trap) | M | ✅† |
| D-DS5 | **Selectable + draggable card variants** (for bulk + drag-to-target) | M | ✅ |
| D-DS6 | **Charting style** for dashboards/analytics (in `PATTERNS.md#charts` + `#kpi`) | M | ✅ |

## 2. Navigation & Information Architecture
| D-NAV1 | Mobile tab bar + More sheet wired | — | ✅ |
| D-NAV2 | Cross-screen + deep links (`?id/?shoot/?brand`) | — | ✅ |
| D-NAV3 | Breadcrumbs on all detail screens (currently Brand Detail only) | S | ✅ |
| D-NAV4 | **Global search + command palette + saved views (design)** | M | 🔴 |

## 3. AI Experience (UX design)
| D-AI1 | Contextual greetings (no generic) | — | ✅ |
| D-AI2 | Streaming step pattern | — | ✅ |
| D-AI3 | **Agentic "do it" action UI + HITL approval pattern** (design) | M | 🔴 |
| D-AI4 | **AI history/thread panel (design)** | M | 🔴 |
| D-AI5 | **Evidence drill-down UI** (score → source) — `EvidenceBlock` reused on Brand/Assets/Matching/Campaigns/Channel | S | ✅ |
| D-AI6 | **Confidence-gated automation UI** (auto-approve vs queue) | S | 🔴 |

## 4. Screens — existing (design refinements)
| ID | Screen | Task | Effort | Status |
|---|---|---|:--:|:--:|
| D-CC1 | Command Center | "Today" agenda + AI daily-digest layout | M | 🟡 |
| D-CC2 | Command Center (SCR-01) | replace the realtime SIMULATE labels with a clear **debug/dev-only indicator** (never expose simulation chrome to end users) | S | ✅ |
| D-BL1 | Brand List | sort + bulk-action bar + portfolio-health header | M | ✅ |
| D-BL2 | Brand List | first-run sample/seed brand state | S | 🔴 |
| D-BD1 | Brand Detail | per-pillar DNA explainability (why + fix + evidence) — `EvidenceBlock` | M | ✅ |
| D-BD2 | Brand Detail | DNA history/trend view | M | ✅ |
| D-SL1 | Shoots List | calendar/timeline + status-lane view | M | 🔴 |
| D-SD1 | Shoot Detail | flesh out Activity/Deliverables tabs | S | ✅ |
| D-SD2 | Shoot Detail | call-sheet export layout (PDF design) | S | ✅ |
| D-SD3 | Shoot Detail | shot-by-shot capture checklist → progress ring | M | 🔴 |
| D-SW1 | Shoot Wizard | **mobile chrome** (responsive shell + tab) | M | ✅ |
| D-SW2 | Shoot Wizard (SCR-06) | inline brief/shot editing **with AI suggestions, before/after, undo, and approval** | M | 🟡 |
| D-AS1 | Assets (SCR-08) | real **upload** flow: Upload → AI analysis → progress → success → review (auto-DNA; failure → retry) | M | ✅ |
| D-AS2 | Assets | bulk select/tag/approve bar | M | ✅ |
| D-AS3 | Assets | rights/releases + usage metadata in panel | S | 🔴 |
| D-CM1 | Campaigns | **standalone campaign workspace** (OperatorShell page) | L | 🔴 |
| D-CM2 | Campaigns | budget/ROI + content/post calendar layout | M | 🔴 |
| D-MT1 | Matching (SCR-09) | outreach-tracking UI: **timeline · conversation/replies · follow-ups · status** (sent→opened→replied→booked) | M | 🔴 |
| D-CH1 | Channel Preview | scheduling/queue UI + per-channel caption/crop variants | M | 🟡 |
| D-ON1 | Onboarding | fast-track path (URL→DNA→app, 3 steps) | S | 🔴 |
| D-ON2 | Onboarding | team-invite step | S | 🔴 |
| (✅ baseline screen designs for all 13 screens already exist — 11 operator + Analytics Overview + Campaign Performance) | | | — | ✅ |

## 5. Screens — NEW (to design from scratch)
| ID | Screen | Notes (reuse OperatorShell + cards + tokens) | Effort | Status |
|---|---|---|:--:|:--:|
| D-NS1 | **Product Catalog** (products/SKUs/variants) | image-first grid + detail | L | 🔴 |
| D-NS2 | **Collections / Seasons** planner | timeline/board | L | 🔴 |
| D-NS3 | **Asset → PDP image set** (spec crops) | crop preview per placement | M | 🔴 |
| D-NS4 | **Notification center** (inbox) | list + filters + read states | M | 🔴 |
| D-NS5 | **Analytics / performance dashboard** | KPI + charts (use D-DS6 style) | L | 🟢 SCR-16 built |
| D-NS6 | **Campaign performance drill-down** | bar-to-detail + per-campaign KPIs + EvidenceBlock | L | 🟢 SCR-17 built |
| D-NS6b | **Role dashboards** (exec · ops · marketing · designer · model · agency) | KPI views | L | 🔴 SCR-25 |
| D-NS7 | **Comments / activity / audit** UI (collaboration) | threads, @mentions, timeline | M | 🔴 |
| D-NS8 | **Event management** screens (runway/venue/backstage) | future domain | L | ⚪ |

### Model Booking (folded into Shoot lifecycle — 2026-07-03; see `../models/00-model-booking-plan.md` §0.0)
> Booking is **not** new screens. Extend **SCR-06 Shoot Wizard** + **SCR-05 Shoot Detail**. ~~Booking Wizard / Booking Detail / Availability editor~~ **removed** (folded). Driven by `production-planner` (booking agent dropped); `model-match` for discovery. Reuses Call Sheet / Schedule / Team / Approvals / Deliverables / Activity + Notification Center + `FieldReview` HITL.

| ID | Task | Type | Pri |
|---|---|:--:|:--:|
| D-MB1 | Shoot Wizard → **Talent** step (cast from shortlist) | extend | 🔴 P1 |
| D-MB2 | Shoot Wizard → **Availability** step (dates reconcile) | extend | 🔴 P1 |
| D-MB3 | Shoot Wizard → **Booking** step (rate/offer → FieldReview HITL) | extend | 🔴 P1 |
| D-MB4 | Shoot Wizard → **Contracts** step (MVP agreement) | extend | 🔴 P2 |
| D-MB5 | Shoot Detail → **Talent** tab | extend | 🔴 P1 |
| D-MB6 | Shoot Detail → **Bookings** tab (ApprovalCard-gated) | extend | 🔴 P1 |
| D-MB7 | Shoot Detail → **Contracts** tab | extend | 🔴 P2 |
| D-MB8 | Matching → **Talent** 4th tab + Shortlist “Send to shoot” | extend | 🔴 P1 |
| D-MB9 | Talent Profile (SCR-20) CTA → **“Add to shoot”** (retire standalone route) | edit | 🔴 P1 |
| D-MB10 | Notification Center → booking alert types | extend | 🔴 P2 |
| D-MB11 | Role Dashboards → talent-side booking view | new | 🔴 P3 |
| D-MB✓ | Talent Profile (SCR-20) + Talent Onboarding (SCR-24) | built | 🟡 |
| ~~D-NS13/14/15~~ | ~~Booking Wizard / Detail / Availability~~ | **removed — folded** | — |

## 6. Mobile
| D-MB1 | Tab bar + More sheet + chat dock | — | ✅ |
| D-MB2 | Panel-as-sheet | — | ✅ |
| D-MB3 | Mobile images/states | — | ✅ |
| D-MB4 | Shoot Wizard mobile chrome (= D-SW1) | M | ✅ |

## 7. Accessibility (design standard in `ACCESSIBILITY.md`)
| D-A11Y1 | Labels + focus-order audit (all screens) | M | 🟡 |
| D-A11Y2 | Live regions for AI streaming + toasts | S | 🔴 |
| D-A11Y3 | Contrast + ≥44px + reduced-motion verification | M | 🔴 |
| D-A11Y4 | Keyboard nav for drawers/modals/sheets | M | 🔴 |

## 8. Content / copy
| D-CT1 | Tighten AI messages to *object + finding + next action* (≤2 sentences) | S | 🔴 |
| D-CT2 | Action labels confirm target ("Add to…"); one-line error causes | S | 🔴 |
| D-CT3 | Tooltips on all icon-only buttons (extend voice/account pattern) | S | ✅ |

## 9. Motion
| D-MO1 | Apply `ANIMATIONS.md` rules consistently (sheets/modals/toasts/streaming/reduced-motion) | M | 🔴 |

---

## 10. Pattern libraries (new — design references)
| ID | Task | Doc | Effort | Status |
|---|---|---|:--:|:--:|
| D-DS7 | **Form patterns** (validation · errors · auto-save · AI-assist · confirmation · review) | `PATTERNS.md#forms` | M | 🔴 |
| D-DS8 | **Table patterns** (sort · filter · bulk · sticky cols · selection · mobile) | `PATTERNS.md#tables` | M | 🔴 |
| D-DS9 | **Chart patterns** (style · colours · spacing · legends · tooltips · empty/loading/error · types) | `PATTERNS.md#charts` | M | ✅ |
| D-DS10 | **Notification patterns** (toast · banner · modal · alert · AI message · system) | `PATTERNS.md#notifications` | M | 🔴 |

## 11. AI patterns (new)
| D-AI7 | AI **loading** patterns (thinking · streaming · skeleton) | `AI-UX.md` + `STATES.md` | S | 🔴 |
| D-AI8 | AI **error** patterns (drop · non-durable · Retry/Report/Go back) | `AI-UX.md` + `STATES.md` | S | 🔴 |
| D-AI9 | AI **confidence badges** (value + threshold colour + tooltip) | `AI-UX.md` | S | 🔴 |
| D-AI10 | AI **reasoning/explanation layouts** (evidence → conclusion) — standardised in `EvidenceBlock` + `AI-EXPLAINABILITY.md` | `AI-UX.md` | M | ✅ |

## 12. Accessibility (additional)
| D-A11Y5 | Colour-blind verification (status = dot + label everywhere) | S | 🔴 |
| D-A11Y6 | Screen-reader audit (labels, live regions, landmarks) | M | 🔴 |
| D-A11Y7 | Keyboard shortcuts (nav, search ⌘K, approve/reject) | M | 🔴 |

---

## 13. Feature Matrix (feature → screen → component → AI → mobile)
| Feature | Screen(s) | Key components | AI agent | Mobile |
|---|---|---|---|:--:|
| Brand DNA + explainability | SCR-02/03 | BrandCard, DNA pillars, EvidenceBlock* | Brand Intelligence | sheet |
| Plan-a-Shoot handoff | SCR-03→06 | PlanCTA, WizardStep | Production Planner | full |
| AI Shoot Planner + Readiness | SCR-06 | WizardStep, ChatDock, ApprovalCard | Production Planner | ✅ mobile pass |
| Shoot workspace (9 tabs) | SCR-05 | tabs, AssetCard, ApprovalCard | Production Planner | tabs |
| Asset library + upload + actions | SCR-08 | AssetCard, FilterBar, upload, toast | Creative/Asset Intelligence | grid/sheet |
| Campaign workspace | SCR-07 | CampaignCard, calendar, KPI | Creative Director | tabs |
| Creator matching + shortlist + outreach | SCR-09 | swipe/table, drawer, timeline | Social Discovery | tabs |
| Channel preview + publish + schedule | SCR-10 | phone frames, publish modal, queue | Visual Identity | sheet |
| Analytics + dashboards | SCR-16/17 · SCR-25 | KPI cards, charts | analytics-intelligence | scroll |
| Notifications + collaboration | SCR-15/18 | inbox, comments, activity | — | sheet |
| Catalog / PDP | SCR-12/14 | product cards, crop preview | Ecommerce Assistant | grid |

\*EvidenceBlock = new shared component (introduced by D-BD1, reused by D-AI10).

## 14. Additional task groups (reviewer adds)
**Design System** — `D-DS11` KPI patterns (`PATTERNS.md#kpi`) ✅ *(locked 2026-07-01)* · `D-DS12` workflow-timeline patterns · `D-DS13` comparison layouts (before/after, benchmark) · `D-DS14` version-history UI. *(DS12–14 M ·· 🔴)*
**AI** — `D-AI11` conversation history · `D-AI12` AI memory (accepted/rejected/modified recs) · `D-AI13` AI collaboration (designer→AI→manager→approval) · `D-AI14` alternative-suggestions UI. *(M · 🔴)*
**New screens** — `D-NS9` System Settings · `D-NS10` Organization · `D-NS11` Team Management. *(M–L · 🔴)*
**Workflows** — `D-WF1..7` per-workflow design checklists (see `WORKFLOWS.md`). *(M · 🔴)*

### Conventions added
- **Complexity** alongside effort: Low · Medium · High · Very High (e.g. D-CM1 = L / **High**; D-NS8 Events = L / **Very High** → Future).
- **Screen ownership** (primary user · secondary · AI agent) lives in each screen spec — summary in the Feature Matrix above + `../handoff/02-screen-map.md`.

### ⚠ Gates / sequencing
- **Analytics/Dashboards (SCR-16/17): chart+KPI standards SHIPPED (D-DS6/D-DS9/D-DS11 ✅, locked in `PATTERNS.md#charts/#kpi/#score/#tooltips` 2026-07-01) — SCR-16 is CLEARED to start** (reuse-only, no new components; see `ANALYTICS-PLAN.md`).
- **Events (D-NS8) → Future Phase**, not the active design backlog (very high complexity, separate domain).
- **Campaign workspace (D-CM1) → split** into D-CM1a Overview · D-CM1b Calendar · D-CM1c Budget · D-CM1d Deliverables · D-CM1e Publishing (don't design as one task).

---

## 15. Governance & maintenance (reviewer add — 2026-07-01)

> Raised in the 2026-07-01 audit review. These are **documentation-governance** tasks, not screen work — they raise long-term maintainability and de-risk the React port. **IDs D-DS15–D-DS24** (D-DS11–14 already taken in §14). Where a doc already exists, the task is **consolidate/formalize**, not create — the goal is to fight doc sprawl, not add to it.

| ID | Task | Home doc | Covered today? | Effort | Status |
|---|---|---|---|:--:|:--:|
| D-DS15 | **Design Token Governance** — naming rules, deprecation, versioning, migration process | `DESIGN-TOKENS.md` | ✅ **2026-07-01** — governance section added (naming pattern · add/change/deprecate rules · anti-patterns) | M | ✅ |
| D-DS16 | **Component lifecycle/versioning** — Stable · Experimental · Deprecated · Internal labels | `components/COMPONENTS.md` | ✅ **2026-07-01** — lifecycle table added (all 20 labelled; EvidenceBlock frozen; promote/deprecate rules) | S | ✅ |
| D-DS17 | **Component Dependency Matrix** — OperatorShell → children tree | `../handoff/03-component-map.md` | ✅ **2026-07-01** — tier matrix (depends-on · used-by count · blast radius · build order) added below the mermaid tree | S | ✅ |
| D-DS18 | **Design → React Mapping** — DC → React → route → owner → Linear → status | `../handoff/09-react-implementation-map.md` | ✅ **2026-07-01** — single mapping matrix added at top (13 screens + shared components; owner/Linear = Claude Code) | M | ✅ |
| D-DS19 | **Per-screen completion %** — Design / React / QA / Production columns | `DESIGN-TASKS.md §0` | ✅ **2026-07-01** — completion matrix added to §0 (Design 100% for 13 built; React/QA/Prod 0% by design) | S | ✅ |
| D-DS20 | **Image Standards** — hero, min size, ratios, crop, compression, Cloudinary transforms, fallback hierarchy | `IMAGE-STANDARDS.md` | ✅ **2026-07-01** — new `IMAGE-STANDARDS.md`: canonical ratios (grounded in built screens) · crop/focal · treatment · min-size · Cloudinary delivery · fallback chain · QA gate | M | ✅ |
| D-DS21 | **Motion System** — timings, hover, loading, page/sheet/modal transitions | `ANIMATIONS.md` | ✅ **consolidated 2026-07-01** (canonical spec; adoption = D-MO1) | S | ✅ |
| D-DS22 | **Error State Library** — loading · offline · timeout · permission · 404 · 500 · no-data · sync-failed · AI-failed | `STATES.md` (+ `PATTERNS.md#notifications`) | ✅ **consolidated 2026-07-01** (one catalog table, 9 states) | S | ✅ |
| D-DS23 | **Performance Budget** — images, CSS, fonts, LCP, CLS, INP, bundle | `PERFORMANCE.md` | ✅ **2026-07-01** — new `PERFORMANCE.md`: CWV targets, per-route asset budgets, design-guaranteed CLS/LCP rules, Claude Code verification list | M | ✅ |
| D-DS24 | **Master Design QA Checklist** — type · spacing · tokens · a11y · responsive · console · AI · EvidenceBlock · mobile/tablet/desktop | `DESIGN-QA.md` | ✅ **2026-07-01** — new `DESIGN-QA.md`: 11-section gate (type/color/components/states/AI/motion/mobile/tablet/a11y/console/sign-off) + Design-100% DoD | M | ✅ |

**Reviewer risk notes (accepted):** doc sprawl → mitigated by making each task *consolidate into an existing home* where one exists, and by `DESIGN-TASKS.md §0` remaining the single tracker (done).

**§15 governance status (2026-07-01): 10/10 complete.** D-DS15✅ D-DS16✅ D-DS17✅ D-DS18✅ D-DS19✅ D-DS20✅ D-DS21✅ D-DS22✅ D-DS23✅ D-DS24✅.

**AI-native runtime + backend contract → Claude Code (not design).** The 2026-07-01 review flagged AI runtime / CopilotKit / Mastra / Supabase / approval-state gaps. These are **runtime + backend**, owned by Claude Code per the separation-of-concerns rule — scaffolded (correct columns, grounded in the agent map) in **`../handoff/14-ai-runtime-contract.md`** as tasks **RT-1..8** for the code repo to fill/verify against live `route-agent-map.ts` + `mastra/` + Supabase. Design side of those (all UI states incl. AI interaction states, approval-card/EvidenceBlock surfaces, image + perf rules) is complete.

**Decisions recorded 2026-07-01:**
- **† D-DS4 BottomSheet:** the primitive is **built + documented** (`components/BottomSheet.dc.html` — 3 detents 38/62/90% · drag handle · backdrop · close; spec in `COMPONENTS.md#bottomsheet`). DC prototypes intentionally keep an **equivalent pure-CSS (checkbox-toggle) sheet** (functionally identical, avoids re-render restart); **React consolidates all sheets onto the one primitive + adds focus-trap** (MOBILE-004). Design portion ✅; adoption + focus-trap = Claude Code.
- **M3 Tablet 2-pane:** decided + specified in `MOBILE-PLAN.md §18` (portrait 768–834 = mobile-plus 2-col; landscape 835–1024 = collapsed rail + inline panel). DC stays mobile-style at this width; React implements the tablet band + verifies at 768/1024. Periodic React↔Design parity audits → belong in the **code repo** (see scope note in `handoff.md`).

## Recommended design order
1. **Quick wins:** D-DS3/D4, D-NAV3, D-CT1/2/3, D-A11Y1, D-SD1/2, D-BL1.
2. **Existing-screen depth:** D-BD1/2, D-AS1/2, D-CM1/2, D-MT1, D-SW1/2, D-SL1.
3. **AI UX:** D-AI3/4/5/6.
4. **New screens:** D-NS4 (notifications) → D-NS1/3 (catalog/PDP) → D-NS5/6 (dashboards) → D-NS7 (collaboration) → D-NS2 → D-NS8 (events, future).
5. **A11y + motion pass:** D-A11Y2/3/4, D-MO1, D-DS6 (charting) before dashboards.
6. **Governance (D-DS15–D-DS24):** after the mobile-consistency pass — start with the near-done consolidations (**D-DS21 motion**, **D-DS22 errors**, **D-DS17 dependency matrix**, **D-DS19 completion %**), then the net-new specs (**D-DS15 tokens**, **D-DS18 React map**, **D-DS20 images**, **D-DS23 perf**, **D-DS24 QA checklist**, **D-DS16 lifecycle**).

> Every new screen must reuse `OperatorShell` + shared components + tokens (no new colours/fonts, no duplicate components). Cross-ref: `DESIGN.md`, `DESIGN-TOKENS.md`, `AI-UX.md`, `ANIMATIONS.md`, `ACCESSIBILITY.md`, `../handoff/02-screen-map.md`, `../handoff/03-component-map.md`.
