# SCR-32 Planner Workspace — 8-Step Design Workflow

> **Template run.** This doc applies the mandated 8-step process to SCR-32 as the reference pattern for SCR-33/34/35. Design-lane only — fixtures, no backend. Prototype: `Pages/SCR-32-Planner-Workspace.dc.html`.

---

## Step 1 — Review (sources consulted)
- **Existing shell:** SCR-25 AI-Native Dashboard + CRM 3-panel operator screens (56px rail · main · 320px Intelligence).
- **Design V2:** `DESIGN.md` — Zeely Editorial tokens, Inter/Geist Mono, status-chip system, gate/at-risk color language.
- **Supabase design reference:** `planner.instances` / `phases` / `tasks` / `dependencies`; enums (instance status, task status `todo·in_progress·blocked·done·cancelled`, `dependency_type`); `view_configs` = timeline·kanban·calendar (list = transient).
- **Linear:** IPI-476 (Timeline), 477 (Calendar), 478 (Kanban — **task-status? No: phase columns per AC-B**), 479 (Dashboard/Settings), 481 (notifications), 482 (assistant).
- **Prior Planner screens:** none before this — SCR-32 is the flagship the others reuse.

## Step 2 — Analyze
- **User goals:** see the whole shoot at a glance; spot slippage; act on approval gates; switch lens (timeline/kanban/calendar/list) without losing context.
- **Primary workflows:** scan timeline → click a phase → review tasks + gate → Approve/Edit/Discard → downstream unlocks. Ask the assistant to reschedule.
- **Required data:** phases (status, span, gate, progress, milestone), tasks (phase, status, owner, dates, dur, priority), approvals queue, AI slip evidence.
- **Edge cases:** unset plan (no phases); fetch failure; viewer with no approve rights; offline edit that can't sync; gate already approved.
- **Reusable components:** rail nav, IntelligencePanel, chat dock, status chip, gate diamond, drawer, toast.

## Step 3 — Low-Fidelity Wireframes

**Desktop (≥1280) — 3-panel**
```
┌──┬───────────────────────────────────────────┬──────────────┐
│56│ Summer Lookbook  [Active][Sample]   Role ▾ ⚙ │ INTELLIGENCE │
│  │ [Timeline][Kanban][Calendar][List]  legend  │ Context      │
│⌂ │ ─────────────────────────────────────────── │ AI insight   │
│▣ │  Phase        │ W1  W2 │TODAY│ W3  W4  W5    │ Evidence     │
│▤ │  Brief        │████    │     │               │ Approvals(1) │
│✉ │  Casting  ◆   │ ███████│     │               │  Outfit →    │
│⚙ │  Item deliv.  │   ▓▓▓▓▓│risk │               │              │
│  │  Outfit    ◇  │        │ ◇   │               │              │
│  │ ─────────────────────────────────────────── │              │
│  │ ✦ assistant prompt … [input ................▲]│              │
└──┴───────────────────────────────────────────┴──────────────┘
```

**Tablet (768–1279)** — Intelligence panel collapses to a right-edge toggle (slides over as a drawer); main + rail persist; timeline horizontal-scrolls.

**Mobile (<768)** — single column: app bar (title + role + ⚙), view toggle becomes a segmented control that horizontally scrolls, timeline → vertical phase list with mini bars, Intelligence → bottom sheet, chat dock pinned above safe area, drawer → full-screen sheet.

## Step 4 — UX Review (issues found → resolved)
- **Gate discoverability** — a diamond alone is cryptic → added lock glyph on gated phase labels + "1 gate awaiting approval" in subhead + Approvals card in panel. ✅
- **View-switch memory** — switching views shouldn't lose the selected phase → `selected` persists across views; drawer reopens on same phase. ✅
- **Legend overload** — 5 legend chips risk clutter → kept single-row, muted, 11px. ✅
- **Approval reversibility** — approve is consequential → confirmation is the drawer itself (explicit Approve button + requirement line "Requires: Producer or Owner"), success toast, no accidental one-tap in list. ✅
- **A11y** — phase rows are click targets → each has cursor + hover bg; Esc closes drawer; toast is `aria-live`. ✅

## Step 5 — High-Fidelity (reused, not invented)
Shell, rail, tokens, icon set (`lu-ic` shadow-DOM Lucide), IntelligencePanel, chat dock, status-chip system — all lifted from existing screens. No new visual patterns. Kanban = **phase columns** (per IPI-478 AC-B), gate contract = **Approve · Edit · Discard** (not Reject/Request-changes).

## Step 6 — Interactive States (all built + verified in the DC)
Exposed as Tweaks (`screenState` enum, `role` enum, `syncFailed` toggle) so every state is demonstrable.

| State | Trigger | Treatment | Verified |
|---|---|---|:--:|
| **Default** | live | Timeline with 11 phases, today line, gate diamonds | ✅ |
| **Selected** | click phase | Drawer: status, dates, gate box, task list | ✅ |
| **Hover** | pointer on phase/task | row bg → `--muted-bg`; buttons `a:hover` opacity | ✅ |
| **Loading** | `screenState=loading` | shimmer skeleton (17 blocks: label + bar rows) | ✅ |
| **Empty** | `screenState=empty` | "No phases yet" + Draft-a-plan CTA | ✅ |
| **Error** | `screenState=error` | "Couldn't load this plan" + Try again (→ live) | ✅ |
| **Read-only** | `role=viewer` | grey banner; gate buttons replaced by "Viewer access" note | ✅ |
| **Permission denied** | viewer taps Approve | toast "Viewer access — approvals are disabled" | ✅ |
| **Success** | approve gate | green drawer banner + toast "Gate approved — Payment & scheduling unlocked" | ✅ |
| **Sync failed** | `syncFailed=true` | red banner "Changes couldn't sync" + Retry now | ✅ |

## Step 7 — Interaction Flow
- **Click** — phase bar/label or kanban card or list row → opens drawer on that phase. Approvals card → opens the outfit gate directly.
- **Navigation** — rail: Planner (active) ↔ Planner Dashboard ↔ Notifications ↔ Settings. ⚙ → SCR-34 Instance Settings.
- **Drawer** — opens right (388px overlay + scrim); Esc or scrim or × closes; Approve flips to success state and clears the approvals count.
- **Dialogs** — none (drawer covers gate); confirmation is inline in the gate box.
- **Keyboard** — Esc closes drawer; all controls are native `<button>`/`<input>` (tabbable). *(Follow-up: ←/→ to move phase selection — noted, not built.)*
- **Responsive** — see Step 3; Intelligence → toggle (tablet) → bottom sheet (mobile); timeline → vertical list (mobile).

## Step 8 — Final Review
- ✅ **Linear ACs** — Timeline/Kanban(phase cols)/Calendar/List present; gate = Approve·Edit·Discard; no invented buttons.
- ✅ **Supabase reference** — enums + view set + gate model match; no schema invented.
- ✅ **Design V2** — tokens, chips, icons, panel all reused.
- ✅ **Reuses components** — rail, panel, dock, chip, drawer, toast.
- ✅ **No backend features** — assistant marked "not yet wired"; data is fixtures ("Sample data — not live").
- ✅ **Consistent with peers** — same shell/tokens as SCR-33/34/35.

### Deliverables checklist
1. ✅ Low-fi wireframes (desktop/tablet/mobile) — Step 3
2. ✅ UX review notes — Step 4
3. ✅ Improved wireframes (issues folded into Step 3/5)
4. ✅ Hi-fi prototype — `Pages/SCR-32-Planner-Workspace.dc.html`
5. ✅ Interaction notes — Step 7
6. ✅ Responsive layouts — Step 3
7. ✅ Component inventory — rail nav · view toggle · timeline grid · kanban column · calendar grid · list table · status chip · gate diamond · phase drawer · gate box (Approve/Edit/Discard) · IntelligencePanel (context/insight/evidence/approvals) · chat dock · toast · skeleton · empty/error blocks · read-only + sync banners
8. ✅ Accessibility checklist — native buttons/inputs (tabbable) · Esc-close drawer · `aria-live` toast · ≥44px hit targets on primary actions · status conveyed by chip **text** not color alone · disabled states use note + icon, not color only · focus-visible via native outlines · *(follow-up: arrow-key phase nav; explicit `aria-label` on icon-only ⚙/role buttons)*

---
**Readiness: 90/100** — handoff-ready. Remaining polish: arrow-key phase navigation, `aria-label`s on the two icon-only header buttons.
