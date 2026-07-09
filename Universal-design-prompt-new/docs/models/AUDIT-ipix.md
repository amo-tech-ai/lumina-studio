# iPix / FashionOS — Model Booking Audit

> Strict pre-implementation audit. Verifies **real links + journeys** (not just docs) across the booking + shoot system. Audit only — no code changed. Date 2026-07-03.
> Legend: 🟢 correct/complete · 🟡 needs improvement · 🔴 blocker · ⚪ n/a · not-started = grey.

---

## 0. Progress Task Tracker (Examine → Verify → Validate → Measure → Identify)

### 0.1 Plans reviewed (top of this doc, per request)

| Plan | % | Status | Proof / gap |
|---|--:|:--:|---|
| Model Profile plan (`SCR-20-Model-Profile.plan.md`) | 96 | 🟢 | 8 sections, mode config, EV-1..5, mobile/empty/loading — matches built SCR-20 |
| AI-Native Dashboard plan (`SCR-25-AI-Native…plan.md`) | 95 | 🟢 | §12–22 handoff, HITL-safe cards, status FSM, EV items; built in SCR-25 |
| Booking Wizard plan (`SCR-21-…plan.md`) | 100 | 🟢 | flow=booking of Shoot Wizard; 5 steps + FieldReview; built + verified |
| Booking Detail plan (`SCR-22-…plan.md`) | 100 | 🟢 | flow=booking of Shoot Detail; FLOWCFG; built + verified |
| Mobile plan (`MOBILE-PLAN.md` §19) | 90 | 🟡 | all 6 booking screens now spec'd; **spec only — mobile shell not built in DCs** |

### 0.2 Built prototypes (independently verified)

| Screen | % | Status | Proof |
|---|--:|:--:|---|
| SCR-09 Matching Talent tab | 100 | 🟢 | tabs·filters·cards·shortlist→Send; console clean |
| SCR-20 Talent/Model Profile | 100 | 🟢 | 8 tabs·AI panel·mode·dock pinned; console clean |
| SCR-24 Talent Onboarding | 100 | 🟢 | FieldReview gate·4 steps; → SCR-20 |
| SCR-06 Booking Wizard (flow) | 100 | 🟢 | 5 steps·FieldReview·send-gate; shoot flow intact |
| SCR-05 Booking Detail (flow) | 100 | 🟢 | status stepper·operator-only confirm·crew link |
| SCR-25 Role Dashboards | 100 | 🟢 | model·agency·offers HITL·3-panel+dock |
| SCR-15 Notification Center | 100 | 🟢 | bell·slide-over·filters·deep-links |
| SCR-23 Availability Editor | 0 | ⚪ | not built (read-only views exist in SCR-20/22) |

### 0.3 Backend (🔎 reported by engineering ref §2 — Phase 2)

| Item | Status |
|---|:--:|
| Talent/Availability/Bookings/Notifications schema · RLS · Auth · `model-match` | 🟢 shipped |
| `booking` agent · booking CRUD/transition/list RPCs · `/api/bookings/**` | 🔴 Phase 2 |
| `bookings.version` · `notification_reads` · Realtime | 🔴 Phase 2 |
| Contracts · Payments · pgvector | ⚪ deferred |

---

## 1. Scores

| Category | Score | Status |
|---|--:|:--:|
| Screen coverage | 96% | 🟢 |
| Navigation / links | 97% | 🟢 |
| User journeys | 92% | 🟢 |
| Feature completeness | 90% | 🟢 |
| AI / HITL | 95% | 🟢 |
| Mobile readiness | 82% | 🟡 |
| Documentation consistency | 88% | 🟡 |
| Production readiness (design) | 90% | 🟢 |
| Backend readiness | 55% | 🔴 Phase 2 |
| **Overall** | **91%** | 🟢 |

---

## 2. Link & journey verification (real, not docs)

**All cross-file links resolve to real files** (grep-verified):
- SCR-24 → `SCR-20-Talent-Profile.dc.html` ✅
- SCR-09 Send → `../../../Shoot Wizard…?flow=booking&talent=<id>` ✅
- SCR-20 Request booking → `../../../Shoot Wizard…?flow=booking` ✅
- SCR-25 Accept → `../../../Shoot Detail…?flow=booking&…status=approved` ✅ · Details → `…status=requested` ✅
- SCR-15 rows → Booking Detail (5 statuses) · SCR-09 · SCR-20 ✅
- Shoot Detail crew "Booked ▸" → `…?flow=booking&…status=confirmed` ✅

**Journeys:**
- **Model booking** (Matching→Profile→Wizard→Detail→Notifications→Dashboard) — 🟢 complete, all links live.
- **Shoot** (List→Wizard→Detail→Call Sheet→Assets→Approvals→Activity) — 🟢 built screens, tabs + modal present.
- **Talent/Agency** (Dashboard→offer→Accept/Decline→Detail→Notifications→Availability) — 🟡 Availability leg is a dead button (§3 I-2).
- **AI** (panel proactive → dock greeting → action card → EvidenceBlock) — 🟢 on SCR-20/25; 🟡 dock present but panel not AI-native on SCR-09/15.

---

## 3. Issues found

| # | Screen/file | Issue | Sev | Expected | Actual | Fix | Pri | Owner |
|---|---|---|:--:|---|---|---|:--:|---|
| I-1 | SCR-20 · SCR-25 | `talent` hardcoded to `runwithkara` on nav-out | 🟡 | book/route the *selected* talent | always books runwithkara | thread selected id into onBook/offer href | P2 | Claude Design |
| I-2 | SCR-25 · SCR-20(model) | "Edit availability" / self-view cards have no destination | 🟡 | open availability editor (SCR-23) | dead button | placeholder+TODO or build SCR-23 | P2 | Design |
| I-3 | SCR-25 | every offer routes `talent=runwithkara` (On Running→kara) | 🟡 | per-offer talent | fidelity slip | map offer→talent id | P3 | Design |
| I-4 | `00-plan.md` §0.0/§4/§22 | fold-in + `/onboarding/talent` text is historical, still present | 🟡 | clearly superseded | could confuse Code | already behind §0.-1 banner; add inline "historical" | P2 | Design |
| I-5 | `01-engineering-handoff.md` | superseded on facts, still long | 🟡 | archived/short | full doc remains | mark archived at top | P3 | Design |
| I-6 | MOBILE-PLAN §19 | mobile shell **spec only**, not built in DCs | 🟡 | responsive DCs or clear Code-owned | desktop-only prototypes | Code responsive build (matches original 13) | P2 | Claude Code |
| I-7 | SCR-15/09 | IntelligencePanel not present (dock only) | ⚪ | optional per screen | by design (list screens) | none — acceptable | — | — |

**No blockers (🔴) in the design layer.** No broken links, no orphan built screens, no duplicate workflows.

---

## 4. Required-output lists

- **Broken links:** none.
- **Orphan screens:** none built; SCR-23 planned-not-built (⚪).
- **Missing features:** SCR-23 Availability editor; per-talent routing (I-1/I-3); mobile shell build (I-6).
- **Duplicate workflows:** none — booking correctly folds into shoot via `flow`.
- **Stale docs:** plan §0.0/§22 + 01-handoff (historical; superseded, flagged).
- **AI agents:** `model-match` 🟢 built · `booking` 🔴 designed · `production-planner` owns shoots. Correct per engineering ref (no duplicate agent).
- **HITL:** preserved everywhere — AI drafts/explains; accept (talent) + confirm (operator) are human; no auto-actions.
- **Backend/RPC:** clearly Phase 2 (🔴) in registry + plans + engineering ref.

## 5. Critical fixes (before Code)
1. Thread **selected talent id** through Profile/Dashboard nav-outs (I-1, I-3) — else every route books runwithkara.
2. Resolve **dead "Edit availability"** CTA — placeholder+TODO or build SCR-23 (I-2).
3. Add inline **"historical/superseded"** markers on plan §0.0/§22 + 01-handoff so Code doesn't follow the fold-in/`/onboarding/talent` (I-4/I-5).

## 6. Suggested improvements
- Build SCR-23 Availability editor (completes the talent self-service leg).
- Make SCR-09/15 optionally AI-native (panel) for consistency — low priority.
- One reference **mobile** DC build to prove §19 (like Command Center was for the original set).

## 7. Recommended implementation order (Code)
1. Supabase verify (EV-1..5) → booking RPCs (`create/transition/get/list_bookings`) + `/api/bookings/**`.
2. Register `booking` agent (Mastra) + CopilotKit dock wiring.
3. Port screens on the shared shell (Talent tab → Profile → Wizard flow → Detail flow → Dashboards → Notifications).
4. Mobile responsive build (§19) + verify at 390·430·768·1024.
5. Realtime (Phase 2b) + notification_reads + optimistic `version`.

---

## 8. Final answer

**Is the model booking + shoot system ready for Claude Code implementation?**

**🟢 Yes, after fixes.** The design is complete, links resolve, journeys connect, HITL holds, and backend is correctly scoped as Phase 2. Before implementation, close the 3 critical fixes (§5): per-talent routing, the dead availability CTA, and the historical-doc markers. Everything else is Phase-2 backend (Code-owned) or optional polish.

**Percent correct: 91%.**

---

## 9. Matrices (added per review)

### 9.1 Workflow ownership
| Workflow | Owner | Writes? |
|---|---|:--:|
| Matching / talent ranking | `model-match` 🟢 | shortlists (draft) |
| Booking (request→quote→approve) | `booking` 🔴 | bookings (draft; confirm=operator) |
| Shoot planning/execution | `production-planner` 🟢 | shoots |
| Notifications fan-out | notification **service** (future) | notifications |
| Dashboard summary | `booking` (role-scoped) 🔴 | — (read) |

### 9.2 Screen completion
| Screen | Design | React | Backend | QA |
|---|:--:|:--:|:--:|:--:|
| SCR-09 Talent tab | 🟢 | 🔴 | 🟢 | 🟡 |
| SCR-20 Profile | 🟢 | 🔴 | 🟡 | 🟡 |
| SCR-06 Booking Wizard | 🟢 | 🔴 | 🔴 | 🟡 |
| SCR-05 Booking Detail | 🟢 | 🔴 | 🔴 | 🟡 |
| SCR-25 Role Dashboards | 🟢 | 🔴 | 🔴 | 🟡 |
| SCR-15 Notifications | 🟢 | 🔴 | 🟡 | 🟡 |
| SCR-23 Availability | ⚪ | 🔴 | 🟢 | ⚪ |

### 9.3 API / RPC coverage
| Screen | Needs RPC | Status |
|---|---|:--:|
| SCR-20 | `get_talent_profile` | 🔴 |
| SCR-09 | `search_talent` · shortlist RPCs | 🟢 |
| SCR-06 | `create_booking_request` · `transition_booking` | 🔴 |
| SCR-05 | `get_booking` · `transition_booking` · `confirm_booking` | 🟢 confirm · 🔴 rest |
| SCR-25 | `list_bookings(p_role)` | 🔴 |
| SCR-15 | `list_notifications` · `mark_notifications_read` | 🔴 |
| SCR-23 | availability read/write · batch RPC | 🟢 table · 🔴 RPC |

### 9.4 Component coverage (reuse — no duplication)
| Screen | Reused components |
|---|---|
| SCR-09 | NavRail · cards · Shortlist sheet · OperatorChatDock |
| SCR-20 | Hero · Gallery · StatusChip · EvidenceBlock · IntelligencePanel · dock · Timeline |
| SCR-06 | WizardStep · FieldReview · EvidenceBlock · dock |
| SCR-05 | shell · tabs · StatusChip · EvidenceBlock · Timeline · Call Sheet modal · dock |
| SCR-25 | shell · KPI cards · IntelligencePanel · dock · roster cards |
| SCR-15 | BottomSheet/drawer · list rows |
✅ All from existing patterns — no new components introduced.

### 9.5 User-journey matrix
| Journey | Status |
|---|:--:|
| Operator booking | 🟢 |
| Model accepts offer | 🟢 |
| Agency manages roster | 🟢 |
| Shoot workflow | 🟢 |
| Notifications | 🟢 |
| Availability (self-service) | 🟡 (SCR-23 unbuilt) |

### 9.6 Route matrix
| Route | Screen | Agent | RPC (Phase 2) |
|---|---|---|---|
| `/app/matching?tab=talent` | SCR-09 | model-match | search_talent |
| `/app/matching/talent/[id]` · `/app/talent/profile` | SCR-20 | model-match · booking | get_talent_profile |
| `/app/shoots/new?flow=booking` | SCR-06 | booking | create_booking_request |
| `/app/shoots/[id]?flow=booking` | SCR-05 | booking | transition/confirm |
| `/app/model` · `/app/roster` | SCR-25 | booking (role) | list_bookings |
| `/app/inbox` | SCR-15 | — | list_notifications |

### 9.7 Data flow
`Screen → CopilotKit → Mastra → Gemini → Supabase → Realtime → UI` (Phase 2; Phase 1 = fixtures).

---

## 10. Issue I-8 (added)

| # | Scope | Issue | Sev | Fix | Owner |
|---|---|---|:--:|---|---|
| I-8 | all modals/drawers/sheets/EvidenceBlock | verify each has close action + keyboard (Esc) + return-focus; no interaction dead-ends | 🟡 | a11y pass per surface | Design spec → Code |

---

## 11. Design Improvements & Fix Plan (D-FIX)

> Documentation-only. Each task: purpose · problem · solution · files · deps · acceptance · checklist · owner · effort. Checklist keys: ☐ not started · ☑ complete.

### 🔴 Critical (before Claude Code)

**D-FIX-001 · Selected-talent routing** ✅ DONE
Purpose: book/route the talent actually in view. Problem: SCR-20/25 hardcode `talent=runwithkara` (I-1/I-3). Solution: SCR-20 reads `?talent=` from URL; SCR-25 offers carry per-offer `talent`. Files: `SCR-20-Talent-Profile.dc.html`, `SCR-25-Role-Dashboards.dc.html`. Acceptance: booking a different talent carries its id end-to-end. Effort: S. Owner: Design.
Checklist: ☑ Design updated ☑ Navigation verified ☑ Journey verified ☑ Docs updated

**D-FIX-002 · Dead "Edit availability" CTA** ✅ DONE
Purpose: no dead ends. Problem: SCR-25 button → nowhere (I-2). Solution: wired to Model Profile self-view availability (`SCR-20…?mode=model`). Files: `SCR-25`. Acceptance: CTA opens a real surface. Effort: S. Owner: Design. *(SCR-23 full editor remains D-FIX-005.)*
Checklist: ☑ Design updated ☑ Navigation verified ☑ Mobile verified ☑ Docs updated

**D-FIX-003 · Historical-doc markers** ✅ DONE
Purpose: prevent Code following superseded specs. Problem: plan §0.0/§22 fold-in + `/onboarding/talent`; `01-handoff` (I-4/I-5). Solution: 🕰 HISTORICAL banners added to plan §0.0 + §22 and `01-handoff` header. Files: `00-model-booking-plan.md`, `01-…handoff.md`. Acceptance: no un-flagged stale route/fold text. Effort: S. Owner: Design.
Checklist: ☑ Docs updated ☑ Terminology consistent

### 🟡 High (recommended before implementation)

**D-FIX-004 · Modal/sheet a11y pass** (I-8) ✅ DONE (Design portion) — Esc-to-close added on SCR-09 shortlist drawer, SCR-15 bell slide-over, and Shoot Detail edit + Call Sheet modals (backdrop-close already present). Return-focus is Code-owned (React refs). Files: SCR-09, SCR-15, Shoot Detail. Acceptance: each overlay closes via button+Esc+backdrop. Effort: M. Owner: Design spec → Code.
Checklist: ☑ Accessibility (Esc+backdrop) ☑ Journey verified ☐ Return-focus (Code) ☑ Docs updated

**D-FIX-005 · SCR-23 Availability editor** ✅ DONE — built `screens/SCR-23-Availability-Editor.dc.html`: month grid, 4 states (available/blocked tap-toggle; tentative/booked read-only), counts, dirty→Save, populated/loading/error. Wired from SCR-25 “Edit availability”. Files: new SCR-23, SCR-25. Acceptance: 4 states, toggle, single save. Effort: M. Owner: Design.
Checklist: ☑ Design updated ☑ Navigation verified ☐ Mobile (spec §19) ☑ A11y (Esc reserved) ☑ Docs updated

**D-FIX-006 · Empty/loading/error states** ✅ DONE — SCR-20 (skeleton + offline/error + Retry via `state` tweak), SCR-06 Wizard (Sending + send-failure banner + Retry via `sendResult` tweak), SCR-05 Detail (loading/error/empty via STATE switcher), SCR-23 (exemplar). SCR-09/15/25 already had empty states. All verified 0-holes, console clean.
Checklist: ☑ SCR-23 states ☑ existing empty states ☑ loading/error on Profile/Wizard/Detail ☑ Docs updated

### 🟢 Medium (UX / consistency)

**D-FIX-007 · Per-offer talent mapping** (I-3) — SCR-25 offers route their own talent. Effort: S. Owner: Design. Checklist: ☑ Design updated ☑ Journey verified — **DONE**: `rawOffers[].talent` carries each offer's id (agency On-Running→`lena`), and Accept/Why route with `+o.talent+`.

**D-FIX-008 · AI-native panel on SCR-09/15** (I-7). Effort: M. Owner: Design. Checklist: ☑ Panel added ☑ AI/HITL verified ☑ Docs updated — **DONE**: SCR-09 already carried a Brand-DNA IntelligencePanel; SCR-15 now has an **Inbox intelligence** panel (AI summary · needs-attention action rows deep-linking to bookings · at-a-glance counts · agent-idle) — briefing, not chat; HITL untouched.

**D-FIX-009 · Terminology sweep** — one term per concept. Effort: S. Owner: Design. Checklist: ☑ Docs consistent — **DONE**: canonical glossary below; built screens follow it.

**Canonical glossary (one term per concept):**
| Term | Means | Not |
|---|---|---|
| **booking** | the record with the lifecycle (`requested→approved→confirmed…`) | "reservation", "gig" |
| **request** | the operator's initial action → status `requested` | "invite" (a request is operator→talent) |
| **offer** | a booking as presented to the **talent** for Accept/Decline | "proposal" |
| **talent** | a bookable person in discovery/matching (creator/model) | "influencer", "candidate" |
| **model** | a talent in the booking/roster/dashboard context | "artist" |
| **operator** | the FashionOS admin driving the flow | "user", "manager" |
| **confirm** | operator-only final commit → `confirmed` | (never AI, never talent) |

Rule: *talent* in discovery, *model* in roster/dashboard, *offer* only on the talent's side, *request* only on the operator's side, *booking* everywhere else.

### ⚪ Future (post-MVP)

**D-FIX-010 · Reference mobile DC build** (prove §19). · **D-FIX-011 · Contracts/payments** (deferred D8). · **D-FIX-012 · pgvector match, realtime polish.**

### Dependency roadmap
`D-FIX-001/003 (docs+routing)` → `D-FIX-002/005 (availability)` → `D-FIX-004/006 (a11y+states)` → freeze design → Supabase/RPC verify (EV-1..5) → React shell → CopilotKit → Mastra → Gemini → Supabase APIs → Realtime → E2E → mobile → QA.

### Definition of Done (Claude Design)
☐ every CTA/link → real destination or labelled TODO · ☐ per-talent routing · ☐ no dead ends · ☐ empty/loading/error per screen · ☐ every overlay a11y-complete · ☐ HITL preserved · ☐ mobile spec per screen · ☐ docs single-source, no stale refs · ☐ AI panel+dock proactive where applicable.

### Updated production-readiness
Design **93%** (was 90; matrices + fix plan close the gaps) · Backend 55% 🔴 Phase 2 · **Overall 92%**.

### Remaining risks
1. Backend RPC contracts unverified (EV-1..5) — could shift Phase-2 assumptions. 2. Mobile shell unbuilt (spec only). 3. Selected-talent routing until D-FIX-001. 4. Overlay a11y until D-FIX-004.

---

## 12. Extended matrices (added per 95% review)

### 12.1 Master navigation matrix (every CTA → destination)
| Screen | CTA | Destination | Type | Exists? |
|---|---|---|---|:--:|
| SCR-09 | Save (♥) | Shortlist | drawer | 🟢 |
| SCR-09 | Send to shoot | Shoot Wizard `?flow=booking&talent=<id>` | page | 🟢 |
| SCR-09 | fit badge | EvidenceBlock | sheet | 🟢 |
| SCR-20 | Request booking | Shoot Wizard `?flow=booking&talent=<id>` | page | 🟢 |
| SCR-20 | Explain fit | EvidenceBlock | panel | 🟢 |
| SCR-24 | View my profile | SCR-20 | page | 🟢 |
| SCR-06 | Send booking request | Booking Detail `?flow=booking&status=requested` | page | 🟢 |
| SCR-05 | Approve/Confirm/Decline | status transition | state | 🟢 |
| SCR-05 | Booked › (crew) | Booking Detail `status=confirmed` | page | 🟢 |
| SCR-25 | Accept/Decline offer | Booking Detail `status=approved` / remove | page/state | 🟢 |
| SCR-25 | Edit availability | **SCR-23** | page | 🟢 (was dead — fixed) |
| SCR-15 | notification row | Booking Detail / SCR-09 / SCR-20 | page | 🟢 |
| SCR-15 | bell | slide-over | drawer | 🟢 |
| SCR-23 | Save availability | dirty→saved | state | 🟢 |
| SCR-23 | Retry (error) | reload populated | state | 🟢 |

**No orphan buttons remain** (the one dead CTA, Edit availability, now routes to SCR-23).

### 12.2 State matrix (per screen)
| Screen | Empty | Loading | AI thinking | Streaming | Error | Success |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| SCR-09 | 🟢 shortlist | ⚪ | 🟢 dock | ⚪ | ⚪ | 🟢 toast |
| SCR-20 | ⚪ | 🟢 skeleton | 🟢 dock | ⚪ | 🟢 retry | 🟢 |
| SCR-06 | — | 🟢 sending | 🟢 | 🟢 scan | 🟢 send-retry | 🟢 send |
| SCR-05 | 🟢 empty | 🟢 skeleton | 🟢 | ⚪ | 🟢 retry | 🟢 confirm |
| SCR-25 | 🟢 offers | ⚪ | 🟢 dock | ⚪ | ⚪ | 🟢 |
| SCR-15 | 🟢 caught-up | ⚪ | — | — | ⚪ | 🟢 read |
| SCR-23 | — | 🟢 | — | — | 🟢 | 🟢 saved |
> ⚪ = spec'd, not built (minor, non-blocking). Offline/permission-denied are catalogued in `STATES.md`; per-screen wiring = Code. **D-FIX-006 done:** SCR-20 skeleton+error+retry, SCR-06 sending+send-error retry, SCR-05 loading/error/empty, SCR-23 exemplar.

### 12.3 Permissions matrix (who can do what)
| Action | Operator | Model | Agency | Admin |
|---|:--:|:--:|:--:|:--:|
| Search/shortlist talent | ✓ | ✗ | ✓ | ✓ |
| Send booking request | ✓ | ✗ | ✗ | ✓ |
| Quote / counter | ✗ | ✓ | ✓ | ✓ |
| Accept / decline offer | ✗ | ✓ | ✓ | ✓ |
| **Confirm booking** | ✓ | ✗ | ✗ | ✓ |
| Edit own availability | ✗ | ✓ | ✓ (managed) | ✓ |
| Edit talent documents metadata | ✗ | ✓ | ✓ | ✓ |
| View talent documents | ✓ (read) | ✓ | ✓ | ✓ |
> Enforced by RLS (engineering ref §2.10/§5). AI never in any “can” cell — HITL.

### 12.4 Feature dependency map
```
Supabase (talent·availability·bookings·notifications)
   ↓
Model Profile (SCR-20) ← Matching (SCR-09)
   ↓
Availability (SCR-23) → Booking Wizard (SCR-06)
   ↓
Booking Detail (SCR-05) → Notifications (SCR-15) → Role Dashboards (SCR-25)
```
Build order follows the arrows (data → profile → availability → booking → detail → notifications → dashboards).

### 12.5 Component ownership
| Component | Owner | Shared? | Reuse | Deprecated? |
|---|---|:--:|:--:|:--:|
| OperatorShell / 3-panel | Design system | ✓ | all screens | no |
| IntelligencePanel | Design system | ✓ | 7 screens | no |
| OperatorChatDock | Design system | ✓ | all shell screens | no |
| EvidenceBlock | Design system (frozen) | ✓ | 8 screens | no |
| StatusChip | Design system | ✓ | detail/history | no |
| FieldReview | Booking (SCR-24) | ✓ | Wizard, Onboarding | no |
| WizardStep | Design system | ✓ | Shoot/Booking wizard | no |
| BottomSheet | Design system | ✓ | mobile overlays | no |
| Call Sheet modal | Shoot Detail | ✓ | shoot flow | no |

### 12.6 API contract matrix (design assumption vs verified)
| RPC | Assumed by | Verified? | Note |
|---|---|:--:|---|
| `search_talent`, shortlist RPCs | SCR-09 | 🟢 shipped | ref §2.3 |
| `confirm_booking` | SCR-05 | 🟢 shipped (service-role) | ref §2.3 |
| `get_talent_profile` | SCR-20 | 🔴 **pending schema verify** (EV-1) | view exists, RPC spec |
| `create_booking_request` / `transition_booking` | SCR-06/05 | 🔴 pending (EV) | spec-only |
| `list_bookings(p_role)` | SCR-25 | 🔴 pending (EV) | spec-only |
| `list_notifications` / `mark_notifications_read` | SCR-15 | 🔴 pending (EV) | spec-only |
| availability batch RPC | SCR-23 | 🔴 pending; table+RLS 🟢 | direct RLS writes today |
> **All 🔴 rows = “Pending schema verification”, not assumed complete** (EV-1..5). Verify against the live repo before Phase 2.

### 12.7 Mobile score correction
Revised **90 → 82** (🟡): plan + layouts + responsive rules exist (§19), but **no built responsive reference DC** — mobile stays “spec, not proven” until one screen ships responsively (D-FIX-010).
