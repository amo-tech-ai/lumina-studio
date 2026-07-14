# RF-A1 — WizardShell + shoot/booking flow configs

| Field | Value |
|---|---|
| **ID** | RF-A1 |
| **Refactor action** | A1 — split Shoot Wizard giant |
| **Priority** | P0 |
| **Complexity** | XL |
| **Status** | ⏸ Deferred |
| **Dependencies** | T3 WizardShell pattern · test coverage on shoots/new |
| **Unblocks** | SCR-06 polish · SCR-21 Booking Wizard |
| **Branch** | `ipi/rf-a1-wizard-shell-split` |
| **Sources** | [`../../REFACTOR.md`](../docs/REFACTOR.md) · [`../../refactor/build-order.md`](README.md) |

## Objective

Split `shoots/new/page.tsx` (~801 lines) into `<WizardShell>` + `shootSteps`/`bookingSteps` flow configs. Lift prototype FLOWCFG pattern — do not convert 801 lines as-is.

## Ground truth (2026-07-06)

React wizard is 801 lines (not 1166-line DC). Shoot Detail client is **209 lines** — already collapsed (IPI-383). **Wizard only** needs split.

## Design source

- [`../../../Pages/Shoot Wizard.v2.image-first.dc.html`](../../Pages/Shoot Wizard.v2.image-first.dc.html) (1166 lines, dual flow)

## Files to inspect

- `app/src/app/(operator)/app/shoots/new/page.tsx`
- `app/src/components/shoot/wizard/`

## Files likely to modify / create

- `app/src/components/shoot/wizard-shell.tsx (new)`
- `app/src/lib/shoot/shoot-wizard-steps.ts (new)`
- `app/src/lib/booking/booking-wizard-steps.ts (new)`
- `app/src/app/(operator)/app/shoots/new/page.tsx (slim consumer)`

## Definition of Done

- [ ] WizardShell: stepper, nav, sticky footer, progress, validation, unsaved-guard
- [ ] shootSteps and bookingSteps as data configs
- [ ] page.tsx under ~150 lines
- [ ] Zero behavioral regression on shoot wizard HITL
- [ ] Test coverage check before starting

## Verification

```bash
cd app && npm run lint && npm run build && npm test -- wizard
```

## Risk

High — highest blast-radius refactor

## Notes

REFACTOR.md A1. Deferred per build-order until dedicated refactor run with tests.

## Skills

`refactor-plan` · `design-to-production` · `shadcn` · `nextjs-developer` · `worktrees`
