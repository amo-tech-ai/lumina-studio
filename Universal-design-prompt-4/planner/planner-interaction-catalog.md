# Planner — Interaction Catalog

> **Status: 🟢 FROZEN reference — 2026-07-10.** Every interaction, its trigger, response, states, keyboard + a11y behavior, and responsive variant. Companion to `planner-component-catalog.md` + `planner-copy-guide.md`.
> **Scope:** SCR-32/33/34/35 desktop + mobile gallery. Verified by live DOM probe.

---

## 1. Global interaction rules

- **Escape** closes the top-most transient layer in priority order: slide-over panel → dialog → detail panel. Never navigates away.
- **Toasts** auto-dismiss at 2.6 s, are `aria-live=polite`, and never block input.
- **Focus** is always visible (`:focus-visible` → 2 px `--action` ring, 2 px offset) on links, buttons, inputs.
- **Skip link** (`Skip to <region>`) is the first focusable element; jumps to `#pl-main`.
- **Reduced motion** (`prefers-reduced-motion`) disables shimmer, slide-over transition, and the completion `popIn`.
- **Sample actions** that aren't wired always respond with an honest toast (`Sample assistant — not wired yet`, `… (sample)`) — never a dead click.

---

## 2. Navigation

| Trigger | Response | A11y |
|---|---|---|
| Click rail item | Navigate to screen | `aria-current="page"` on active; `aria-label` per item; `title` tooltip |
| Tab into shell | Skip link appears first | `.pl-skip` slides in on focus |
| Back-affordance (Settings) | Returns to plan | Standard `<a>` |

All five targets resolve: Home (`Command Center`), Planner (`SCR-35`), Planner Dashboard (`SCR-33`), Notifications (`SCR-15`), Settings (`SCR-34`).

---

## 3. Responsive behavior (§14.5)

| Width | Right panel | Trigger |
|---|---|---|
| **≥ 1280** | Persistent, 340/320 px | always visible |
| **1024–1279** | Persistent, narrowed to 300 px | CSS `!important` on `.pl-shell` grid |
| **< 1024** | Off-canvas **slide-over** (340 px, max 88 vw) | Insights **FAB** opens; **scrim** or **Esc** closes; `transform` transition (disabled under reduced-motion) |
| **< 768** | Slide-over full-height; Now&Next stacks 1-col; toolbar wraps | CSS media rules |

Below 768 the **mobile gallery** (`SCR-MOBILE-Planner-Gallery`) is the reference design (bottom-sheet pattern, tab bar, docked composer). Verified: FAB appears and panel slides at < 1024 across all four DCs.

---

## 4. Workspace (SCR-32)

| Interaction | Trigger | Response | States / a11y |
|---|---|---|---|
| Switch view | Timeline/Kanban/Calendar/List | Swaps main content | List view transient (not persisted) |
| Select a step | Click bar/row/card | Right panel swaps to **detail** | `outline` on selected; panel `panelIn` anim |
| **Arrow-key step nav** | ↑/↓/←/→ (live state only, not in inputs) | Moves selection to prev/next step, opens detail | Announced via `.pl-sr`: *Step N of 11: <name>*; `preventDefault` |
| Approve a gate | **Approve** in detail | Marks approved, unlocks next step, toast | Viewer → permission toast (disabled); `Requires:` line states who can |
| Edit / Discard gate | buttons | Sample toast / closes detail | — |
| **Blocked drag** | Gated Kanban column | Dashed amber drop-zone, `cursor:not-allowed`; click → toast *"<step> is locked — approve the previous step first"* | `aria-label` explains why |
| Now / Next jump | View / Review buttons | Selects the relevant step | Next-approval card amber when pending |
| Assistant chips | Tap suggested chip | Sample toast (until wired) | View-aware set (see copy guide) |
| Panel toggle (< 1024) | FAB / scrim / Esc | Opens / closes slide-over | — |
| **Completion** | `screenState = complete` | Celebration view: check + 3 stat cards + Archive/View | `popIn` (reduced-motion safe); no confetti |
| Demo states | Tweaks: loading / empty / error / complete; role; syncFailed | Swaps whole content region | Read-only banner, sync banner, retry |

---

## 5. Dashboard (SCR-33)

| Interaction | Trigger | Response |
|---|---|---|
| KPI card | Click | Deep-links into Workspace, pre-filtered |
| Recommended action | Click | Opens the relevant approval (or Viewer toast) |
| Week row | Click | Opens task/step |
| Panel toggle (< 1024) | FAB / scrim / Esc | Slide-over Intelligence |
| Demo states | Tweaks | loading / empty / error / read-only / sync |

---

## 6. Hub (SCR-35)

| Interaction | Trigger | Response | a11y |
|---|---|---|---|
| Type filter | All/Shoot/Campaign/CRM Deal | Filters + risk-sorts cards | **Result count announced**: `.pl-sr` → *N plans shown · <type>* |
| Select plan | Click card | Right panel → plan detail | `outline` on selected |
| Open Workspace / Settings | detail buttons | Sample navigation toast | — |
| Attention band link | Click at-risk plan | Selects that plan | Headline pluralizes (1 plan / N plans) |
| New plan | header button | Sample toast (Viewer blocked) | — |
| Panel toggle (< 1024) | FAB / scrim / Esc | Slide-over | — |

---

## 7. Settings (SCR-34)

| Interaction | Trigger | Response | a11y |
|---|---|---|---|
| Open Invite dialog | Invite / role-shortcut buttons | Dialog opens, role preset | **Focus moves to email input**; `role="dialog" aria-modal` |
| **Focus trap** | Tab / Shift-Tab in dialog | Cycles within dialog | first↔last wrap |
| **Invite validation** | Send with empty / invalid email | Inline `role=alert` error, dialog stays open, field border → red | `aria-invalid`, `aria-describedby` |
| Send valid invite | Send | Closes, toast `Invite sent to <email>`, **focus returns to trigger** | — |
| Close dialog | Cancel / Esc / scrim | Closes, focus returns | Esc handled |
| Resend pending | Resend | Sample toast | — |
| Select member | Click row | Right panel → member detail | — |
| Change role / Remove | detail buttons | Sample toast; remove confirms; owner locked | Viewer blocked |
| Panel toggle (< 1024) | FAB / scrim / Esc | Slide-over | — |
| Demo states | Tweaks | loading / empty / error / read-only / sync |

---

## 8. Mobile gallery (SCR-MOBILE)

- Bottom-sheet on tap (plan card / step) with drag handle; scrim + close.
- Tab bar (Home · Planner · Dashboard · Inbox · Settings) + docked AI composer persist.
- State chips per frame (default / loading / empty / error / offline).
- Same vocabulary as desktop (swept at freeze).

---

## 9. Interaction verification log (this pass)

- ✅ Panel FAB opens slide-over < 1024 (all 4).
- ✅ Arrow-key step nav announces via live region (SCR-32).
- ✅ Hub filter announces result count (SCR-35).
- ✅ Invite: focus-to-input, empty + invalid errors keep dialog open, valid closes + toast, focus returns (SCR-34).
- ✅ Blocked Kanban column shows drop-zone + explanatory toast (SCR-32).
- ✅ Completion state renders with reduced-motion-safe animation (SCR-32).
- ✅ 0 unresolved template holes across all five files.
