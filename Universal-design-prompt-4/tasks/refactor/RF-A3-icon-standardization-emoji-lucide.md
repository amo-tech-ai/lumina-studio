# RF-A3 — Icon standardization (emoji → lucide)

| Field | Value |
|---|---|
| **ID** | RF-A3 |
| **Refactor action** | A3 — unify icon usage in React |
| **Priority** | P2 |
| **Complexity** | S |
| **Status** | ⏸ Deferred |
| **Dependencies** | — |
| **Unblocks** | Visual consistency |
| **Branch** | `ipi/rf-a3-icon-cleanup` |
| **Sources** | [`../../REFACTOR.md`](../docs/REFACTOR.md) · [`../../refactor/build-order.md`](README.md) |

## Objective

Replace residual emoji icons in older components with `lucide-react`. React already standardized on lucide (35 files) — prototype's inline-svg vs lu-ic split does not apply.

## Ground truth (2026-07-06)

A3 in REFACTOR.md targets DC prototypes. In React: small residual in nav-sidebar.tsx and some cards.

## Design source

- N/A — React uses lucide-react

## Files to inspect

- `app/src/components/operator-panel/nav-sidebar.tsx`

## Files likely to modify / create

- `Files with emoji icons — grep and fix per file, one PR`

## Definition of Done

- [ ] No emoji as primary nav/action icons in touched files
- [ ] lucide-react imports consistent

## Verification

```bash
cd app && npm run lint
```

## Risk

Low — cosmetic

## Notes

Deferred — blocks nothing. Independent PR anytime.

## Skills

`refactor-plan` · `design-to-production` · `shadcn` · `nextjs-developer` · `worktrees`
