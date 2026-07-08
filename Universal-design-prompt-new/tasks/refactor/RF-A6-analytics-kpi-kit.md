# RF-A6 — Analytics / KPI kit

| Field | Value |
|---|---|
| **ID** | RF-A6 |
| **Refactor action** | A6 — KPICard + Sparkline + TrendRow |
| **Priority** | P2 |
| **Complexity** | M |
| **Status** | ⏸ Deferred |
| **Dependencies** | SCR-16 route exists |
| **Unblocks** | SCR-01 · SCR-16 · SCR-17 |
| **Branch** | `ipi/rf-a6-kpi-kit` |
| **Sources** | [`../../REFACTOR.md`](../docs/REFACTOR.md) · [`../../refactor/build-order.md`](README.md) |

## Objective

Extract KPI card, delta badge, sparkline, bar/trend rows from Analytics + Command Center DC markup into shared components.

## Ground truth (2026-07-06)

No `/app/analytics` route yet — nothing to consolidate in React. Greenfield when SCR-16 lands.

## Design source

- [`../../../Pages/Analytics.v2.image-first.dc.html`](../../Pages/Analytics.v2.image-first.dc.html)
- [`../../../Pages/Command Center.v2.image-first.dc.html`](../../Pages/Command Center.v2.image-first.dc.html)

## Files to inspect

- `app/src/app/(operator)/app/page.tsx`

## Files likely to modify / create

- `app/src/components/analytics/kpi-card.tsx (new)`
- `app/src/components/analytics/sparkline.tsx (new)`

## Definition of Done

- [ ] KPICard + Sparkline + TrendRow components
- [ ] Used by Command Center and Analytics when built

## Verification

```bash
cd app && npm test -- kpi
```

## Risk

Low — greenfield

## Notes

Defer until SCR-16 route or Command Center KPI refactor scheduled.

## Skills

`refactor-plan` · `design-to-production` · `shadcn` · `nextjs-developer` · `worktrees`
