# RF-02 — EntityList generic template

| Field | Value |
|---|---|
| **ID** | RF-02 |
| **Refactor action** | A4 — shared list template |
| **Priority** | P0 |
| **Complexity** | M |
| **Status** | 🔴 Not Started |
| **Dependencies** | RF-01 (StatusChip for row badges) |
| **Unblocks** | RF-03 · SCR-26/28 · later Brand/Shoots migration |
| **Linear** | [IPI-387](https://linear.app/amo100/issue/IPI-387) · blocked by IPI-385, IPI-386 |
| **Branch** | `ipi/rf-02-entity-list` |
| **Sources** | [`../../REFACTOR.md`](../docs/REFACTOR.md) · [`../../refactor/build-order.md`](README.md) |

## Objective

Create config-driven `<EntityList<T>>` — rows, empty/loading/error, optional search slot. No domain logic inside.

## Ground truth (2026-07-06)

No `entity-list.tsx` in app. Brand/Shoots lists hand-roll rows today — **out of scope** for first consumer (CRM only per build-order).

## Design source

- Compose from `SearchBar.dc.html` / `FilterBar.dc.html` + list Pages (SCR-26, Brand List)
- No EntityList atom — template composed from atoms

## Files to inspect

- `app/src/components/brand-hub/brand-list-workspace.tsx`
- `app/src/app/(operator)/app/shoots/page.tsx`
- `Universal-design-prompt-new/Pages/SCR-26-CRM-Companies-List.dc.html`

## Files likely to modify / create

- `app/src/components/ui/entity-list.tsx (new)`
- `app/src/components/ui/entity-list.test.tsx (new)`

## Definition of Done

- [ ] Generic props: items, renderRow, emptyLabel, searchPlaceholder?
- [ ] Empty + loading + error states
- [ ] Config surface minimal — CRM Companies/Contacts needs only
- [ ] Tests pass
- [ ] Additive — no existing screen wired yet

## Verification

```bash
cd app && npm run typecheck && npm run lint && npx vitest run src/components/ui/entity-list.test.tsx
```

## Risk

Low — additive

## Notes

Build-order Step 2. Maps to implement.md T1. Do not add Brand/Shoots options speculatively.

## Skills

`refactor-plan` · `design-to-production` · `shadcn` · `nextjs-developer` · `worktrees`
