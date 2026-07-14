# Planner — Adaptive 3-Panel: Wireframes + UX Review

> Companion to `planner.md` §2A. Grayscale, structure-only. Covers the **current 4-panel problem** and the **proposed 3-panel architecture** across SCR-32/33/34/35, with per-state and per-breakpoint layouts. Real builds lift tokens from `DESIGN.md`.

---

## 1. Current layout — why it was a problem (SCR-32 before)

Selecting a phase opened a **detail drawer that slid over the workspace, sitting beside the Intelligence panel** → effectively four columns of chrome.

```
┌────┬───────────────────────────────┬──────────────┐┌───────────────┐
│ 56 │  Timeline (now ~620px, dimmed) │ INTELLIGENCE ││  PHASE DRAWER │   ← 4th panel
│rail│  ▓▓▓ scrim over workspace ▓▓▓  │  AI insight  ││  gate + tasks │   (overlay,
│    │                               │  Evidence    ││  Approve/Edit ││   dims work)
└────┴───────────────────────────────┴──────────────┘└───────────────┘
```
Problems: workspace shrinks and is dimmed; two context regions compete (Intelligence *and* drawer); the drawer occludes the very timeline you're acting on.

---

## 2. Proposed layout — 3-panel adaptive (all screens)

One right panel that **swaps** Intelligence ↔ detail. Workspace never dims or shrinks.

```
DEFAULT (nothing selected)              PHASE SELECTED (same width!)
┌────┬─────────────────┬──────────────┐ ┌────┬─────────────────┬──────────────┐
│ 56 │  Timeline (full)│ INTELLIGENCE │ │ 56 │  Timeline (full)│ ‹ Intelligence│
│rail│  ▭▭▭▭▭▭▭▭▭▭▭▭▭▭ │  AI insight  │ │rail│  ▭▭▭▭▭[sel]▭▭▭ │  Outfit conf. │
│    │  ▭▭▭▭▭▭▭▭▭▭▭▭▭▭ │  Evidence    │ │    │  ▭▭▭▭▭▭▭▭▭▭▭▭ │  ◆ gate box   │
│    │                 │  Approvals(1)│ │    │                 │  Approve·Edit │
│    │  [Timeline view]│  "select a   │ │    │                 │  Tasks · 1    │
│    │                 │   phase →"   │ │    │                 │  ▭ ▭          │
└────┴─────────────────┴──────────────┘ └────┴─────────────────┴──────────────┘
                                          close (× / ‹ / Esc) → Intelligence returns
```

---

## 3. Per-screen wireframes

### SCR-35 Hub — default → plan selected
```
DEFAULT                                 PLAN SELECTED
│ card grid (4-col)  │ Cross-plan     │ │ card grid ([sel]) │ ‹ Intelligence   │
│ ▭▭ ▭▭ ▭▭ ▭▭        │ summary        │ │ ▭▭ ▭▭ ▭▭ ▭▭       │ [At risk][Shoot] │
│ ▭▭ ▭▭ ▭▭ ▭▭        │ Needs attention│ │ ▭▭ ▭▭ ▭▭ ▭▭       │ Summer Lookbook  │
│                    │ · Summer …→    │ │                   │ Details / Progress│
│                    │ · Q3 Push …→   │ │                   │ [Open Workspace →]│
```
Interaction arrows: `Hub → click card → panel = Plan detail → Open Workspace → SCR-32`.

### SCR-33 Dashboard — already compliant (no selection→detail; cards navigate)
```
│ greeting + KPI grid          │ INTELLIGENCE          │
│ ▭▭ ▭▭ ▭▭ ▭▭  (4 KPI links)   │ Board health          │
│ recent plans row → navigate  │ Recommendation        │
│ week strip                   │ Recent activity       │
```
Single Intelligence panel; KPI/plan cards are links (go to Workspace/Analytics). No drawer, no 4th panel. ✅

### SCR-34 Settings — default (Access summary) → member selected
```
DEFAULT                                 MEMBER SELECTED
│ Members table (rows)  │ Access       │ │ Members ([sel row])│ ‹ Intelligence  │
│ Owner  · Maya         │ summary      │ │ Owner  · Maya      │ (JA) Jon Alvi   │
│ Manager· Jon    ‹tap  │ Owner 1      │ │ Manager· Jon [sel] │ Access / perms  │
│ Contrib· Priya        │ Manager 1    │ │ Contrib· Priya     │ Change role ▤▤▤ │
│ Viewer · dana(invited)│ …            │ │ …                  │ [Remove]        │
│ [Invite member] (modal)│ 1 pending → │ │                    │ (owner: locked) │
```
Invite = true action modal (allowed). Member detail lives in the adaptive panel, not a drawer.

---

## 4. States (workspace-level; panel stays Intelligence)
```
loading   → skeleton rows in workspace           empty → "No phases yet" + Draft CTA
error     → "Couldn't load" + Try again          read-only(viewer) → banner + gate buttons→note
sync-failed → red banner + Retry now             success → toast (approve / role change)
```

## 5. Breakpoints
```
DESKTOP ≥1280   56 · workspace · 340 panel  (3-col grid)
TABLET 768–1279 56 · workspace · panel→right-edge toggle → slides over as sheet
MOBILE <768     single col · panel→bottom sheet · rail→bottom tab bar
```

---

## 6. UX Review

| Criterion | Verdict | Note |
|---|---|---|
| **Usability** | ✅ improved | one place to act; workspace never dimmed/occluded |
| **Cognitive load** | ✅ improved | one context region, not Intelligence + drawer competing |
| **Information hierarchy** | ✅ | default = AI context; select = that entity's detail — predictable |
| **Screen space** | ✅ major win | Gantt/Kanban keep full width (was ~620px behind a drawer) |
| **Consistency** | ✅ | identical model on all 4 screens; same back/close/Esc |
| **Discoverability** | ⚠→✅ | added "select a … →" hint in the default panel so users learn the swap |
| **Accessibility** | ✅ | native ≥44px targets; Esc/back button; selection shown by outline **and** panel change |

**Why adaptive beats the 4th panel:** screen space (no shrink), lower cognitive load (single context), no overlay occlusion, and cross-screen consistency. See `planner.md` §2A.7.

**Recommendations folded in before hi-fi:**
1. Keep a persistent "‹ Intelligence" back control *and* an × (redundant, both tabbable). ✅ built
2. Show a one-line hint in the default panel ("Select a … to see its detail here") so the swap is discoverable. ✅ built
3. Swap detail-in-place when selecting a different entity (no close/reopen flash). ✅ (state machine is `intelligence ⇄ detail(entity)`)
4. Keep true action modals (Invite) — do not force them into the panel. ✅

---

## 7. Verification (live DOM-probed at 1360px)
- SCR-32: default Intelligence → select phase → detail **in panel** (Intelligence hidden, no scrim) → back → Intelligence. ✅ 0 holes
- SCR-33: single Intelligence panel, no scrim, cards navigate. ✅
- SCR-34: Access summary → select member → member detail → back. ✅ 0 holes
- SCR-35: cross-plan summary → select card → plan detail + Open Workspace → back. ✅ 0 holes
- No screen renders a 4th panel or a detail drawer beside Intelligence.
