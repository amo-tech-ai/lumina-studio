# Claude Code — Implementation Handoff (iPix / FashionOS)

> **Purpose:** the single implementation-ready brief so Claude Code can build the app **without redesigning features or making architecture decisions**. Design is complete and prototyped; this document maps every prototype to the React/Supabase build.
>
> **Location:** `docs/CLAUDE-CODE-HANDOFF.md` (the main docs root). **All screen prototypes live in one folder, `Pages/`** — see §0.5 for the complete file→screen index.
>
> **Authority chain:** engineering facts → `docs/models/02-engineering-reference.md` (v1.0). Screen IDs → `docs/handoff/SCREEN-REGISTRY.md`. Visual system → `DESIGN.md` + `design-patched/tokens.css`. Mobile → `MOBILE-PLAN.md`. Component contracts → `components/COMPONENTS.md`. **Refactor plan → §12 of this file** (the single consolidated plan; `REFACTOR.md` + `crm/CRM-REFACTOR-AUDIT.md` are its measured evidence, `PAGES-REORG-PLAN.md` its executed migration record). On any conflict, the engineering reference + this file win.
>
> **Hard rules:** (1) Never duplicate an existing Supabase table or RPC — verify the live schema first. (2) Buttons/keyboard are the accessible source of truth; gestures are enhancements. (3) No voice mode (Future Phase). (4) HITL — AI drafts/explains, humans confirm/accept/approve/send.

---

## 0. What exists (design) vs what to build (engineering)

| Layer | Status |
|---|---|
| **Design prototypes** (all screens, DC/HTML) | 🟢 complete + render-verified — see Progress Tracker §11 |
| **Mobile preview** (28 frames @390) | 🟢 `Pages/SCR-MOBILE-Gallery.dc.html` |
| **React app** (shell, components, screens) | ⚪ **build this** — §1 order |
| **Supabase** (schema/RPCs beyond MVP) | 🔴 **verify + extend** — §7 |
| **AI wiring** (CopilotKit/Mastra/Gemini/Realtime) | ⚪ **Phase 2** — §6, §8 |

Prototypes are inline-styled Design Components; they encode **layout, states, copy, and interaction intent**, not production React. Lift exact tokens/spacing/copy from them; build the components in §4.

---

## 0.5 File layout — where the prototypes live (Pages/ reorg)

Every screen prototype is consolidated into **one `Pages/` folder** — a single source of truth, one shared `Pages/support.js` runtime, one `Pages/INDEX.html` gallery. There is no longer a `booking/`, `crm/`, or `docs/models/screens/` screen folder; those were merged into `Pages/`.

```
Pages/            32 screen prototypes (.dc.html) + support.js + INDEX.html   ← build from these
components/       20 shared component primitives (.dc.html) + COMPONENTS.md   ← the catalog
archive/          2 superseded old versions (Brand Detail, Command Center)   ← ignore
images/           shared imagery (screens reference ../images/)
docs/             this handoff + handoff/ registry + models/ engineering ref
crm/ · *.md       planning/audit/spec docs only (no screens)
```

**Rules for Claude Code:** build only from `Pages/`; treat `components/` as the component catalog to realize in React (§4); ignore `archive/`. All screens reference images as `../images/…` and the runtime as `./support.js` — preserve those relative paths if any file is relocated.

### Complete Pages/ index — all 32 screens

> `SCR` per `docs/handoff/SCREEN-REGISTRY.md` (owner of numbering). Status: 🟢 built+verified · 🟡 proto (backend-pending). Booking flows (SCR-21/22) are the `flow=booking` variants of the shoot files, not separate prototypes.

| File (`Pages/…`) | SCR | Route | Status |
|---|---|---|:--:|
| `Command Center.v2.image-first.dc.html` | 01 | `/app` | 🟢 |
| `Brand List.v2.image-first.dc.html` | 02 | `/app/brand` | 🟢 |
| `Brand Detail.v2.image-first.dc.html` | 03 | `/app/brand/[id]` | 🟢 |
| `Shoots List.v2.image-first.dc.html` | 04 | `/app/shoots` | 🟢 |
| `Shoot Detail.v2.image-first.dc.html` | 05 **+22** | `/app/shoots/[id]` · `?flow=booking`→`/app/bookings/[id]` | 🟢 |
| `Shoot Wizard.v2.image-first.dc.html` | 06 **+21** | `/app/shoots/new` · `flow=booking`→booking wizard | 🟢 |
| `Campaigns.v2.image-first.dc.html` | 07 | `/app/campaigns` | 🟢 |
| `Assets.v2.image-first.dc.html` | 08 | `/app/assets` | 🟢 |
| `SCR-09-Matching-Talent.dc.html` | 09 | `/app/matching` (Talent · Casting/Grid/List) | 🟢 |
| `Matching.v2.image-first.dc.html` | 09† | `/app/matching` (legacy brand↔creator discovery) | 🟢 |
| `Channel Preview.v2.image-first.dc.html` | 10 | `/app/preview` | 🟢 |
| `Onboarding.v2.zeely.dc.html` | 11 | `/onboarding` | 🟢 |
| `SCR-15-Notification-Center.dc.html` | 15 | `/app/inbox` | 🟡 |
| `Analytics.v2.image-first.dc.html` | 16 | `/app/analytics` | 🟢 |
| `Campaign Performance.v2.image-first.dc.html` | 17 | `/app/analytics/campaigns` | 🟢 |
| `SCR-18-Collaboration-Audit.dc.html` | 18 | `/app/activity` | 🟢 |
| `SCR-20-Talent-Profile.dc.html` | 20 | `/app/talent/profile` (`mode` operator·model) | 🟡 |
| `SCR-23-Availability-Editor.dc.html` | 23 | talent-scoped | 🟡 |
| `SCR-24-Talent-Onboarding.dc.html` | 24 | `/app/talent/profile` (URL-context) | 🟡 |
| `SCR-25-Role-Dashboards.dc.html` | 25 | `/app/model` · `/app/roster` (`role`) | 🟡 |
| `SCR-26-CRM-Companies-List.dc.html` | 26 | `/app/crm/companies` (Organizations) | 🟢 |
| `SCR-27-CRM-Company-Detail.dc.html` | 27 | `/app/crm/companies/[id]` | 🟢 |
| `SCR-28-CRM-Contacts-List.dc.html` | 28 | `/app/crm/contacts` (People) | 🟢 |
| `SCR-29-CRM-Contact-Detail.dc.html` | 29 | `/app/crm/contacts/[id]` | 🟢 |
| `SCR-30-CRM-Pipeline.dc.html` | 30 | `/app/crm/pipeline` | 🟢 |
| `SCR-31-CRM-Deal-Detail.dc.html` | 31 | `/app/crm/pipeline/[id]` | 🟢 |
| `SCR-MOBILE-Gallery.dc.html` | — | mobile preview — 28 operator/booking frames @390 | 🟢 |
| `SCR-MOBILE-CRM-Gallery.dc.html` | — | mobile preview — 6 CRM frames @390 | 🟢 |
| `SCR-MOBILE-Booking-Shell.dc.html` | — | mobile reference shell (tab bar · composer · sheet) | 🟢 |
| `SCR-MOBILE-BottomSheet.dc.html` | — | mobile primitive (Insights/filters/chat sheet) | 🟢 |
| `Component Library.dc.html` | — | design-system catalog (promote to source of truth) | 🟢 |
| `DEMO-360-Agency.dc.html` | — | 360° profile template demo (Agency config) | 🟢 |

**† Matching naming (not a duplicate):** `Matching.v2.image-first` (legacy brand↔creator discovery) and `SCR-09-Matching-Talent` (talent/casting with Casting Review + swipe) are **distinct screens sharing a name stem** — do **not** merge or double-build them (see §12 A9). Keep the casting build (`SCR-09-Matching-Talent`) as canonical SCR-09; the legacy file is a separate discovery variant to reconcile in the registry during conversion.

---

## 1. Implementation order (build sequence)

1. **Verify Supabase schema** (§7) — enumerate live tables/RPCs/RLS before writing anything. Never duplicate.
2. **Shared 3-panel React shell** (§4.1) — nav rail · workspace · IntelligencePanel.
3. **Shared mobile shell** (§4.2) — bottom tab bar · Insights sheet · persistent composer · safe-area.
4. **Shared components** (§4.3–4.18) — EvidenceBlock, StatusChip, ApprovalCard, Cards, Tables, Timeline, Gallery, KPI, Wizard, Empty/Loading/Error.
5. **Persistent CopilotKit composer** (§4.5) — route-aware assistant, chips, HITL-safe.
6. **IntelligencePanel** (§4.4) — read-only AI brief, EvidenceBlock host.
7. **Matching** (SCR-09) incl. **Casting Review Mode** (§5).
8. **Model Profile** (SCR-20).
9. **Booking Wizard** (SCR-21 = `flow=booking` of Shoot Wizard).
10. **Booking Detail** (SCR-22 = `flow=booking` of Shoot Detail).
11. **Notifications** (SCR-15).
12. **Role Dashboards** (SCR-25, model · agency).
13. **CRM** (brands/contacts — existing screens).
14. **Analytics** (SCR-12/13).
15. **AI integration** (§6 — CopilotKit → Mastra → Gemini).
16. **Realtime** (§8 Phase 2 — bookings, notifications).
17. **Testing** (§9 checklists).
18. **Production hardening** (perf, a11y audit, error budgets).

---

## 2. Per-screen specification

> Columns are dense by design. Each screen: reuse the shared shell (§4.1/4.2) unless noted. **Assistant** = the route-aware CopilotKit persona. All AI is HITL. Empty/Loading/Error follow the archetypes in `MOBILE-IMPROVE.md §7` unless a screen overrides.

| SCR | Purpose / Route | Entry → Exit | Journeys | Shared components | IntelligencePanel | Assistant (composer) | States | A11y / Responsive | Acceptance |
|---|---|---|---|---|---|---|---|---|---|
| **09 Matching + Casting** `/app/matching` | Discover & review bookable talent for a brand brief | from Command Center / Brand Detail → Model Profile · Booking Wizard | Talent tab → Casting/Grid/List → Shortlist → Send to shoot | Shell, Cards, EvidenceBlock, ShortlistDrawer, Composer | focused model's DNA-fit pillars + EvidenceBlock | **Matching Assistant** (`model-match`) | loading·populated·empty-filters·empty-stack·pending-shortlist·error·no-org | buttons+←/→/↑ source of truth; swipe enhancement; 3-panel→mobile deck | Casting default desktop+mobile; no dating copy; Why-fit opens EvidenceBlock; shortlist writes RPC |
| **20 Model Profile** `/app/talent/[id]` | Evaluate one model, request booking | from Matching/Casting → Booking Wizard | tabs (Portfolio·Measurements·Availability·Bookings·Reviews·Docs·Activity) → Request booking | Shell, Gallery, Timeline, EvidenceBlock, Composer, sticky CTA | booking health · availability risk · fit score · recommended brands | **Booking Assistant** | loading(skeleton)·populated·error | sticky Request-booking ≥44px; tabs scroll; mode=operator/model | Request-booking carries `?talent=`; EvidenceBlock on fit |
| **21 Booking Wizard** `/app/shoots/new?flow=booking` | Book talent as a step-flow | from Model Profile / Matching → Booking Detail | 5 steps (Talent·Dates·Terms·Message·Review) → Send → Detail `requested` | **Wizard framework**, FieldReview, EvidenceBlock, Composer | rate suggestion + conflict + evidence | **Booking Assistant** | per-step · sending · send-error(retry) | keyboard-aware sticky Back/Continue; Send locked until reviewed | reuses Shoot Wizard shell (not a fork); FieldReview Approve/Edit per term |
| **22 Booking Detail** `/app/bookings/[id]` | Manage one booking lifecycle | from Wizard/Notifications → shoot crew | tabs (Overview·Talent·Availability·Approvals·Activity); FSM requested→approved→confirmed | Shell, StatusChip, Timeline, ApprovalCard, EvidenceBlock, sticky CTA | booking insight · hold expiry · rate rationale | **Booking Assistant** | loading·populated·empty·error | operator-only Confirm (sticky ≥44px); status stepper scroll | `flow=booking` variant of Shoot Detail via `FLOWCFG`; confirm is operator-only |
| **15 Notifications** `/app/inbox` | Event inbox for booking/shoot activity | bell from any shell → Booking Detail/Profile | grouped Today/Earlier; filters; deep-link rows | Shell, LIST, IntelligencePanel, Composer | inbox digest + needs-attention | **Operations Assistant** | loading·populated·empty·error | unread dots; swipe-dismiss(mobile); sticky Mark-all-read | rows deep-link with `?flow=booking&talent=&status=`; unread via `notification_reads` |
| **25 Role Dashboards** `/app/dashboard` | Two-sided home (model · agency) | login → Booking Detail / Availability | offers Accept/Decline (confirm sheet) · roster · KPIs | Shell, KPI cards, Cards, EvidenceBlock, Composer | AI summary · needs-attention · recommendation | **Agency/Booking Assistant** | loading·populated·empty·error·no-org | inline ≥44px offer actions + confirm sheet; 3-panel→mobile | shared `ROLES` config; Accept→Detail `approved`; confirm before accept |
| **23 Availability** `/app/talent/[id]/availability` | Model sets open/blocked days | from Profile/Dashboard → Booking Detail | month grid edit → Save | Shell, Calendar, Composer, sticky Save | availability risk · held-day explain | **Booking Assistant** | loading·populated·empty·error | sticky Save bar; month arrows; ≥44px cells | 4 states (avail/blocked/tentative/booked); booked→Detail |
| **24 Onboarding** `/app/talent/profile` | URL-context talent onboarding | invite link → Profile | 4 steps; AI scan → FieldReview approve | Wizard, FieldReview, EvidenceBlock | draft confidence per field | **Booking Assistant** (URL-context) | per-step · scanning · error | FieldReview Approve/Edit; Finish gated | every AI field human-approved before finish |
| **01 Command Center** `/app` | Operator daily home | login → any screen | KPIs · needs-attention · active shoots | Shell, KPI cards, Cards, Composer | day summary · conflicts | **Production Assistant** | loading·populated·empty·error | tappable priority rows; KPI snap; 3-panel→mobile | — |
| **02/03 Brand List/Detail** `/app/brands` · `/app/brand/[id]` | Brand triage / health | Command Center → Shoot Wizard | search/sort · DNA cards → detail → new shoot | Shell, Cards, BARS, Timeline, Composer | brand DNA pillars + trend | **Brand Assistant** | loading·populated·empty·error | search+sort; DNA legend; sticky New-shoot | — |
| **04/06 Shoot List/Detail** `/app/shoots` · `/app/shoots/[id]` | Production tracking | Command Center → Call Sheet | status cards · lifecycle stepper · tabs | Shell, Cards, Timeline, ApprovalCard, Call-Sheet modal, Composer | production insight | **Production Assistant** | loading·populated·empty·error | horizontal stepper; tab strip; confirmed-booking crew row | shoot flow unchanged by booking flow |
| **05 Shoot Wizard** `/app/shoots/new` | Create shoot | Shoot List → Shoot Detail | 4/10 steps; AI-drafted details | **Wizard framework**, FieldReview, Composer | budget/crew suggestions | **Production Assistant** | per-step·loading·error | keyboard-aware sticky footer | shared wizard with Booking flow |
| **07/AD/AL Assets** `/app/assets` · `/[id]` · library | Asset pool / rights / library | Command Center → Channel Preview | search · rights filter · grouped library · export | Shell, Gallery, FORM, Composer | rights expiry · usage | **Asset Assistant** | loading·populated·empty·error | search + rights-expiring filter; collapsible groups | rights countdown on detail |
| **10 Channel Preview** `/app/preview` | Pre-publish channel render | Assets → publish | in-feed mock · caption draft · schedule → Approve | Shell, FEED mock, FORM, Composer | crop/caption/reach | **Channel Assistant** | loading·populated·empty·error | in-feed device mock; schedule row before Approve | Approve-to-publish is HITL |
| **CP Campaign Preview** `/app/campaigns/[id]` | Plan multi-channel drop | Campaigns → launch | KPI forecast · channel readiness · approve | Shell, KPI cards, LIST, Composer | reach forecast · readiness | **Campaign Assistant** | loading·populated·empty·error | reach sparkline; readiness chips | Approve-to-publish HITL |
| **12/13 Analytics/Reports** `/app/analytics` · `/reports` | Portfolio performance | Command Center → drill | KPI deltas · bars · reports export | Shell, KPI cards, BARS, Tables, Composer | what-changed · top driver | **Strategy Assistant** | loading·populated·empty·error | Δ deltas + sparklines; export PDF; period compare | — |

> Full route/entry/exit detail per screen also lives in `docs/handoff/02-screen-map.md`; nav edges in `07-navigation-map.md`. This table is the implementation superset.

---

## 3. Route → assistant map (CopilotKit personas)

`/app` Production · `/app/dashboard` Operations/Agency · `/app/brands*` Brand · `/app/shoots*` Production · `/app/matching` Matching · `/app/talent/[id]` Booking · `/app/bookings/[id]` Booking · `/app/inbox` Operations · `/app/assets*` Asset · `/app/preview` Channel · `/app/campaigns*` Campaign · `/app/analytics*` Strategy. Full table + proactive greetings: `MOBILE-PLAN.md §22.3`; chip families §22.4. **HITL chip rule:** chips only *review·explain·draft·prepare·summarize·compare·filter·find* — never *Accept·Decline·Confirm·Send·Publish·Book*.

---

## 4. Shared React architecture (build first)

> Build order within this section = 4.1 → 4.18. Each entry: **contract** + **which screens reuse it**.

- **4.1 AppShell (3-panel)** — `NavRail(56) · Workspace(1fr) · IntelligencePanel(340)`; container-query driven. **All operator screens.** Collapses to mobile shell ≤1024px.
- **4.2 MobileShell** — bottom tab bar (Home·Shoots·Assets·Brands·More, 56px+safe-area) · header Insights trigger · **persistent composer above tab bar** · Insights BottomSheet. **All screens on mobile.** Ref: `SCR-MOBILE-Booking-Shell.dc.html`, `SCR-MOBILE-Gallery.dc.html`.
- **4.3 Navigation** — rail + mobile tabs + More sheet; active state fill/weight. **All.**
- **4.4 IntelligencePanel** — read-only AI brief (summary · needs-attention · recommendation · EvidenceBlock host · activity). **09·15·20·22·25** (and every operator screen's right pane). Never a chat.
- **4.5 CopilotKit Composer** — persistent input + chips + route assistant; expands to ~94vh chat sheet; conversation memory (page·brand·shoot·booking·selection·filters); streamed responses; **no voice**; HITL-only writes. **All screens.** Spec: `COMPOSER-PRIMITIVE.spec.md`.
- **4.6 Insights BottomSheet** — mobile IntelligencePanel; drag handle + backdrop + Esc; snap half/full. **All mobile.** Ref: `SCR-MOBILE-BottomSheet.dc.html`.
- **4.7 Wizard framework** — shell·steps·progress·nav·shared state·validation·keyboard-aware sticky footer·unsaved-exit guard. **05 Shoot Wizard, 21 Booking Wizard, 24 Onboarding.** One framework, `flow` param switches content.
- **4.8 EvidenceBlock** — score + confidence bar + pillar breakdown + "why". **09·20·21·22·23·25·24.**
- **4.9 StatusChip** — booking/shoot status enum → color. **22·25·04·06·15.**
- **4.10 ApprovalCard** — HITL approve/reject + evidence expand. **Approvals·22.**
- **4.11 Cards** (talent/brand/shoot/asset) — 3:4/16:9/4:3/1:1; badge·ring·availability dot·why-link. **09·02·04·07·25.**
- **4.12 Tables** — dense list rows; sort; row actions. **List mode·13·Assets.**
- **4.13 Timeline** — activity/status events. **06·20·22.**
- **4.14 Gallery** — masonry/justified grid; selection overlay; bulk actions. **07·AL·20·10.**
- **4.15 KPI cards** — value + Δ delta + sparkline; snap-scroll row. **01·12·13·25·03·CP.**
- **4.16 EmptyState** — icon + heading + one CTA + AI suggestion. **All.**
- **4.17 LoadingState** — skeleton matching populated layout. **All.**
- **4.18 ErrorState** — icon + message + retry; agent still operable. **All.**

---

## 5. Casting Review — implementation notes

- Extends SCR-09 Talent tab; **not** a new route/workflow. Modes: **Casting Review (default desktop+mobile) · Grid · List** over one `search_talent` result set (no refetch on switch).
- **Buttons + keyboard are the primary accessible controls** — Skip · Shortlist · View Profile (≥44px), keys ←/→/↑. **Swipe is enhancement only.**
- Build **production swipe in React with Pointer Events** (mouse + touch): drag-left Skip · right Shortlist · up View Profile; card follows finger with subtle rotation; directional hints fade to threshold (**90px**); snap-back below threshold; fly-off + advance above. Guard `setPointerCapture` in try/catch. **Respect `prefers-reduced-motion`** (no fly/rotate → instant advance).
- Keep buttons fully functional; keep keyboard shortcuts; aria-live toast per action (with 5s Undo on Skip); no focus trap.
- **Add analytics events:** `casting_skip`, `casting_shortlist`, `casting_view_profile`, `casting_mode_change`, each with `{model_id, fit, method: button|key|swipe}`.
- **No dating language** anywhere (no Like/Match/Superlike/hearts/confetti). Card = professional review card (§2 SCR-09). Prototype + full spec: `SCR-09-Casting-Review.plan.md`.

---

## 6. AI architecture

- **CopilotKit** — owns the conversational surface (composer): route assistant, chips, streamed responses, tool calls that produce **drafts** (never auto-writes). Conversation memory = UI context until Phase 2 backend memory.
- **Mastra** — workflow orchestration (production-planner + model-match + booking): research → draft → FieldReview → human approval → Supabase write → notification. Owns the booking lifecycle transitions.
- **Gemini** — reasoning/generation inside Mastra steps (rationale, summaries, rate suggestions). Never the final actor.
- **Route-aware assistants** — §3 map; each has a proactive greeting (Phase 1 fixture → Phase 2 Mastra summary after load).
- **Conversation memory** — remembers current page·role·selected model/booking·filters·route·recent turns.
- **HITL rules** — AI drafts/explains/prepares; humans Accept/Decline/Confirm/Send/Publish/Book. Irreversible actions open a confirm sheet. AI never auto-approves.
- **IntelligencePanel responsibilities** — read-only awareness (summary·risks·recommendation·evidence); **not** a chat; never executes writes.
- **Chatbot (composer) responsibilities** — conversational Q&A + draft actions the user confirms; the only conversational surface.

---

## 7. Supabase — verify before implementing

> **Claude Code must enumerate the live schema first and never duplicate an existing table/RPC.** Status below is *reported* by `02-engineering-reference.md §2`, not independently code-verified here.

- **Existing tables (reported):** organizations, users/roles, brands, shoots, assets, talent, shortlists/invites. **Verify names + columns.**
- **New tables required:** `bookings`, `contracts` (deferred), `notifications`, `notification_reads`, `availability`. **Confirm none already exist under another name.**
- **Existing RPCs (reported live):** `search_talent`, `toggle_shortlist_item`, `create_booking_request`.
- **Missing RPCs to add:** `list_bookings(p_role)`, `get_booking(p_id)`, `transition_booking(p_id, p_status)`, `list_notifications`, `set_availability`. **Verify exact shapes before assuming fields.**
- **RLS:** org-scoped on every table; talent can edit only own availability/profile; operator-only booking confirm. **Author policies per table.**
- **Indexes:** booking(org, status, dates); notification(user, read); availability(talent, date). **Triggers:** booking status-change → notification insert.
- **Edge Functions:** model-match invocation, notification fan-out. **Realtime:** bookings + notifications channels (Phase 2). **Storage buckets:** talent portfolios, shoot assets (verify existing bucket names/policies).

**Canonical booking status enum:** `draft → invited → offered → accepted → confirmed → checked_in → completed` (↘ declined ↘ cancelled). See `02-engineering-reference.md §12.1`.

---

## 8. Backend phases

**Phase 1 (buildable now):** existing schema + `search_talent`/`toggle_shortlist_item`/`create_booking_request`; all shared React components; screens rendered against **fixtures** for anything without a live RPC (bookings lists, notifications, AI summaries). Ship the full UI Phase-1 with fixtures — the design proves it works at 390 and desktop.

**Phase 2:** booking agent (Mastra) · CopilotKit live integration · Gemini reasoning · Supabase Realtime · notifications fan-out + unread · AI summaries (proactive greetings, IntelligencePanel). Realtime is **not** an MVP blocker.

---

## 9. Verification checklists (Claude Code)

- **Navigation** — every route reachable; back/close works; deep links resolve.
- **User journeys** — Matching→Profile→Wizard(`flow=booking`)→Detail→confirmed→shoot crew; Dashboard offer→Detail `approved`; Notifications→Detail.
- **Links** — no dead CTAs; every card/row has a destination.
- **Responsive** — 390·430·768·1024 no overflow; 3-panel→1-col collapse.
- **Accessibility** — contrast ≥4.5:1; ≥44px targets; aria-labels on icon buttons; focus order + visible focus; reduced-motion; state-not-by-color-alone.
- **Keyboard** — all actions reachable; Casting ←/→/↑; wizard tab order; composer never traps focus.
- **Mobile** — persistent composer above safe area; Insights sheet; bottom nav; no horizontal scroll.
- **Empty/Loading/Error** — every screen renders all applicable states (archetypes `MOBILE-IMPROVE §7`).
- **AI behavior** — correct route assistant; chips HITL-safe; streamed; no auto-writes.
- **HITL** — Accept/Confirm/Approve/Book/Send are human; irreversible → confirm sheet.
- **Realtime** — booking/notification updates propagate (Phase 2).
- **Analytics** — key events instrumented (casting §5; booking transitions; nav).
- **Performance** — lazy images; paginate/virtualize long lists; skeletons over spinners; cache KPIs/summaries.

---

## 10. Files changed by this handoff (documentation only)

- **Moved:** this file is now `docs/CLAUDE-CODE-HANDOFF.md` (the main docs root; was `docs/models/CLAUDE-CODE-HANDOFF.md`).
- **All screen prototypes consolidated** into one `Pages/` folder (single `support.js` + `INDEX.html`); see §0.5.
- **Cross-linked authorities (unchanged, still valid):** `docs/models/02-engineering-reference.md` · `SCREEN-REGISTRY.md` · `02-screen-map.md` · `07-navigation-map.md` · `components/COMPONENTS.md` · `MOBILE-PLAN.md` (§19–§23) · `MOBILE-IMPROVE.md` · `COMPOSER-PRIMITIVE.spec.md` · `IMPLEMENTATION-MATRICES.md` · `SCR-09-Casting-Review.plan.md` · `DESIGN-TASKS.md` · **`REFACTOR.md` + `crm/CRM-REFACTOR-AUDIT.md`** (refactor evidence) · **`PAGES-REORG-PLAN.md`** (executed migration).

---

## 11. Final implementation-readiness report

**Documentation updated:** this master handoff created; it consolidates and cross-links the 10 requested docs (engineering reference, registry, nav map, component registry, mobile plan, design tasks, implementation order, verification matrix, progress tracker) rather than duplicating them.

**Remaining DESIGN work:** effectively none for scope — all screens prototyped, all states, Casting Review complete (incl. swipe). Optional: split the few gallery rows that share a representative frame (Inbox/Notifications, Brand Health/DNA, Profile/Settings).

**Remaining ENGINEERING (React) work:** the entire app build — shared shell + components (§4), all screens (§2), responsive shell + composer primitive (§4.5, spec ready), production swipe (§5). This is the bulk of remaining effort and is fully specified.

**Remaining BACKEND work:** verify live schema (§7); add `bookings`/`contracts`/`notifications`/`notification_reads`/`availability` tables + `list_bookings`/`get_booking`/`transition_booking`/`list_notifications`/`set_availability` RPCs + RLS/indexes/triggers; Phase-2 AI + Realtime.

**Risks:** (1) inventing a table/RPC that already exists — mitigate by schema audit first. (2) treating fixtures as live — every fixture is flagged. (3) responsive/keyboard only proven at 390 in prototypes — the React shell must re-verify 430/768/1024.

**Blockers:** none for design/handoff. For code build: confirm Supabase schema + author missing RPCs before wiring booking screens to data.

**Critical fixes before build:** none outstanding — the three design D-FIX criticals and the Casting swipe pointer-capture bug are resolved.

**Overall Design Readiness: 97 / 100** — every screen + state + Casting Review prototyped and verified; −3 for optional gallery-frame de-duplication and the fact that wider breakpoints are spec-only until React.

**Overall Claude Code Readiness: 92 / 100** — architecture, components, screens, states, AI roles, and build order are fully specified with prototypes to lift from; −8 because the live Supabase schema/RPCs must be verified/authored (§7) and Phase-2 AI/Realtime contracts finalize against the real backend, which this design repo cannot do.

---

## 12. Refactor plan (one plan — refactor DURING React conversion)

> The single consolidated refactor plan. Measured evidence: `REFACTOR.md` (app-wide) + `crm/CRM-REFACTOR-AUDIT.md` (CRM). Executed folder migration: `PAGES-REORG-PLAN.md`. **This section is the plan; those are its backup.**

**Golden rule:** the `.dc.html` prototypes are the *spec*, not the codebase. **Do not rewrite prototypes to share code** — each must render standalone, and deduping them breaks that. All refactoring happens **during** the React build as the extraction map below — never as a pre-conversion rewrite.

**The whole app collapses to ~12 shared components + configs.** ~12,800 lines across 31 prototypes today; the vast majority is the same shell, list, detail, wizard, and KPI patterns re-authored per file (a property of the standalone-DC medium). In React they become:

| Priority | Action | Affects | Effort |
|:--:|---|---|:--:|
| 🔴 **P0 / A1** | Split the two giants — extract `<WizardShell>` + `<DetailShell>`; make `shoot`/`booking` **sibling flow-configs** (lift the prototype's own `FLOWCFG` verbatim) | `Shoot Wizard` (1166 ln), `Shoot Detail` (1049 ln) → 2 shells + 4 configs | L |
| 🔴 **P0 / A2** | One `<AppShell>` (NavRail · workspace · IntelligencePanel · chat dock), container-query responsive | ~15 operator/booking/CRM screens | M |
| 🟠 **P1 / A3** | One `<Icon>` — unify the two icon systems (root inline `<svg>` vs booking/CRM `lu-ic`) | app-wide | M |
| 🟠 **P1 / A4** | `<EntityList>` — rows + filter chips + search + selection panel | Brand/Shoots/Assets/Campaigns lists, SCR-09, CRM lists | M |
| 🟠 **P1 / A5** | `<DetailShell>` / `<Profile360>` — hero + tabs + timeline + panel (one 360° template, per-entity config) | Brand Detail, SCR-20, SCR-25, CRM details, DEMO-360 | M |
| 🟠 **P1 / A6** | Analytics/KPI kit — `<KPICard>` + `<Sparkline>` + `<TrendRow>` | Command Center, Analytics, Campaign Performance, dashboards | M |
| 🟠 **P1 / A7** | Extract atoms — StatusChip, Card, Timeline, EvidenceBlock, ApprovalCard, Tabs, Stepper | app-wide (from `Component Library`) | M |
| 🟡 **P2 / A8** | One token file — unify `:root` across suites; fix drift colors (fold CRM audit R7 list) | app-wide | S |
| 🟡 **P2 / A9** | Register `Matching.v2` (brand↔creator) vs `SCR-09` (talent/casting) as **distinct** screens — don't merge/double-build | 2 files | S |

**Build order (foundation → out):**
1. **Foundation** — `<AppShell>` (A2) + `<Icon>` (A3) + token file (A8). Kills the biggest duplication; unblocks everything.
2. **The two giants** — `<WizardShell>` + `<DetailShell>` with `shoot`/`booking` flow-configs (A1). Highest single payoff (~2,200 ln → 2 shells + 4 configs).
3. **Two templates** — `<EntityList>` (A4) + `<DetailShell>`/`<Profile360>` (A5); convert lists/details as **configs**, not new components.
4. **Analytics kit** (A6) + **atoms** (A7) from `Component Library` (the catalog).
5. **Unique screens** consume the above; **mobile = the responsive form of the same templates** (`<1024px` → bottom tab bar + Insights sheet + composer), **not** separate files — the mobile galleries are the spec, not extra builds.

**Refactor guardrails (carry into every PR):** HITL gates (`ApprovalCard` on every write path: booking confirm, won/lost, drafted offers) must survive conversion; empty/loading/error/gated are **required props** on shared templates, never dropped as extras; the kanban→stage-accordion reflow (Pipeline) is the one genuinely mobile-only pattern needing real responsive + drag-a11y logic.
