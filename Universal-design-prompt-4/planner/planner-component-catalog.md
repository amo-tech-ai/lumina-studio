# Planner — Component Catalog

> **Status: 🟢 FROZEN reference — 2026-07-10.** Inventory of every UI building block used across the four Planner desktop DCs + mobile gallery, with its React mapping. Companion to `planner-freeze.md`, `planner-copy-guide.md`, `planner-interaction-catalog.md`.
> **Scope:** `SCR-32` Workspace · `SCR-33` Dashboard · `SCR-34` Settings · `SCR-35` Hub · `SCR-MOBILE-Planner-Gallery`.
> **Rule for React:** *reuse first.* A component is either **REUSE** (already ships in the app), **REUSE+** (ships, needs a Planner variant/prop), or **NEW** (net-new to build). New components are the minority — see `planner-freeze.md` §7 for build order.

---

## 1. Design tokens (identical `:root` in all 5 files)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#fff` | Surfaces, cards |
| `--surface` | `#fafafa` | Rails, panels, insets |
| `--muted-bg` | `#f5f5f5` | Chips, avatars, tracks |
| `--border` / `--border-strong` / `--border-subtle` | `#e5e7eb` / `#d1d5db` / `#ededed` | Dividers, outlines |
| `--text` / `--text-2` / `--text-3` | `#111` / `#6b7280` / `#9ca3af` | Primary / secondary / tertiary |
| `--action` | `#111` | Primary buttons, active nav, focus ring |
| `--done` | `#059669` | Complete status |
| `--gate` / `--gate-bg` | `#d97706` / `#fef3e2` | **Approval** treatment (border/tint only — never a filled panel) |
| `--blocked` / `--lost` | `#b91c1c` | Blocked / error / at-risk text |
| `--font` / `--mono` | Inter / Geist Mono | Body / all numbers |
| `--r-sm…--r-pill` | 6 / 10 / 16 / 9999px | Radii scale |

**Rules:** all numbers use `--mono`; amber is border+tint only; no raw structural hex outside `:root`; status is always text+icon, never colour alone.

---

## 2. Shared shell & chrome

| Component | Where | React | Notes |
|---|---|:--:|---|
| **OperatorShell rail** (`.pl-shell` grid `56px / 1fr / panel`) | all 4 desktop | REUSE | 56 px icon rail; `aria-label="Primary"`; `aria-current="page"` on active. |
| **Nav item** (`<a>` icon + tooltip) | all 4 | REUSE | Home · Planner · Planner Dashboard · Notifications · Settings. Active = `--action` fill. |
| **Skip link** (`.pl-skip`) | all 4 | NEW (tiny) | `Skip to <region>` → `#pl-main`. |
| **Adaptive right panel** (`.pl-aside`) | 32/34/35 | REUSE+ | Swaps Intelligence ⇄ detail; becomes slide-over < 1024. |
| **Static Intelligence panel** | 33 | REUSE | Dashboard has no detail swap. |
| **Panel FAB** (`.pl-panel-fab`) | all 4 | NEW (tiny) | Shows < 1024 to open the slide-over. |
| **Scrim** (`.pl-scrim`) | all 4 | REUSE | Dismisses slide-over; `< 1024` only. |
| **Persistent chat dock** | all 4 | REUSE | AI line + honesty pill + suggested chips + composer. |
| **Honesty pill** (`production-planner · not yet wired`) | all docks | REUSE | Never over-claims live AI. |
| **Sample-data ribbon** (`Sample data — not live`) | all screens | REUSE | Amber tint pill. |
| **Toast** (`aria-live`, auto-dismiss 2.6 s) | all 4 | REUSE | Bottom-center pill. |
| **Live region** (`.pl-sr`, `aria-live=polite`) | 32/35 | NEW (tiny) | Announces step-nav + filter counts. |

---

## 3. Content components

| Component | Where | React | Notes |
|---|---|:--:|---|
| **TimelineGrid** (phase rows × week cols, gate diamonds, today line, at-risk bar, milestone marker, progress fill) | 32 | **NEW** | The one substantial build. Keyboard step-nav via arrow keys. |
| **KanbanBoard** (columns = phases; gated column = blocked drop-zone) | 32 | REUSE+ | Reskin of `SCR-30-CRM-Pipeline`; StatusChip on cards; gated column shows "Locked — approve to add". |
| **CalendarMonth** (7-col grid, event pills, today ring, legend) | 32 | REUSE | Legend uses "Approval" (not "Gate"). |
| **ListTable** (task rows, 7-col grid) | 32 | REUSE | StatusChip + owner avatar + mono dates. |
| **View switcher** (Timeline/Kanban/Calendar/List segmented) | 32 | REUSE | shadcn Tabs. |
| **Now & Next bar** (2 pinned priority cards) | 32 | REUSE+ | "Happening now" + "Your next approval". |
| **PhaseGateDrawer / gate card** (Approve · Edit · Discard) | 32 | **NEW** | Amber-bordered; role-gated (Viewer sees locked). |
| **KPI stat card** (value + delta + sub) | 33 | REUSE | From SCR-25; deep-links into Workspace. |
| **Start-Here card** | 33 | REUSE+ | First-use priority nudge. |
| **WeekStrip** (this-week schedule) | 33 | REUSE | Tappable rows. |
| **Plan card** (cover image, status chip, one-sentence status, progress bar) | 33/35 | REUSE+ | Risk-sorted; entity icon (Shoot/Campaign/CRM Deal). |
| **Attention band** (at-risk plans headline + quick links) | 35 | REUSE+ | P1 first-use feature. |
| **Type filter chips** (All/Shoot/Campaign/CRM Deal) | 35 | REUSE | Announces result count via live region. |
| **Plan detail panel** (progress, meta rows, Open Workspace) | 35 | REUSE | Right-panel detail swap. |
| **Invite-first hero** (role shortcut buttons) | 34 | REUSE+ | Producer / Contributor / Client approver. |
| **Pending-invite callout** (Resend) | 34 | REUSE | Amber tint. |
| **MemberTable** (avatar, role chip, perms, last-active) | 34 | REUSE+ | Access-role model only. |
| **Invite dialog** (email + role + preset; inline error; focus-trap) | 34 | REUSE+ | shadcn Dialog; validation + focus-return. |
| **Member detail panel** (role change, remove w/ confirm) | 34 | REUSE | Right-panel detail swap. |

---

## 4. State archetypes (uniform across screens)

| Archetype | React | Notes |
|---|:--:|---|
| **SkeletonLoader** (`.sk` shimmer) | REUSE | Respects `prefers-reduced-motion`. |
| **EmptyState** (icon + title + body + CTA) | REUSE | Per-screen copy (see copy guide). |
| **ErrorState** (icon + retry) | REUSE | Inline retry. |
| **Read-only banner** (Viewer) | REUSE | Above content. |
| **Permission-denied toast** | REUSE | On gated action as Viewer. |
| **Sync-failed banner** (Retry now) | REUSE | Dismissible. |
| **Completion celebration** (check + stats, `popIn`) | NEW (tiny) | SCR-32 `complete` state; no confetti. |
| **Invite error** (inline `role=alert`) | NEW (tiny) | Empty + invalid-email variants. |
| **Blocked drop-zone** (gated Kanban column) | REUSE+ | Dashed amber, `cursor:not-allowed`, aria-label. |

---

## 5. New-component budget

**NEW (build):** TimelineGrid, PhaseGateDrawer, completion state, invite-error + focus-trap, skip-link/FAB/live-region utilities.
**REUSE+ (variant/prop):** Kanban (phase columns), Now&Next, plan card, attention band, invite hero, MemberTable, invite dialog.
**REUSE (as-is):** shell/rail/nav, chat dock, honesty pill, ribbon, toast, calendar, list, KPI card, all state archetypes.

> Roughly **1 substantial new build (TimelineGrid) + 4 tiny utilities**; everything else is reuse. This is the core evidence for the "GO / low-UI-risk" call in `planner-freeze.md`.
