# Planner — Mobile & Tablet Implementation Plan

> **Planning doc — no prototype edits yet.** Defines how SCR-32–35 reflow to tablet and mobile, grounded in the shipped Planner desktop system (`planner.md`, `navigation.md`, `planner-final-qa.md`) and the **proven mobile patterns** already in the design system: `Pages/SCR-MOBILE-Gallery.dc.html` (booking) and `crm/SCR-MOBILE-CRM-Gallery.dc.html`. Reuse those patterns; invent nothing new.

Baseline: **390 px** mobile, **768–1279 px** tablet, **≥1280 px** desktop (current build). Fixtures only.

> **Build status (increment 2):** `Pages/SCR-MOBILE-Planner-Gallery.dc.html` now ships the shared chrome (app bar · composer · tab bar) + adaptive bottom sheet across all four frames, **and** the full SCR-32 Workspace view set — **Timeline** (vertical week list), **Kanban** (phase accordion, tap headers to expand/collapse), **Calendar** (7-col March grid w/ status dots + legend), **List** (task cards w/ status chips). View toggle is a live segmented control. The Workspace frame also carries a live **state switcher** (Default · Loading · Empty · Error · Offline) demonstrating §13.1 layout-matched skeleton (shimmer), §13.2 offline strip (content stays read-only) + empty/error+retry, plus a global `prefers-reduced-motion` guard. **§13.3** Timeline now has **collapsible weeks** (completed weeks default-collapsed, tap to expand) + a sticky **Today / Next approval** control row (Next approval jumps to + opens the gate sheet). **§13.4** the Workspace composer carries the expanded assistant quick-action chips (What's next? · Blocked tasks · Dependencies · Explain delay · Today only). **All four frames** now carry the full state matrix (Default · Loading · Empty · Error · Offline) via a per-frame state switcher, each with a layout-matched skeleton (plan-card / KPI-grid / member-row) and **§13.9 empty-state copy. Built as one shared `fstateFields()` helper + generic `f.*` chrome. Plan bottom sheet is now decision-oriented (progress · 4-row meta · AI summary · recommended action · Open Workspace + Timeline/Approval/Ask) and each frame owns its own sheet state (no cross-frame bleed). Verified at 390 px, 0 template holes.** Remaining: the tablet (960–1279) breakpoint.

---

## 1. Proven patterns to reuse (from existing galleries)
- **Bottom tab bar** 56px + safe-area inset; icon + label; active tint.
- **Top app bar** — title (+ back chevron on detail), one trailing action (Insights/filter).
- **Persistent AI composer** docked above the tab bar, expandable to a near-full sheet.
- **BottomSheet** (drag handle, snap points, backdrop) — the mobile form of the adaptive right panel.
- **Pipeline/columns → stage accordion** (collapsible sections) — the one hard reflow, already solved in CRM mobile.
- **Single-column cards**, **week-strip** date selector, **sticky CTA** above safe-area.

**Core rule (carried from §2A):** on mobile the adaptive right panel becomes **one bottom sheet** — Intelligence by default, swapped to the selected entity's detail. **Never a fourth panel.**

---

## 2. Step 1 — Mobile-readiness audit (per screen)

### SCR-32 Workspace
| Element | Verdict |
|---|---|
| 3-panel grid (56·1fr·340) | ❌ desktop-only → single column + bottom-sheet panel |
| Timeline Gantt (760px min-width) | ❌ overflows → **vertical week list** (phases grouped by week, mini status bars) |
| Kanban (phase columns) | ⚠ dense → **phase accordion** (reuse CRM pattern) |
| Calendar (7-col month) | ⚠ → month view stays but scrolls; day-tap → sheet |
| List table (7 cols) | ❌ → **task cards** (title, phase chip, owner, dates, status) |
| Phase/task detail (right panel) | → **bottom sheet** (gate box + tasks) |
| Intelligence panel | → default bottom-sheet content |
| View toggle (Timeline/Kanban/Cal/List) | ✅ → horizontally-scrollable segmented control |
| Chat dock | → persistent composer above tab bar |
| Read-only / sync-failed banners | ✅ reflow (full-width) |
| Loading/empty/error | ✅ reflow (centered) |

### SCR-33 Dashboard
| Element | Verdict |
|---|---|
| 4-col KPI grid | ❌ → **1-col (or 2×2) KPI cards** |
| Recent plans (3-col) | ⚠ → **horizontal snap-scroll cards** |
| Upcoming week (7-col) | ❌ → **vertical day list** |
| Intelligence panel | → bottom sheet ("what needs attention") |
| Greeting | ✅ |

### SCR-34 Settings
| Element | Verdict |
|---|---|
| Members table (4-col grid) | ❌ → **stacked member cards** (avatar, name, role chip, tap → detail) |
| Member detail (right panel) | → **bottom sheet** |
| Invite dialog (440px modal) | ⚠ → full-width mobile dialog (or bottom sheet) |
| Tab strip (Members + Soon) | ✅ scrollable |
| Access summary (panel) | → bottom-sheet default |

### SCR-35 Hub
| Element | Verdict |
|---|---|
| Card grid (4-col) | ❌ → **1-col plan cards** |
| Filter chips + search | ⚠ → compact filter row (chips scroll; search collapses to icon → expands) |
| Plan detail (right panel) | → **bottom sheet** + Open Workspace |
| Cross-plan summary (panel) | → bottom-sheet default |
| New plan button | ✅ → sticky or app-bar action |

---

## 3. Step 2 — Wireframes (low-fi)

**Shared mobile chrome**
```
┌───────────────────────────┐
│ ‹  Summer Lookbook    ⓘ    │  top app bar (title · Insights)
├───────────────────────────┤
│                           │
│      screen content       │  single column, scrolls
│                           │
├───────────────────────────┤
│ ✦ Item delivery at risk … │  persistent composer (tap → sheet)
├───────────────────────────┤
│ ⌂    📅    ▤    ✉    ⚙    │  bottom tab bar (56 + safe-area)
└───────────────────────────┘
```

**SCR-32 Timeline → vertical week list**
```
WEEK 1 · Mar 2 ───────────────
● Brief            done   ▓▓▓▓
● Casting     ◆ done       ▓▓▓
WEEK 2 · Mar 9 ───────────────
● Soft hold   in prog  ▓▓░░ 60%
● Item deliv. ⚠ risk   ▓░░  +2d →   ← tap
…
[Timeline ▾][Kanban][Calendar][List]  ← segmented, scrolls
```

**SCR-32 Kanban → phase accordion** (reuse CRM)
```
▸ Brief (1)              done
▾ Item delivery (2)    ⚠ at risk
   ┌ Sample pull — 24 looks  in prog ┐
   └ Courier inbound         blocked ┘
▸ Outfit confirmation 🔒  gate
```

**Adaptive panel → bottom sheet** (phase selected)
```
╭──────── drag ────────╮
│ ‹ Intelligence     ✕ │
│ [at risk] Mar 17–18  │
│ Outfit confirmation  │
│ ◆ Approval gate      │
│ [Approve][Edit][🗑]   │
│ Tasks · 1            │
╰──────────────────────╯   backdrop dims workspace
```

**SCR-33 Dashboard mobile**
```
Good morning, Maya
[My Tasks 12][Needs Appr 2]
[At Risk 3][Due Today 4]     2×2 KPI
Recent plans  →→ (snap scroll)
[Summer][SS26][Nike]
Upcoming ─ Mon 9 · Soft holds
          Tue 10 · Sample pull ⚠
✦ composer   ·  ⌂ 📅 ▤ ✉ ⚙
```

**SCR-34 Settings mobile**
```
‹ Summer Lookbook · Settings
[Members][Notifications ·soon]
┌ MC  Maya Chen      owner ┐ → sheet
┌ JA  Jon Alvi     manager ┐
┌ DK  dana@…  viewer ·invited┐
[+ Invite member] (sticky)
member detail / invite → bottom sheet
```

**SCR-35 Hub mobile**
```
Planner        12 plans · 3 ⚠   [+]
[All][Shoot][Campaign][Deal] 🔍
┌ Summer Lookbook  ⚠ Shoot  27% ┐ → sheet
┌ Q3 Retail Push   Campaign 44% ┐
plan detail sheet: status·dates·[Open Workspace →]
```

**Tablet (768–1279) — panel → slide-over sheet**
```
┌──┬───────────────────────┬(sheet)┐
│56│  workspace (full width)│ ⓘ tab │  right panel collapses to an
│  │                        │ opens │  edge toggle; opens as an
│  │                        │ over  │  overlay sheet (Intelligence
└──┴───────────────────────┴───────┘  OR detail — never both)
```

---

## 4. Step 3 — Mobile UX rules
- **Breakpoints:** `≥1280` 3-col grid · `768–1279` workspace + edge-toggle slide-over sheet · `<768` single column + bottom sheet + tab bar.
- **Navigation:** scoped rail → **bottom tab bar** (Home · Planner · Dashboard · Notifications · Settings); active tint + `aria-current`. Global-rail entry unchanged on desktop.
- **Bottom sheet:** drag handle; snap points (peek ~40% / full ~92vh); backdrop tap or swipe-down closes; Esc closes; returns to Intelligence on close. One sheet only.
- **Touch/keyboard:** ≥44px targets; native controls; on-screen keyboard must not cover the composer (sheet lifts with `env(keyboard-inset)` / viewport resize).
- **Sticky headers:** app bar sticky top; primary CTA (New plan / Invite / Confirm) sticky above safe-area.
- **Horizontal scroll:** only view-toggle segmented control + recent-plan cards + filter chips — with a peek affordance; never the whole layout.
- **Long content:** timelines/lists virtualize conceptually; accordions default-collapse completed phases.
- **Safe-area:** `env(safe-area-inset-bottom/top)` on tab bar, composer, sticky CTAs.
- **Reduced-motion:** `@media (prefers-reduced-motion)` disables shimmer + sheet spring; use fades.
- **Focus:** opening a sheet moves focus to its header; closing restores focus to the trigger; focus trapped in invite dialog.

---

## 5. Step 4 — Planner Assistant on mobile
One **adaptive bottom sheet** (no 4th panel). Contents:
- **Contextual prompt** in the docked composer (route-aware: "Item delivery is 2 days behind — reschedule?").
- **"What needs attention"** summary list (gates awaiting, at-risk phases) as the default sheet content.
- **Next-action buttons** (Approve gate · Reschedule · Draft update) — tap runs the sample flow + toast.
- **Task explanation / approval guidance** — selecting a phase swaps the sheet to its detail (gate box + why).
- **Return-to-context:** closing the sheet returns to Intelligence and restores scroll position.

---

## 6. Step 5/6 — Responsive behavior matrix

| Screen | Desktop | Tablet | Mobile |
|---|---|---|---|
| SCR-32 | 3-panel; Gantt scrolls-X | workspace + slide-over sheet | vertical week list / accordion / task cards; panel = sheet |
| SCR-33 | 4-col KPI + 3-col plans + 7-col week | 2-col KPI; panel toggle | 2×2 KPI; snap-scroll plans; day list; sheet |
| SCR-34 | table + member detail panel | table + slide-over | stacked cards; detail + invite = sheet/dialog |
| SCR-35 | 4-col cards + plan panel | 2-col + slide-over | 1-col cards; detail = sheet |

**State matrix** carries over unchanged (loading/empty/error/read-only/permission-denied/sync-failed/success) — banners full-width, empty/error centered, toasts above the tab bar.

---

## 7. Per-screen mobile task list (after approval)
- **SCR-32 (L):** week-list Timeline · phase-accordion Kanban · task-card List · panel→sheet · segmented view control · composer dock.
- **SCR-33 (M):** 2×2 KPI · snap-scroll plans · day list · Intelligence sheet.
- **SCR-34 (M):** stacked member cards · detail sheet · mobile invite dialog.
- **SCR-35 (M):** 1-col cards · compact filter/search · plan detail sheet.
- **Shared (S):** bottom tab bar + top app bar chrome; safe-area; reduced-motion; sheet component (reuse gallery BottomSheet).

Likely delivery: **one `Pages/SCR-MOBILE-Planner-Gallery.dc.html`** (all four as 390px frames sharing chrome), mirroring the booking/CRM galleries — cheaper and more consistent than four separate mobile files.

---

## 8. Accessibility checklist (mobile)
- ≥44px targets · native `<a>`/`<button>` · `aria-current` on tab bar.
- Sheet: focus to header on open, restore on close, Esc + swipe-down close, `aria-modal`.
- Status by text+icon, not color alone · `aria-live` toasts above tab bar.
- `prefers-reduced-motion` honored · keyboard-inset handling so composer stays visible.
- Logical DOM order (content before chrome) for screen readers.

---

## 9. Deviations from desktop (recorded)
- Timeline Gantt is **replaced** (not scaled) by a week list on mobile — the only structural divergence.
- Kanban becomes an accordion (columns don't fit).
- The right panel is a **sheet**, not a persistent column — same content, different container.
- List table → cards.
- Tablet keeps the workspace full-width and makes the panel a **slide-over**, not a bottom sheet.

---

## 10. Recommended implementation order
1. **Shared mobile chrome + BottomSheet** (reuse gallery components) — unblocks all four.
2. **SCR-35 Hub** (simplest; entry point) → **SCR-33 Dashboard** → **SCR-34 Settings** → **SCR-32 Workspace** (hardest: Timeline/Kanban reflow last).
3. Assemble as one mobile gallery; verify at 390 + tablet 768.

## 11. Remaining design gaps
- Mobile Planner not yet built (this plan unblocks it).
- SCR-35 has no Linear issue (**PLN-009**).
- DC-screen dead rails (SCR-09/15/18/20).
- Minor a11y: arrow-key phase nav, invite dialog focus-trap, reduced-motion (also applies to mobile).

---

## 12. Suggested next steps (priority)
1. **Approve this plan**, then build the **shared mobile chrome + Hub** first (fastest visible win).
2. **Open Linear PLN-009** for SCR-35 — 5-min unblock; do before any React.
3. **Functional pass on the 4 dead DC rails** (SCR-09/15/18/20) — quick consistency fix.
4. **Minor a11y fixes** (arrow-key nav, focus-trap, reduced-motion) — fold into the mobile build.
5. **Freeze the 4 desktop prototypes** once mobile is built → **prepare React handoff** (specs already in `planner-qa-handoff.md`).
6. **Begin React implementation** only after PLN-009 is open and mobile is designed.

**Recommendation:** approve → build shared chrome + Hub mobile first, open PLN-009 in parallel. Hold React until desktop+mobile are frozen.

---

## 13. Audit refinements (adopted)

External review scored this 95/100; the following refinements are folded in. **MVP** = build now; **Deferred** = new feature / needs backend, recorded not designed.

**13.1 Tablet split (MVP)** — split `768–1279` into **768–959 "Mobile XL"** (single column + bottom sheet, like mobile) and **960–1279 "Tablet"** (workspace + a **narrow persistent right panel ~300px** where width allows, else slide-over sheet). The persistent panel is preferred over a sheet at ≥1024px.

**13.2 Offline / sync states (MVP, extends the matrix)** — add to the workspace state set: **reconnecting** (subtle top strip), **queued changes** (badge "N pending"), **offline** (banner + writes disabled → toast), **sync complete** (transient toast). These extend the existing `sync-failed` banner; same treatment language.

**13.3 Timeline mobile navigation (MVP)** — the vertical week list gets **collapsible weeks** (completed weeks default-collapsed), a **Today** shortcut, **Jump to current phase**, and **Jump to next approval** — a small sticky control row above the list. Reduces scrolling on long plans.

**13.4 Assistant quick actions (MVP)** — expand the default chips to: **What's next? · Show blocked tasks · Show dependencies · Explain delay · Today only** (plus the existing Approve / Reschedule / Draft update). All run sample flows + toast.

**13.5 Plan-card interactions (MVP tap; long-press Deferred)** — **Tap → detail bottom sheet** (MVP). **Long-press → context menu** with **pin / favorite** (MVP-safe, local) and **duplicate / archive / share** (**Deferred** — mutate data / need backend; show as disabled "coming soon" in the menu, not wired).

**13.6 Layout-matched skeletons (MVP)** — replace generic shimmer with per-surface skeletons: **KPI**, **plan-card**, **Timeline-row**, **member-row**, **task-card**. (SCR-33 already uses layout-matched; generalize to all four.)

**13.7 Search UX (MVP)** — Hub search defines: **clear (✕) button**, **no-results state** ("No plans match — clear filters"), and **recent searches** on focus. **Voice search = Deferred.**

**13.8 BottomSheet behavior (MVP spec)** — remember previous height per surface; drag thresholds (>30% travel or >0.5 px/ms velocity commits the snap); sheet persists on rotation; **nested scrolling** — inner list scrolls first, sheet drags only when the list is at its top edge.

**13.9 Empty-state next action (MVP — confirm)** — already in the plan; standardize the copy: Workspace → **Create your first task** · Hub → **Create your first plan** · Dashboard → **Nothing due — browse plans** · Settings → **Invite your first collaborator**.

**13.10 First-run coaching (Deferred)** — a 3–4 step coach-mark tour (Plans → Timeline → Assistant → Approvals) on first mobile launch. Recorded; not MVP (needs a dismissable-once mechanism + copy sign-off).

### 13.11 Interaction matrix (MVP)
| Action | Result |
|---|---|
| Tap plan card | Open plan detail sheet |
| Tap phase / task | Open detail sheet (gate + tasks) |
| Tap KPI / recent plan | Navigate |
| Swipe-down sheet / backdrop / Esc | Close sheet → return to Intelligence |
| Long-press plan card | Context menu (pin/favorite live; duplicate/archive/share deferred) |
| Pull-to-refresh | Refresh planner (sample) |
| Swipe card horizontally | None (no destructive swipe) |

### 13.12 Gesture rules (MVP)
- **Swipe:** vertical only on sheets (down = dismiss); no horizontal card swipe actions.
- **Drag:** sheet handle (snap points); no drag-reorder on mobile MVP.
- **Long-press:** plan-card context menu only.
- **Pull-to-refresh:** list/dashboard top.
- **Pinch:** none.
- **Horizontal scroll:** view-toggle segmented control, recent-plan cards, filter chips only (with peek).
- **Edge-swipe:** reserved for OS back; app doesn't intercept.

### 13.13 Future (recorded, out of MVP)
Push-notification deep links · home-screen widgets · Live Activity / Dynamic Island · **offline editing** (vs. read-only offline in 13.2) · voice Planner · Apple Pencil / tablet annotations.

> With 13.1–13.13 folded in, this plan supersedes the 95/100 review scope. State-matrix additions (13.2) and the interaction/gesture matrices (13.11–13.12) become part of the per-screen build checklist in §7.

---

## 14. Implementation-guidance refinements (98/100 review — adopted)

All eight are implementation guidance, not structural change; folded in verbatim where useful.

### 14.1 Animation timing (default motion)
| Element | Open / In | Close / Out |
|---|---|---|
| Bottom sheet | 220 ms | 180 ms |
| Accordion (phase/week) | 180 ms expand | 140 ms collapse |
| Navigation (fade/slide) | 150–200 ms | — |
| Toast | 150 ms in, hold 3 s, 150 ms out | |
Easing: standard `cubic-bezier(.2,0,0,1)`. All disabled under `prefers-reduced-motion` (→ instant/fade). These are *defaults* — the reduced-motion guard in 13.x still wins.

### 14.2 Component ownership
| Component | Shared (Design V2) | Planner-specific |
|---|:--:|:--:|
| BottomSheet | ✅ | |
| KPI Card | ✅ | |
| SkeletonLoader / EmptyState / ErrorState | ✅ | |
| Banner (read-only / sync / offline) | ✅ | |
| Tab bar · app bar · composer | ✅ | |
| Task Card | | ✅ |
| Phase / Week row (Timeline) | | ✅ |
| Gate box (Approve·Edit·Discard) | | ✅ |
| Planner Assistant (context prompts) | | ✅ |
| View segmented control | | ✅ |

### 14.3 Design tokens — reference, don't restate
Spacing, elevation/shadow, radius, and animation come from **Design V2 tokens** (`tokens.css`). This doc references them by role (`--r-md`, `--muted-bg`, etc.) and does **not** define new values. Any value that looks new is a bug to reconcile against Design V2, not a new token.

### 14.4 Planner Assistant persistence
When the assistant sheet closes and reopens **within the same screen session**, these survive: **selected task/phase context · conversation history · last sheet height · draft (unsent) prompt · active filters**. Cleared on screen change or plan switch. (Fixture behavior now; real persistence is a React/store concern.)

### 14.5 Tablet panel behavior (concrete)
- **768–959 px (Mobile XL):** single column; context = **bottom sheet**.
- **960–1023 px:** workspace + context as **slide-over** sheet (overlay, dismissible).
- **1024–1279 px:** workspace + **persistent right panel (~300 px)**; no overlay.
- **≥1280 px:** full desktop 3-panel (56 · 1fr · 340).

### 14.6 Performance expectations (scale, not design)
Design assumes the implementation supports: **500+ tasks · 100+ phases per plan · virtualized/long lists · incremental rendering** of Timeline/Kanban/List. Accordions default-collapse completed weeks/phases to bound initial render. No design change — sets the scale contract.

### 14.7 Assistant loading / generation states
While the assistant works: **typing indicator** (three-dot) → **streaming response** (token-by-token) → **Cancel generation** control during stream → **Retry** on failure. Mirrors the desktop chat-dock treatment; keeps the AI feeling responsive.

### 14.8 Design constraints (guardrails)
**Do not:** create a fourth panel · duplicate navigation · introduce new status values (use the frozen enums) · replace existing Design V2 components · invent Planner entities or backend features. These bound every future Planner iteration, mobile or desktop.
