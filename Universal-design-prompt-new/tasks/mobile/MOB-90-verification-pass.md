# MOB-90 — Mobile verification pass

| Field | Value |
|---|---|
| **ID** | MOB-90 |
| **Priority** | P3 |
| **Complexity** | M |
| **Status** | ⚪ Not Started |
| **Linear** | [IPI-424](https://linear.app/amo100/issue/IPI-424) |
| **Dependencies** | MOB-04 minimum; ideally MOB-10 + MOB-31 complete |
| **Unblocks** | Production ⭐ sign-off on mobile |
| **Branch** | `ipi/mob-90-verification` |
| **Sources** | [`MOBILE-PLAN.md`](../../docs/Mobile/MOBILE-PLAN.md) §16 · §20.4 · §20.6 · `docs/handoff/13-react-mobile-verification.md` |

## Objective

Run the **measurable mobile verification pass** at 390 · 430 · 768 · 1024 — Playwright matrix + evidence bundle. Replaces historical **IPI-264** DC pass for **live React routes**.

## Breakpoints

390px · 430px · 768px · 1024px (§16, §20.4)

## Quality gates (every screen)

- [ ] No horizontal page overflow
- [ ] Bulk/action bars `flex-wrap` where present
- [ ] Touch targets ≥44×44px
- [ ] Images lazy-load; div-background pattern where applicable
- [ ] HITL preserved — AI never confirms/accepts
- [ ] Toasts `aria-live="polite"`; reduced-motion honored
- [ ] Empty · loading · error states present

## Screen matrix (expand as MOB tasks land)

| Phase | Screens | Skip if not routed |
|---|---|---|
| Shell | OperatorShell, nav, composer, intel sheet | — |
| MVP | SCR-01, 02, 03, 04, 08, 11 | explicit skip OK |
| Phase 2 | SCR-06, 07, 09 | |
| Phase 3 | SCR-10 | |
| Booking | SCR-09, 15, 20, 21, 22, 23, 25 | |
| CRM | SCR-26–31 | when CRM UI ships |

## Deliverables

- [ ] Update `docs/handoff/13-react-mobile-verification.md` with booking + CRM rows
- [ ] Playwright specs under `e2e/design-v2/mobile/` (or extend IPI-258 framework)
- [ ] Evidence → `docs/ecommerce/evidence/YYYY-MM-DD/mobile-verification/`
- [ ] Pass/fail score + re-score target ≥90 (§20.6)
- [ ] Link proof in `plan/todo.md` mobile row

## Definition of Done

- [ ] CI (or documented manual) run green for implemented screens
- [ ] Zero 🔴 Critical mobile regressions open
- [ ] Mobile readiness score documented (baseline was 82/100 on DC — re-measure on React)

## Verification

```bash
cd app && npm run test:e2e -- e2e/design-v2/mobile
# optional: npm run test:a11y when IPI-253 infra lands
```

## Risk

Low — verification-only; findings spawn targeted MOB fixes

## Notes

Run after each MOB milestone; final gate before marking Phase 10 (Mobile) complete in plan/todo.
