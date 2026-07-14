# MOB-20 — Phase 2 flows (Wizard, Campaigns, Matching)

| Field | Value |
|---|---|
| **ID** | MOB-20 |
| **Priority** | P3 |
| **Complexity** | L |
| **Status** | ⚪ Not Started |
| **Linear** | [IPI-420](https://linear.app/amo100/issue/IPI-420) · blocked IPI-419 |
| **Dependencies** | MOB-10 · SCR-06 · SCR-07 (D1) · SCR-09 |
| **Unblocks** | MOB-90 |
| **Branch** | `ipi/mob-20-phase2-flows` |
| **Sources** | [`MOBILE-PLAN.md`](../../docs/Mobile/MOBILE-PLAN.md) §4 · §12.5–12.6 · §12.9 · §15 Phase 2 |

## Objective

Mobile adaptations for **Phase 2** operator flows: one-step-per-screen wizard, campaign cards, matching swipe deck.

## Screens

| SCR | Route | Key mobile behavior |
|---|---|---|
| 06 | `/app/shoots/new` | §4 Wizard: progress bar, sticky footer, horizontal slide, accordion review, composer `inline` |
| 07 | `/app/campaigns` | §12.6 Campaign cards, budget bar, More sheet entry |
| 09 | `/app/matching` | §12.9 Swipe deck full-bleed; table toggle; shortlist sheet |

## Wizard (§4) — critical path

- One step per screen at `<1024px` (or full-height step within route)
- Sticky footer: Back ghost + Continue black, ≥48px, above safe area
- `prefers-reduced-motion` → fade not slide
- Composer inline above footer (MOB-03 `variant='inline'`)

## Matching

- Horizontal swipe gestures with button fallback (Skip / Shortlist / Profile)
- Casting review mode from SCR-09 DC (already design-complete)
- Fit badge → EvidenceBlock in half-detent sheet

## Definition of Done

- [ ] Shoot Wizard usable end-to-end at 390px
- [ ] Campaigns grid reflows (blocked until SCR-07 + D1 — stub OK with empty state)
- [ ] Matching deck + list toggle at mobile widths
- [ ] Filter chips snap-scroll; bulk bar wraps (§16.3)
- [ ] No horizontal overflow on bulk action bars
- [ ] Evidence @390 for each route

## Verification

```bash
cd app && npm run lint && npm run build && npm test
```

## Risk

Campaigns blocked on **BE-D1**; ship wizard + matching first

## Notes

Split into 3 PRs if needed: wizard / campaigns / matching.
