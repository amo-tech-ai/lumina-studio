# RF-A1b — DetailShell + booking flow config

| Field | Value |
|---|---|
| **ID** | RF-A1b |
| **Refactor action** | A1 — DetailShell for dual-flow detail |
| **Priority** | P1 |
| **Complexity** | L |
| **Status** | ⏸ Deferred |
| **Dependencies** | T4 DetailShell · RF-A1 (optional) |
| **Unblocks** | SCR-05 tabs · SCR-22 Booking Detail |
| **Branch** | `ipi/rf-a1b-detail-shell` |
| **Sources** | [`../../REFACTOR.md`](../docs/REFACTOR.md) · [`../../refactor/build-order.md`](README.md) |

## Objective

Extract `<DetailShell>` (hero, tab strip, timeline, panel) + FLOWCFG for shoot vs booking. Booking tabs (Talent/Availability/Approvals) as config not markup.

## Ground truth (2026-07-06)

shoot-detail-client.tsx is 209 lines — not the 1049-line DC giant. Extract shell for **tab parity + booking reuse**, not emergency size reduction.

## Design source

- [`../../../Pages/Shoot Detail.v2.image-first.dc.html`](../../Pages/Shoot Detail.v2.image-first.dc.html)

## Files to inspect

- `app/src/components/shoot/shoot-detail-client.tsx`

## Files likely to modify / create

- `app/src/components/ui/detail-shell.tsx (new)`
- `app/src/lib/shoot/shoot-detail-config.ts (new)`
- `app/src/lib/booking/booking-detail-config.ts (new)`

## Definition of Done

- [ ] DetailShell reusable across shoot + booking
- [ ] Tab configs drive content slots
- [ ] SCR-22 can reuse shell with booking FLOWCFG

## Verification

```bash
cd app && npm test -- shoot-detail
```

## Risk

Medium

## Notes

Pair with SCR-05 (IPI-371). Can proceed without RF-A1.

## Skills

`refactor-plan` · `design-to-production` · `shadcn` · `nextjs-developer` · `worktrees`
