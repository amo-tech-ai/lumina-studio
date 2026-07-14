# Planner Mobile — Plan Bottom Sheet: current vs improved

> Low-fi wireframes for the plan detail bottom sheet (Hub + Dashboard). Structure only. Companion to `planner-mobile-plan.md` §13 and `planner.md`.

## Problem
The current sheet opens mostly empty — a title, a status chip, and a few generic label/value rows — and does not answer the three questions a user has when they tap a plan. It also shares one global sheet object across frames, so a Dashboard tap could surface content in the Hub frame (state bleed).

---

## A — Current sheet (thin)
```
┌───────────────────────────────┐
│ ▁ (drag handle)               │
│ [At risk]  Summer Lookbook  ✕ │
│ Shoot · Mar 2–Apr 5           │
│───────────────────────────────│
│ Type            Shoot         │
│ Owner           Maya Chen     │
│ Progress        27% · 3/11    │
│ Phases          11            │
│                               │
│ [ Open Workspace ]            │
└───────────────────────────────┘
```
**Reads as:** a raw field dump. No "why care", no next action, no AI. Rows duplicate what the list row already showed.

---

## B — Improved sheet (decision-oriented)
```
┌─────────────────────────────────────┐
│ ▁ (drag handle)                     │
│ Summer Lookbook           [At risk] │  ← WHAT is this
│ Shoot · due Apr 5                   │
│ ▓▓▓▓▓░░░░░░░░░░░  27% · 3/11 phases  │  ← progress at a glance
│─────────────────────────────────────│
│ Current   Item delivery             │  ← compact meta (4 rows)
│ Owner     Maya Chen                 │
│ Next gate Outfit confirm · Mar 17   │
│ Due       Apr 5                     │
│─────────────────────────────────────│
│ ✦ AI  Item delivery is 2 days late; │  ← WHY care
│   the shoot date is at risk if not  │
│   resolved this week.               │
│─────────────────────────────────────│
│ ➤ Recommended: Shift downstream +2d │  ← WHAT to do (highlighted)
│─────────────────────────────────────│
│ [ Open Workspace ]  (primary)       │
│ [View Timeline] [Review approval]   │  ← secondary
│ [Ask Planner]                       │
└─────────────────────────────────────┘
```

---

## Why B is better for first-time users & cognitive load
- **Answers the 3 questions in reading order:** identity + status (*what*) → AI summary (*why care*) → recommended action + CTA (*what next*). A → B turns a lookup into a decision.
- **Progress is visual**, not a text row — parsed in one glance, no counting.
- **One AI sentence** does the interpretation the user would otherwise do themselves (is 27% good or bad? → "at risk this week").
- **Recommended action is singular and highlighted**, so a new user always has an obvious next step even if they don't understand the workspace yet.
- **No task table / duplicate workspace data** — the sheet stays a summary; depth lives one tap away in Open Workspace. Keeps height bounded and scannable.
- **Meta is 4 fixed rows** (current · owner · next gate · due) — predictable structure across every plan lowers learning cost.

**Decision: adopt B.** Fixtures only; content maps 1:1 to the plan record (no new entities).

---

## State isolation (bug fix, same change)
Each frame owns its own sheet: `state.sheets = { hub, dash, ws, set }`, opened via `openS(frameId, sheet)` and read as `f.sheet` / `f.sheetOpen` per frame. Dashboard recent-plan cards open in `dash`, Hub cards in `hub` — a tap in one frame never surfaces content in another. Documented in `planner.md` §2C.
