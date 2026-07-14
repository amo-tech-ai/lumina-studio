# RF-OPT — ShootCard → StatusChip migration

| Field | Value |
|---|---|
| **ID** | RF-OPT |
| **Refactor action** | A7 — prove StatusChip on shipped screen |
| **Priority** | P3 |
| **Complexity** | S |
| **Status** | ⏸ Deferred |
| **Dependencies** | RF-01 · [IPI-385](https://linear.app/amo100/issue/IPI-385) |
| **Linear** | [IPI-406](https://linear.app/amo100/issue/IPI-406) |
| **Unblocks** | Visual parity proof |
| **Branch** | `ipi/rf-opt-shootcard-statuschip` |
| **Sources** | [`../../REFACTOR.md`](../docs/REFACTOR.md) · [`../../refactor/build-order.md`](README.md) |

## Objective

Optional: swap ShootCard inline dot+pill for `<StatusChip>`. Behavior-preserving only — zero visual drift.

## Ground truth (2026-07-06)

ShootCard is live production code. Separate PR with visual diff QA on /app/shoots.

## Design source

- ShootCard existing markup

## Files to inspect

- `app/src/components/shoot/ShootCard.tsx`

## Files likely to modify / create

- `app/src/components/shoot/ShootCard.tsx`

## Definition of Done

- [ ] ShootCard uses StatusChip internally
- [ ] Visual diff zero on /app/shoots
- [ ] Tests updated

## Verification

```bash
cd app && npm test -- ShootCard
```

## Risk

Medium — touches shipped screen

## Notes

refactor-plan Phase 3.2 — optional, own PR.

## Skills

`refactor-plan` · `design-to-production` · `shadcn` · `nextjs-developer` · `worktrees`
