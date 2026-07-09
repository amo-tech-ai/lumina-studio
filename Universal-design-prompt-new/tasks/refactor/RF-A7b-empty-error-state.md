# RF-A7b — EmptyState + ErrorState extract

| Field | Value |
|---|---|
| **ID** | RF-A7b |
| **Refactor action** | A7 — feedback atoms |
| **Priority** | P0 |
| **Complexity** | S |
| **Status** | 🔴 Not Started |
| **Dependencies** | — |
| **Unblocks** | RF-02 EntityList · all list screens |
| **Linear** | [IPI-386](https://linear.app/amo100/issue/IPI-386) |
| **Branch** | `ipi/rf-a7b-empty-error-state` |
| **Sources** | [`../../REFACTOR.md`](../docs/REFACTOR.md) · [`../../refactor/build-order.md`](README.md) |

## Objective

Extract `<EmptyState>` and `<ErrorState>` from inline patterns. Required props on EntityList and all templates.

## Ground truth (2026-07-06)

SkeletonLoader ships. EmptyState/ErrorState inline-only today.

## Design source

- [`../../../components/EmptyState.dc.html`](../../components/EmptyState.dc.html)
- ErrorState → design STATES.md (no atom)

## Files to inspect

- `app/src/components/ui/`
- `grep EmptyState patterns in app/src`

## Files likely to modify / create

- `app/src/components/ui/empty-state.tsx (new)`
- `app/src/components/ui/error-state.tsx (new)`

## Definition of Done

- [ ] EmptyState matches DC
- [ ] ErrorState with retry action slot
- [ ] EntityList consumes both

## Verification

```bash
cd app && npx vitest run src/components/ui/empty-state.test.tsx
```

## Risk

Low

## Notes

Maps to implement.md SC2. Can parallel RF-01.

## Skills

`refactor-plan` · `design-to-production` · `shadcn` · `nextjs-developer` · `worktrees`
