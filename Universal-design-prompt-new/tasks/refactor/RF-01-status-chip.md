# RF-01 — StatusChip + CRM status tokens

| Field | Value |
|---|---|
| **ID** | RF-01 |
| **Refactor action** | A7 — extract StatusChip atom |
| **Priority** | P0 |
| **Complexity** | S |
| **Status** | 🔴 Not Started |
| **Dependencies** | — |
| **Unblocks** | RF-02 · RF-03 · CRM SCR-26–31 · RF-04a/b |
| **Linear** | [IPI-385](https://linear.app/amo100/issue/IPI-385) |
| **Branch** | `ipi/rf-01-status-chip` |
| **Sources** | [`../../REFACTOR.md`](../docs/REFACTOR.md) · [`../../refactor/build-order.md`](README.md) |

## Objective

Create presentational `<StatusChip>` from `StatusChip.dc.html` and `crmStatusDotToken`/`crmStatusLabel` mirroring the proven `ShootCard` + `shoot-list-filters.ts` pattern.

## Ground truth (2026-07-06)

- `status-chip.tsx` and `crm/status-tokens.ts` **do not exist** in `app/` yet.
- `ShootCard` already ships dot+label via `shootStatusDotToken`/`shootStatusLabel` — copy that visual contract, not shadcn Badge.
- CRM colors from SCR-27: prospect `#2563eb` · active `#059669` · inactive `#9ca3af` · lost `#b91c1c`.

## Design source

- [`../../../components/StatusChip.dc.html`](../../components/StatusChip.dc.html)
- Reference: `app/src/components/shoot/ShootCard.tsx` + `app/src/lib/shoot-list-filters.ts`

## Files to inspect

- `app/src/components/shoot/ShootCard.tsx`
- `app/src/lib/shoot-list-filters.ts`
- `Universal-design-prompt-new/components/StatusChip.dc.html`

## Files likely to modify / create

- `app/src/components/ui/status-chip.tsx (new)`
- `app/src/lib/crm/status-tokens.ts (new)`
- `app/src/components/ui/status-chip.test.tsx (new)`

## Definition of Done

- [ ] Default pill mode only: 6px dot, gap 6px, 11px/600, padding 4px 10px, radius 999px
- [ ] Props `{ dot: string; label: string }` — no domain enum in component
- [ ] crmStatusDotToken/crmStatusLabel for companies.status + deals.stage
- [ ] Tests pass
- [ ] No existing imports changed (additive PR)

## Verification

```bash
cd app && npm run typecheck && npm run lint && npx vitest run src/components/ui/status-chip.test.tsx
```

## Risk

Low — new files only

## Notes

Build-order Step 1. Maps to implement.md SC1.

## Skills

`refactor-plan` · `design-to-production` · `shadcn` · `nextjs-developer` · `worktrees`
