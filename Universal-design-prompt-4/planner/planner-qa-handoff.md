# Planner — Design QA, Linear Verification & React Handoff

> **⚠️ Scope note (added 2026-07-12):** this doc describes what's **wired into the DC files by default, without toggling a Tweak** — that's why §1.4 says states are "specced, not built." `planner-final-qa.md`'s "100%" score describes the same four screens' **Tweaks-driven demonstrability** (every state exists behind a toggle). Both are accurate about what they measure — treat this doc as the one to trust for "is it in the static markup today," and `planner-final-qa.md` for "can every state be demonstrated."
>
> **Scope:** the four Planner prototypes in `Pages/` — SCR-32 Workspace · SCR-33 Dashboard · SCR-34 Instance Settings · SCR-35 Hub.
> **Status:** 🟢 **Design prototype complete.** All four render clean (0 unresolved template holes), interactions verified by DOM probe, on fixtures. Companion to `planner/planner.md` (the design plan). No React, no SQL — design-lane only.
> **Verified:** 2026-07-10.

---

## 0. Production-readiness scorecard

| Screen | File | Design | Interactions | States | A11y | Linear coverage | **Readiness** |
|---|---|:--:|:--:|:--:|:--:|:--:|:--:|
| SCR-32 Workspace | `Pages/SCR-32-Planner-Workspace.dc.html` | 🟢 | 🟢 4 views + gate drawer | 🟡 populated only | 🟢 | IPI-478 | **90 🟢** |
| SCR-33 Dashboard | `Pages/SCR-33-Planner-Dashboard.dc.html` | 🟢 | 🟢 KPI links | 🟡 populated only | 🟢 | IPI-479 | **88 🟢** |
| SCR-34 Instance Settings | `Pages/SCR-34-Planner-Instance-Settings.dc.html` | 🟢 | 🟢 tabs + invite dialog | 🟡 populated + invited | 🟢 | IPI-479 (Members) | **86 🟢** |
| SCR-35 Hub | `Pages/SCR-35-Planner-Hub.dc.html` | 🟢 | 🟢 type filter | 🟡 populated only | 🟢 | none (open PLN-009) | **80 🟡** |

**Readiness = fitness to hand to frontend**, not "shipped." The consistent −10/−15 is the one shared gap: **empty / loading / error states are specced (§4 here + per-screen spec docs) but not built into these four DCs** — only SCR-32's gate has a live approved-state. That's the single highest-value pre-handoff design task. SCR-35 carries an extra −6 because **no Linear issue backs it** (spec itself says open PLN-009 first).

---

## 1. Design QA — findings

Verified by loading each screen at its 1360×840 design size and probing the live DOM (nav, view switches, dialogs, drawers, filters, keyboard).

### 1.1 Navigation ✅
- All four share the **same 56 px icon rail**, 5 items: Home · Planner · Planner Dashboard · Notifications · Settings.
- Active item is correct per screen: SCR-32 → Planner · SCR-33 → Planner Dashboard · SCR-35 → Planner · SCR-34 → Settings.
- **Minor (P3):** SCR-34 highlights the *global* Settings item, not Planner. Acceptable (it's a settings surface) but worth aligning — could highlight Planner with a Settings sub-context. Not a blocker.
- SCR-34 has a working breadcrumb back-link ("← Summer Lookbook") to its parent workspace.

### 1.2 Responsive ⚠ (documented, not built into these DCs)
- These four are **desktop DCs** (fixed 1360-wide, 3-panel / 2-panel shells). The responsive reflow is **specified** in each screen's `uploads/SCR-3x-*.md` and in `planner.md`, and the *patterns* are already built & proven in `Pages/SCR-MOBILE-Gallery.dc.html` (390 px composer, Insights→BottomSheet, tab bar).
- **Not yet demonstrated for Planner specifically.** Highest-value responsive follow-up: add SCR-32–35 frames to a Planner mobile gallery (Timeline→vertical week list; Kanban→stage accordion; Dashboard=default mobile landing; Settings table→stacked cards; Hub→1-col). Mirrors the CRM gallery effort.

### 1.3 Accessibility ✅ (with follow-ups)
- **SCR-33 KPI cards** are real `<a>` with descriptive `aria-label`s beyond the number ("At risk, 3 tasks slipping — view"). ✅ (spec AC)
- **SCR-34 disabled tabs** carry `aria-disabled="true"` + `title="Coming soon"`, and the member table uses `role="table"`/`role="row"` semantics. ✅ (spec AC)
- **SCR-32 drawer** closes on Esc; **SCR-34 invite dialog** closes on Esc. ✅
- **Follow-ups for React:** entity-type badges are icon+**text** (never colour-only) ✅ already; but add `aria-live` result-count announcements to the SCR-35 filter/search and SCR-34 invite validation (specced, not in fixture DC). Focus-return on dialog close should be confirmed in the real `Dialog` primitive.

### 1.4 Empty / loading / error states 🟡
- **Built:** SCR-32 gate has a live **approved** state; SCR-34 has the **Invited** member state + Coming-soon tab state.
- **Not built into the DCs (specced only):** dashboard empty ("not assigned to any plans"), hub empty ("no plans yet"), and loading skeletons / error retry banners for all four. Archetypes exist in `Pages/SCR-MOBILE-Gallery` + `EmptyState`/`SkeletonLoader` component patterns — lift them in. **This is the #1 pre-handoff design task.**

### 1.5 Component consistency ✅
- Identical `:root` token block across all four (verified byte-consistent): `--action:#111`, `--gate:#d97706` + `--gate-bg`, `--done:#059669`, `--blocked:#b91c1c`, `--r-*` radii, Inter + Geist Mono.
- Identical `lu-ic` shadow-DOM icon component (the crash-safe pattern from the galleries).
- Shared chrome: 56 px rail, chat dock ("… · not yet wired" honesty pill), IntelligencePanel (320 px) on Workspace/Dashboard/Hub; Settings correctly omits the panel (utilitarian admin surface).
- **StatusChip is consistent but intentionally two enums:** *task status* (todo/in_progress/blocked/done/cancelled — SCR-32) vs *instance status* (draft/planned/active/blocked/completed/archived/cancelled — SCR-33/35). Both render as the same pill; documented in §3 of `planner.md`.

### 1.6 Design-token usage ✅
- No raw hex outside the `:root` block for structural colour; Geist Mono on every number (counts, dates, durations, KPI values). Amber is **border/tint only** for at-risk (never a filled amber panel), matching DESIGN.md v3.

---

## 2. Four-screens-as-one-workflow review ✅

Walked **Hub → Dashboard → Workspace → Settings** as a single flow:

| Transition | Mechanism | Consistent? |
|---|---|---|
| Hub → Workspace | plan card → `/app/planner/[id]` (default_view) | ✅ card anatomy = Shoots List |
| Dashboard → Workspace | KPI card / recent-plan card deep-links pre-filtered | ✅ |
| Workspace → Settings | header gear icon → `[id]/settings` | ✅ breadcrumb returns |
| Hub/Dashboard split | Hub = "what plans exist"; Dashboard = "what's mine" | ✅ distinct, per SCR-35 spec |

- **Terminology:** "phase" (workflow stage w/ gate) vs "task" (StatusChip unit) used consistently; "instance/plan" interchangeable but always visible as a plan card. "Gate" always = phase approval.
- **Icons:** entity types stable across Hub + Dashboard (clapperboard=shoot, megaphone=campaign, briefcase=crm_deal).
- **Spacing/rhythm:** 26 px main padding, 14 px card gaps, 320 px panel — identical across the three panelled screens.
- **AI voice:** all four docks follow the golden-teammate rule (greeting + the single most useful next action), and all carry the `production-planner · not yet wired` honesty pill.

---

## 3. Linear verification (IPI-476–483)

Grounded in the merged PR #283 schema + the four `uploads/SCR-3x-*.md` acceptance criteria. **✅ represented · 🟡 partial/deferred-by-design · ⚪ backend-only (nothing for design to show).**

| Issue | What it covers | In the prototypes? |
|---|---|:--:|
| **IPI-476** Schema (instances/tasks/phases/assignments, enums, `dependency_type`) | data model | ⚪ backend — but every enum/label in the DCs matches PR #283 (§3 `planner.md`); no invented status values |
| **IPI-477** Seeded workflow templates | "New plan" template picker | 🟡 CTA present (Hub + Workspace empty-state), picker itself deferred (SQL-seeded v1) |
| **IPI-478** Workspace + Kanban (AC-A views, AC-B drag updates phase_id+status, gates) | SCR-32 | ✅ Timeline/Kanban/Calendar/List all render; **Kanban columns = phases** (AC-B), task StatusChip on cards, gate locks column; gate drawer = Approve·Edit·Discard (verified) |
| **IPI-479** Role-based views + assignments (AC-C invite, AC-F gate ownership) | SCR-33 + SCR-34 | ✅ Dashboard role-conditional KPI slots documented; Members tab = access-role table + Invite dialog; gate ownership noted as per-workflow, **not** a per-member toggle |
| **IPI-480** Real-time | live updates | ⚪ backend — no design surface (activity feed is the display) |
| **IPI-481** Notifications | SCR-34 Notifications tab · reuses SCR-15 | 🟡 **placeholder tab only** (aria-disabled "Soon") — correct per spec MVP scope |
| **IPI-482** Agent (`production-planner`) | chat dock | 🟡 dock present on 3 screens, explicitly labelled "not yet wired" (future architecture) |
| **IPI-483** Dependency / gate engine | timeline slip, gate flow | 🟡 **visualised** (Item delivery at-risk +2d slip, gate badges, Approve→unlock) on fixtures; engine is backend |

**No invented features.** The two things that could look invented were checked and corrected earlier: (1) Kanban is phase-columns per AC-B (not task-status columns); (2) the gate contract is Approve·Edit·Discard (no invented Reject/Request-changes); (3) Members is **access-role only** — `production_role` is verified ABSENT from PR #283 and is Dashboard-display-only.

**Flagged gaps (not missing work — tracking honesty):**
- **SCR-35 Hub has no Linear issue.** Spec says open **PLN-009** (or fold into IPI-479) before implementation. Do not build React against it until tracked.
- **Workflow / Danger tabs (SCR-34)** have no ACs — shipped as disabled placeholders only, by design.

---

## 4. React implementation handoff

### 4.1 Screen inventory
| SCR | Route | React entry (per spec) | Agent |
|---|---|---|---|
| 32 | `/app/planner/[instanceId]` (+embeds Shoot schedule tab) | `PlannerWorkspace.tsx` · `planner/[instanceId]/page.tsx` | production-planner |
| 33 | `/app/planner/dashboard` | `RoleDashboard.tsx` · `planner/dashboard/page.tsx` | production-planner |
| 34 | `/app/planner/[instanceId]/settings` | `PlannerSettings.tsx` · `InviteMemberDialog.tsx` | — (CRUD) |
| 35 | `/app/planner` | `planner/page.tsx` (new) | production-planner |

### 4.2 Component inventory (reuse first)
- **Reused as-is:** OperatorShell (56 px rail), `PersistentChatDock`, `IntelligencePanel`, `StatusChip`, `EmptyState`, `SkeletonLoader`, shadcn `Tabs`/`Dialog`/dropdown, `ShootCard` anatomy (Hub/Dashboard cards), KPI stat-card (from SCR-25).
- **New composites (no new primitives):** Gantt **TimelineGrid** (phase rows × week columns, gate diamonds, today line) — the one genuinely new build; **PhaseGateDrawer** (Approve·Edit·Discard); Kanban board = reskin of `SCR-30-CRM-Pipeline` with phase columns; **WeekStrip** (Dashboard upcoming); **MemberTable** (§5F table conventions).

### 4.3 Interaction specs
- **Workspace view switch** — Timeline/Kanban/Calendar/List toggle; List is a **transient** mode (not persisted); default from `view_configs.default_view`.
- **Phase → drawer** — click bar/label opens right drawer; gate phases show the Approve·Edit·Discard card; Approve → next phase unlocks (optimistic, then `commitSchedule` writes).
- **Kanban drag (AC-B)** — dragging a card sets both `phase_id` **and** `status`; gated column requires approval to enter; optional status **filter** (not columns).
- **Dashboard KPI cards** — each deep-links into Workspace pre-filtered.
- **Hub** — type filter (shoot/campaign/crm_deal) + status + search; "New plan" → workflow-template picker (not a wizard).
- **Settings** — Invite dialog (email + access-role + preset), Esc-close, focus-return; row menu = change role / remove (remove = confirm step); disabled tabs are focusable + announce "Coming soon".

### 4.4 State specs (design the missing states before/with React)
Per screen: **loading** (skeletons), **empty** (Dashboard: "not assigned to any plans" + owner-only invite CTA; Hub: "no plans yet" + New plan), **populated**, **error** (inline retry banner). SCR-34 adds **invite-pending** (Invited chip ✅ built) + **invite-error** (inline under email field). SCR-32 adds **gate-approved** (✅ built).

### 4.5 Responsive behavior
- Desktop >1280 = as built. Tablet 768–1280 = IntelligencePanel → BottomSheet, grids drop a column, Settings permissions column → expandable row. Mobile <768 = **Dashboard is the default Planner landing**; Timeline→vertical week list, Kanban→stage accordion, Hub/Settings→single-column stack. Patterns proven in `Pages/SCR-MOBILE-Gallery`.

### 4.6 Fixture data
All fixtures are in each DC's `renderVals()` (phases PH[], tasks TK[], plans, members, week). One coherent sample plan — **"Summer Lookbook"**, 11 phases, Item delivery at-risk (+2 day slip), Outfit-confirmation gate ready — runs across Workspace + Dashboard + Hub so the narrative is consistent. Replace with `planner.*` table reads; enums already match.

### 4.7 Open questions for eng
1. **PLN-009** — open a Linear issue for SCR-35 Hub before implementing (or fold into IPI-479).
2. **Calendar view** — multi-day status bars vs simple event chips? Fixture shows chips; confirm against IPI-478.
3. **Role-conditional Dashboard** — exact stat set per persona (Producer→budget gates, Client approver→only their gates) resolved server-side (IPI-479 AC-F); design has labelled slots, needs the real persona→stat map.
4. **Notifications tab** — when IPI-481 lands, does it live as a tab here or route to SCR-15? Spec is non-committal.
5. **Nav active-state** for SCR-34 (Planner vs Settings rail item) — pick one convention.

---

## 5. Final audit verdict

🟢 **Planner design prototype is complete and handoff-ready** at **86/100 average.** Four screens, one coherent workflow, all enums/labels schema-true, zero invented features, all interactions verified live. The single systematic gap is **empty/loading/error states not yet built into the four DCs** (they're specced) — do that one design pass, and open PLN-009 for the Hub, before frontend starts.
