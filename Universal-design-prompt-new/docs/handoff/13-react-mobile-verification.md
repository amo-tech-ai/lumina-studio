# 13 — React Mobile Verification Checklist (for Claude Code)

> Hand-off gate for porting the FashionOS/iPix prototypes to the Next.js + Tailwind codebase in `app/`. **Design is not React** — this is the checklist the coding agent runs to prove the React build matches the verified DC prototypes at mobile/tablet. Source of truth for layout: the `.dc.html` prototypes + `MOBILE-PLAN.md §16`.

## Design vs Development Ownership
**This entire checklist is Claude Code / Cursor work.** Claude Design has specified the behavior and verified the intent in the DC prototypes; Claude Code implements and runs production verification.

- **Design (done — spec + DC evidence):** layouts, responsive rules (`@media` behavior each screen shows), shared components, AI UX, states, accessibility *requirements*, screenshots.
- **Development (this doc):** React/Next.js routes, Tailwind responsive classes, Supabase/CopilotKit/Mastra/Gemini/Cloudinary wiring, Playwright/axe/Lighthouse, production verification.
- **Explicitly moved design → development:** Analytics + Campaign Performance React build; **MOBILE-002** ≥44px hit-area enforcement; **MOBILE-003** long-press select + mobile action sheet; **MOBILE-004** focus-trap · streaming `aria-live` · keyboard audit. The DC prototypes *specify* these — implementation is React-only.

## Breakpoints to verify
| Width | Class | Expectation |
|---|---|---|
| 390px | mobile (iPhone 12/13/14) | rail hidden · bottom tab bar · panel = sheet · bulk bar wraps · no h-scroll |
| 430px | mobile-large (Pro Max) | same as 390 with more breathing room |
| 768px | tablet portrait | rail hidden (or compact) · 2-col grids · sheet detents |
| 1024px | tablet landscape / small laptop | rail appears · panel returns inline · 3-col grids |

## Per-screen gate (run at 390 · 430 · 768 · 1024)
For each of the 13 screens (Command Center, Brand List, Brand Detail, Shoots List, Shoot Detail, Shoot Wizard, Assets, Campaigns, Matching, Channel Preview, Onboarding, **Analytics Overview**, **Campaign Performance**):

- [ ] **Next.js route** renders the screen (see `07-navigation-map.md` for the route table).
- [ ] **Tailwind responsive classes** reproduce the DC's `@media (max-width:1024px)` rules: `hidden lg:flex` on the rail, bottom tab bar `fixed bottom-0 lg:hidden`, panel `hidden lg:block` + mobile sheet.
- [ ] **No horizontal overflow** at any breakpoint (`document.documentElement.scrollWidth <= clientWidth`).
- [ ] **Bulk-action bar** (Assets, Campaigns, Matching) wraps — `flex-wrap` — no clipped buttons at 390/430.
- [ ] **EvidenceBlock modal** reflows full-width, scrolls, close button reachable; not clipped.
- [ ] **Upload modal** (Assets) stacks; per-file rows + progress full-width.
- [ ] **Chat dock** stays above the bottom tab bar (padding-aware); input reachable with keyboard open.
- [ ] **Bottom nav** items navigate to the correct routes; active state correct.

## Analytics screens (SCR-16/17) — extra gate
- [ ] **KPI row** reflows 6 → 3-col (≤1180) → 2-col (≤1024); `.kpirow` mobile rule; no clipped deltas/sparklines.
- [ ] **Chart grids** collapse to 1-col (`.chartgrid` ≤1024); trend/ring/bars SVGs stay `width:100%` — no h-scroll.
- [ ] **Campaign Performance ranking rows** — name column shrinks (flex `0 1 150px; min-width:0`, ellipsis), bar `min-width:36px`; **verified 0 overflow at 390** (desktop basis 150 preserved).
- [ ] **Drill-down** — Analytics "Campaign performance" card → `/app/analytics/campaigns?c=<id>` preselects that campaign; row highlight + chevron reflect selection.
- [ ] **EvidenceBlock** per metric/insight (both screens) reflows full-width, close reachable — *verified in DC*.

## Touch targets (MOBILE-002)
- [ ] Every interactive control ≥ **44×44px** hit area at mobile: icon buttons, **selection checkboxes** (visual box may stay ~20px, pad the tap area), chips, tabs, close buttons, bulk-bar buttons, AI-dock mic/send.
- [ ] Tailwind: `min-h-11 min-w-11` (44px) on icon buttons; `before:` pseudo hit-expansion on small checkboxes.

## Selection & gestures (MOBILE-003)
- [ ] **Long-press (~500ms)** on a card enters selection mode on touch (the DC prototypes use a desktop "Select" toggle; React should add long-press via pointer events).
- [ ] Selected cards show checkbox state; **bulk actions presented as a bottom action sheet** on mobile (vs. the desktop sticky top bar).
- [ ] **Desktop drag-and-drop unchanged**; touch uses the action-sheet fallback (HTML5 DnD does not fire on touch — do not rely on it for mobile).
- [ ] No gesture conflicts with scroll / swipe-back.

## Accessibility (MOBILE-004)
- [ ] **Focus trap** on every modal + bottom sheet (EvidenceBlock, upload, publish, edit, confirm, More sheet); focus restored to the trigger on close.
- [ ] **Keyboard**: all actions reachable; Esc closes overlays; visible focus ring.
- [ ] **`aria-live="polite"`** on toasts *(already in the DC prototypes)* and on the **AI streaming step list** (add on the `chatThinking` region wrapper).
- [ ] **`prefers-reduced-motion`** honored *(already in DC via `tokens.css` + per-screen `@media`)* — keep in the Tailwind config (`motion-reduce:` variants).
- [ ] **Screen-reader labels**: every icon-only control has `aria-label`; close buttons announce ("Close"); images carry meaningful `alt`.
- [ ] Sheets announced as dialogs (`role="dialog"` + `aria-modal="true"` + labelled).

## Tablet (MOBILE-005)
- [ ] 768px: sheets, grids (2-col), bulk bars, EvidenceBlock/upload modals, chat dock, bottom nav all correct.
- [ ] 1024px: rail + inline panel return; 3-col grids; no split-view breakage.
- [ ] Decide + document split-view (2-pane) behavior if targeting iPad landscape — currently treated as "rail returns at 1024".

## Automated gates
- [ ] **Playwright mobile test** per screen: set viewport 390×844, assert no h-overflow, bottom nav visible, rail hidden, open one modal + one sheet, tab-order sane.
- [ ] **Lighthouse mobile** ≥ 90 Performance / ≥ 95 Accessibility per screen.
- [ ] **axe / accessibility scan** — zero critical violations (focus order, labels, contrast, live regions).
- [ ] **Console clean** — no errors/warnings at any breakpoint.

## Definition of done
All 13 screens pass the per-screen gate at all four breakpoints, automated gates green, and the MOBILE-PLAN §16 🟡 items (44px targets, long-press, focus-trap, streaming aria-live) are resolved in React. Update `MOBILE-PLAN.md §16` + `checklist.md` when green.

## Route table (add to `07-navigation-map.md`)
| Screen | Route | Agent |
|---|---|---|
| Analytics Overview | `/app/analytics` | analytics-intelligence |
| Campaign Performance | `/app/analytics/campaigns` (`?c=<id>` preselect) | analytics-intelligence |
