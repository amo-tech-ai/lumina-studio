# Accessibility Guide

> A11y is the consistent gap in the audit (≈80). This is the design + build standard for FashionOS. Target: **WCAG 2.1 AA**.

## Colour & contrast
- Body text on white meets **AA 4.5:1** (`#111` ✅, `#6B7280` ✅ at body sizes; `#9CA3AF` only for ≥large/meta, verify per use).
- **Never rely on colour alone** — status uses dot **+ label** (🟢 Ready, 🔴 Blocked). DNA pillars use a weakest-pillar marker, not just hue.
- Focus states visible: 2px focus ring / border-focus `#111`; never remove outlines without a replacement.

## Targets & spacing
- Hit targets **≥44×44px** (mobile tab bar, icon buttons, chips). Icon-only buttons get padding to reach 44px.
- Adequate spacing between adjacent actions to avoid mis-taps.

## Keyboard
- Full keyboard operability: Tab order follows visual order; all actions reachable.
- **Focus trap** in modals, sheets, and the shortlist drawer; **Esc** closes; focus returns to the trigger.
- Card/row "open" actions are real buttons/links (Enter/Space activate).
- Skip-to-content link on the shell.

## Screen readers
- Every icon-only control has an `aria-label` (Voice input, Account, Close, Remove, view toggles — already present).
- Decorative/disabled controls: `aria-disabled` + `title` (voice input pattern).
- **Live regions** for AI streaming and toasts (`aria-live="polite"`) so progress + confirmations are announced.
- Images: meaningful `alt` (asset/brand/creator names); decorative images `alt=""`.
- Landmarks: `nav`, `main`, `aside` (IntelligencePanel), labelled regions (`data-screen-label` in prototypes → `aria-label` in prod).

## Forms & inputs
- Labels tied to inputs; placeholder is not a label.
- Errors announced + described (not colour-only); disabled write actions show a **why-disabled** hint (permission/blocked state).

## Motion & cognition
- Respect `prefers-reduced-motion` (see `ANIMATIONS.md`): no essential info conveyed only by motion.
- Plain language; concise copy; consistent component behaviour reduces cognitive load.

## States & feedback
- Loading = skeleton (announced), not a silent spinner. Empty/error states are descriptive with a clear next action.
- Permission-blocked (read-only) hides/disables write actions and explains why + offers "Request access".

## Per-screen a11y checklist (use in `../handoff/11-screen-checklists.md`)
- [ ] Tab order = visual order; visible focus
- [ ] All controls labelled; icon-only have aria-label
- [ ] Modals/sheets/drawers trap focus + Esc + restore
- [ ] Live region for AI stream + toasts
- [ ] Targets ≥44px; contrast AA
- [ ] Status = dot **+** text; errors not colour-only
- [ ] Images have alt; landmarks present
- [ ] reduced-motion respected

## Open tasks → `IMPLEMENTATION-TASKS.md` (A11Y-01..04)
Full label/focus audit, live regions on all docks, contrast + 44px + reduced-motion verification, keyboard nav for all overlays.
