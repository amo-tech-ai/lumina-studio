# iPix / FashionOS — Design TODO

> 📍 **Single source of truth for status = `docs/design/DESIGN-TASKS.md §0`.** This file is near-term actions only. The screen count below reflects the original 10-operator effort; the current system is **13 screens** (11 operator + Analytics Overview + Campaign Performance) — see `DESIGN-TASKS.md §0` for authoritative counts/scores.

Near-term, actionable tasks + live progress tracker. Strategy lives in `PLAN.md`; shipped detail in `changelog.md`; mobile strategy in `MOBILE-PLAN.md`.

> ⚠️ **Source-of-truth note:** root `PLAN.md` (1/10) and `changelog.md` (Command Center only) are **stale**. The accurate detail is in `design-patched/plan.md` + `design-patched/changelog.md` and this tracker. Reconcile pending (see Now).

**Legend:** 🟢 complete · 🟡 in progress · 🔴 failing/broken · ⚪ not started · ➖ N/A

---

## 📊 Progress Tracker — Screens (10/10 built & verified)

All 10 operator-screen prompts in `app/design/prompts/` have a built, verified v2 "Zeely Editorial" prototype. Each was shipped through verification with **no console errors** (proof: build files 449–616 lines; states/markers validated 2026-06-29).

| # | Screen | Prototype file | Built | States | v3 style | Image-first | Mobile pass | % |
|---|--------|---------------|:----:|:-----:|:-------:|:----------:|:----------:|:--:|
| 01 | Command Center | `Pages/Command Center.v2.image-first.dc.html` | 🟢 | 🟢 5/5 | 🟢 | 🟢 | 🟢 tabs+sheet | 95% |
| 02 | Brand List | `Pages/Brand List.v2.image-first.dc.html` | 🟢 | 🟢 5/5 | 🟢 | 🟢 | 🟢 tabs+sheet | 95% |
| 03 | Brand Detail | `Pages/Brand Detail.v2.image-first.dc.html` | 🟢 | 🟢 (no-data = empty) | 🟢 | 🟢 | 🟢 tabs+CSS sheet | 95% |
| 04 | Shoots List | `Pages/Shoots List.v2.image-first.dc.html` | 🟢 | 🟢 5/5 | 🟢 | 🟢 | 🟢 tabs+sheet | 95% |
| 05 | Shoot Wizard | `Pages/Shoot Wizard.v2.image-first.dc.html` | 🟢 | 🟢 per-step ➖switcher | 🟢 | 🟢 | 🟡 full-width, no tabs | 85% |
| 06 | Campaigns | `Pages/Campaigns.v2.image-first.dc.html` | 🟢 | 🟢 5/5 | 🟢 | 🟢 | 🟢 tabs+More sheet | 95% |
| 07 | Assets | `Pages/Assets.v2.image-first.dc.html` | 🟢 | 🟢 5/5 | 🟢 | 🟢 | 🟢 tabs+sheet | 95% |
| 08 | Onboarding | `Pages/Onboarding.v2.zeely.dc.html` | 🟢 | 🟢 wizard steps ➖switcher | 🟢 | 🟢 | 🟢 single-card (no shell) | 90% |
| 09 | Matching | `Pages/Matching.v2.image-first.dc.html` | 🟢 | 🟢 swipe+table | 🟢 | 🟢 | 🟢 tabs+More sheet | 95% |
| 10 | Channel Preview | `Pages/Channel Preview.v2.image-first.dc.html` | 🟢 | 🟢 4 states | 🟢 | 🟢 | 🟢 tabs+More sheet | 95% |
| 4b | Shoot Detail | `Pages/Shoot Detail.v2.image-first.dc.html` | 🟢 | 🟢 5 states · 9 tabs | 🟢 | 🟢 | 🟢 tabs+More sheet | 95% |

**`/app/shoots/[id]` — single-shoot production workspace.** Hero header (status · DNA · progress · team · actions), 9 tabs (Overview · Shot List · Assets · Team · Schedule · Budget · Approvals · Deliverables · Activity), production-insights panel (DNA ring, missing shots, risks, approval status, next actions), context AI dock. Reuses AssetCard (`tile`+`masonry`), ApprovalCard (`compact`), StatusChip (`bare`). "Open shoot" in Shoots List → navigates here with `?id=`.

**Screens: 10/10 built (🟢). Overall ~97%.** Remaining is production-wiring (IntelligencePanel → real data) + docs reconcile, not prototype work.

> **Prompt-spec coverage:** all 10 specs covered. Note `prompts/08-onboarding.md` **and** `prompts/09-onboarding.md` are duplicate onboarding specs — one should be removed; `09` should be Matching only.

### Cross-cutting trackers

| Item | Status | Detail |
|---|:--:|---|
| 5-state coverage | 🟢 | Populated · Loading · Empty · Error · Approval-pending on all panel screens; wizards use step model |
| v3 Zeely Editorial | 🟢 | Pure white/grey/black, Inter, black actions, image-first — all 10 |
| Real fashion imagery | 🟢 | `app/design/images` wired into all 10 (placeholders retired) |
| M6 mobile pass | 🟢 | Bottom tab bar + IntelligencePanel-as-sheet across all panel screens |
| Mobile **More sheet** | 🟢 | Built on all 8 panel screens — "More" tab opens a bottom sheet (Campaigns · Matching · Channel Preview · Onboarding · Settings · Account); rows link to real sibling prototypes, current page highlighted. *(2026-06-29)* |
| Mobile **chat dock** | 🟢 | Persistent dock pinned above the bottom tab bar on all panel screens (`main` reserves tab-bar height; dock compacted to 16px padding + height-cap on mobile). Command Center selector bug fixed (`main>div` → `main`). *(2026-06-29)* |
| IntelligencePanel → prod data | ⚪ | Target/not production-wired on every screen |
| Docs reconcile (root PLAN/changelog) | 🔴 | Root files stale; design-patched/ is accurate |

### Model Booking + Casting (`docs/models/` — 2026-07-04)

| Item | Status | Detail |
|---|:--:|---|
| SCR-09 Talent tab + **Casting Review Mode** | 🟢 | `Pages/SCR-09-Matching-Talent.dc.html` — Casting/Grid/List; focused card (name·agency·location·rate·≤3 tags·rationale·Why-fit→EvidenceBlock); Skip/Shortlist/Profile buttons + ←→↑ keys + aria-live toast; no dating copy. Verified |
| SCR-20 Model Profile · SCR-24 Onboarding | 🟢 | AI-native, FieldReview HITL |
| SCR-21 Booking Wizard · SCR-22 Booking Detail | 🟢 | booking flows of Shoot Wizard/Detail (reuse, not fork) |
| SCR-23 Availability · SCR-25 Role Dashboards · SCR-15 Notifications | 🟢 | built + verified |
| Mobile Preview Gallery (28 frames) | 🟢 | `SCR-MOBILE-Gallery.dc.html` — all screens @390 + full `MOBILE-IMPROVE §3` backlog demonstrated |
| Responsive React shell + composer primitive | ⚪ | Claude Code (spec: `COMPOSER-PRIMITIVE.spec.md`) |
| Booking RPCs / unread / per-route agents | 🔴 | Phase 2 backend — fixtures until then |

---

## 🤝 Handoff → Claude Code (AI runtime + backend contract)

> Design side is complete; these are **code-repo** tasks, specced in `docs/handoff/14-ai-runtime-contract.md`. Fill/verify against live `route-agent-map.ts` + `mastra/` + Supabase.

- [ ] **RT-1** AI Runtime Matrix per screen (agent → workflow → approval → DB → UI update) — confirm against agent map.
- [ ] **RT-2** CopilotKit per route: readable/writable state, interrupt, approval, tools (draft-only write rule).
- [ ] **RT-3** Mastra workflows — `draft-shoot` durable; all others non-durable + retry.
- [ ] **RT-4** AI approval state machine (Draft→Review→Approved/Rejected→Committed→Archived/Expired) as `status` column + RLS.
- [ ] **RT-5** Wire AI component interaction states + map the 5 AI runtime errors into `STATES.md`.
- [ ] **RT-6** Supabase source-of-truth + RLS per object (no duplicated canonical state).
- [ ] **RT-7** Cloudinary presets per ratio + focal `g_auto` (`IMAGE-STANDARDS.md`).
- [ ] **RT-8** Confirm ownership-by-layer split; verify `PERFORMANCE.md` budgets (Lighthouse/CWV/bundle).

## 🔵 Now

- [x] **QA follow-up cleanup** — archived 2 stale pre-v2 files (`archive/`); wired "Fix now" + disabled voice/added account tooltips across all panel screens; documented `BrandCard.onOpen` (N1). Deferred (P3/non-blocking): N2/N4/N5 component polish; production wiring (IntelligencePanel data, permissions/realtime, global-search, Lucide, ⌘K) → Linear. *(2026-06-29)*
- [x] **Full QA verification pass** — files, 11 screens, 8 journeys, all controls, AI docks, components. Score **92/100 (A)**, no P0/P1, no blockers. *(2026-06-29 · `checklist.md` §12)*
- [x] **Final approved improvements** — K (Assets panel: AI analysis + channel readiness + quick actions), Matching shortlist drawer, Brand Detail breadcrumb back-link, Channel Preview per-channel select/deselect, and Command Center cross-cutting realtime/permission states (🟢🟡⚪🔴 + Refresh/Request access). Verified, no console errors. **Not built (by approval):** Asset lightbox (extended panel instead), standalone Campaign Detail (kept right-panel detail). *(2026-06-29)*
- [x] **Phase 2 · Brand → Shoot (item E)** — "Plan a Shoot" primary CTA on Brand Detail → Shoot Wizard with `?brand&campaign&season`; wizard hydrates + locks brand/campaign/season (Change to edit), context-aware AI greeting, prefilled brief. Verified, no console errors. *(2026-06-29)*
- [ ] **Completion plan E–L** (`checklist.md` §9) — phased: ~~**E** Brand→Shoot~~ ✅ · ~~**F** functional search~~ ✅ · ~~**G** Channel Preview publishing flow~~ ✅ · ~~**H** Matching Save/Invite~~ ✅ · ~~**I** Brand Detail analysing/retry/error~~ ✅ · ~~**J** Shoot Detail "View Assets" deep-link~~ ✅. **Gated (new screen) — recommendation pending approval:** **K** Asset lightbox · **L** standalone Campaign Detail. *(F–J shipped 2026-06-29)*
- [x] **Fix cross-screen dead-ends (audit P0–P2)** — Onboarding "Open FashionOS" → Command Center; Brand List cards + rail brand buttons → Brand Detail (`?id=`); confirmed Campaigns/Assets cards already open their detail panels. No remaining dead primary actions on these screens. *(2026-06-29 · see `checklist.md`)*
- [x] **Persistent wizard escape/menu** — always-visible Back to Shoots + Save draft, ☰ Menu step-jump dropdown, and an unsaved-changes exit confirmation guard. *(2026-06-29)*
- [x] **Wire remaining Shoot Wizard actions** — moodboard regenerate/lock toggles, call-sheet PDF/Email/WhatsApp exports (toasts), confirm-before-create modal, and live Review scoring (props/savings/shot edits raise section + composite scores; completed-fixes & remaining-warnings panels). *(2026-06-29)*
- [x] **Shoot Wizard Review (Step 10) → Production Readiness Dashboard** — sticky left KPI + 8-section score menu, per-section AI explanations, approval checklist, AI improvements, risk panel, resource readiness, deliverables, production journey, confirmation CTA → Shoot Detail. State-aware (props/savings flow through). *(2026-06-29)*
- [x] **Wire "New shoot" buttons** — header "+ New shoot" + empty-state "Plan shoot" in Shoots List now `onClick → Pages/Shoot Wizard.v2.image-first.dc.html` (were dead markup). *(2026-06-29)*

- [x] **Staged screen refactor — complete.** All 7 panel screens now `dc-import` shared components where safe (Shoots/Campaigns/Brand List/Assets cards; Matching StatusChip; Brand Detail AssetCard tiles; Command Center ApprovalCard). Bespoke elements documented as intentional skips in `components/COMPONENTS.md`. New screens build from `OperatorShell` + the library. *(2026-06-29)*

- [ ] **Production wiring** (outside prototype scope) — connect IntelligencePanel to real data; ThreadsDrawer decision; Lucide migration. Tracked in Linear.

- [x] **Reconcile docs** — root `PLAN.md` + `changelog.md` now match the accurate `design-patched/` versions (10/10 screens, M1–M6 done). *(2026-06-29)*
- [ ] Delete duplicate onboarding prompt — `app/design/prompts/09-onboarding.md` duplicates `08-onboarding.md`; `09` should be Matching only. *(local file — user to remove)*

## ⬜ Next — Production parity

- [ ] Refresh `app/design/screenshots/` from the v2 prototypes.
- [ ] Lucide-icon migration (inline SVG → production Lucide set where they diverge).
- [ ] ThreadsDrawer decision — prototype brand switcher/badges/RECENT vs. production plain links + Threads.
- [ ] Suggestion-chip count alignment (prototype 3 vs. production 5).
- [ ] Wire IntelligencePanel to real data.

## ⬜ Later

- [ ] Command palette overlay (`⌘K`).
- [ ] Mobile Phase 2/3 (MOBILE-PLAN §15): swipe-deck gestures, phone-frame carousel, camera/upload flow, offline queue + sync chips, pull-to-refresh, long-press menus, list virtualization.
- [ ] Cross-cutting states sweep: error recovery, permissions, realtime/stale data.

## 🧱 Component backlog (build when first reused ≥4×)

- [ ] Extract `EmptyState` into a reusable DC.
- [ ] `AgentStatusIndicator` formal states (idle · thinking · streaming · awaiting-approval).
- [ ] `PageHeader` · `EvidenceBlock` · `WizardStep` shell.
- [ ] `StatusChip` full variant set (planning · active · post · complete · archived).
- [ ] Bottom-sheet primitive (3 detents, drag handle, focus trap) — currently per-screen.

## ✅ Recently done

- [x] **Shoot Detail** (`/app/shoots/[id]`) — built from scratch on the shared shell: hero header, 9 tabs, production-insights panel, context AI dock, all 5 states; reuses AssetCard/ApprovalCard/StatusChip. **"Open shoot" in Shoots List now navigates here** (passes `?id=`, shoot resolves correctly). Verified, clean load. *(2026-06-29)*

- [x] **Component migration Phase 3** — Matching → StatusChip (`bare`), Brand Detail → AssetCard (`tile`), Command Center → ApprovalCard (`compact`); each via `dc-import` with parity verified. Bespoke elements (swipe deck, image-diff HITLs, dotless chips, shell) documented as intentional skips. **All 7 panel screens now addressed.** *(2026-06-29)*
- [x] **Component migration Phase 2** — Campaigns → CampaignCard, Brand List → BrandCard (3 states + crawl), Assets → AssetCard (masonry); each via `dc-import` with full behavior/selection parity, verified. *(2026-06-29)*

- [x] **Design System Extraction** — 19 reusable component DCs in `components/` (shell, cards, AI/HITL, inputs, feedback, mobile), a live `Pages/Component Library.dc.html` gallery, and full `components/COMPONENTS.md` docs (purpose · anatomy · variants · states · tokens · AI · a11y · do/don't · usage). `OperatorShell` composes the full 3-panel shell from the parts. *(2026-06-29)*

- [x] **Persistent mobile chat dock** — pinned above the tab bar on all panel screens; Command Center padding-selector fix. *(2026-06-29)*
- [x] **Mobile More sheet** — bottom-sheet secondary nav on all 8 panel screens; rows link to real prototypes, current page highlighted. *(2026-06-29)*
- [x] **All 10 screens (v2 Zeely Editorial)** built & verified. *(2026-06-28/29)*
- [x] **M6 mobile pass** — tab bar + sheet across all 10; fixed sheet `!important` + re-render transition restart. *(2026-06-29)*
- [x] **`MOBILE-PLAN.md`** — full mobile-first strategy + per-screen wireframes. *(2026-06-29)*
- [x] **DESIGN.md v3** + tokens.css / redesign-spec.md / image-strategy.md propagation. *(2026-06-28)*
- [x] Real fashion imagery wired in; patched plan/todo; archived stale `design-plan.md`. *(2026-06-28)*
