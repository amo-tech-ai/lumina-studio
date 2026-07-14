# RF-03 — CRM Companies + Contacts list screens

| Field | Value |
|---|---|
| **ID** | RF-03 |
| **Refactor action** | A4 consumer — CRM lists |
| **Priority** | P1 |
| **Complexity** | M |
| **Status** | 🔴 Not Started |
| **Dependencies** | RF-01 · RF-02 |
| **Unblocks** | SCR-26 · SCR-28 · RF-04a/b |
| **Linear** | [IPI-388](https://linear.app/amo100/issue/IPI-388) · blocked by IPI-385, IPI-387 |
| **Branch** | `ipi/rf-03-crm-list-screens` |
| **Sources** | [`../../REFACTOR.md`](../docs/REFACTOR.md) · [`../../refactor/build-order.md`](README.md) |

## Objective

Replace `CrmScreenGate` stubs on Companies and Contacts list routes with real `<EntityList>` + `<StatusChip>` wired to Supabase.

## Ground truth (2026-07-06)

Routes exist as 7–30 line stubs rendering `<CrmScreenGate>`. Backend + `crm-assistant` agent shipped.

## Design source

- [`../../../Pages/SCR-26-CRM-Companies-List.dc.html`](../../Pages/SCR-26-CRM-Companies-List.dc.html)
- [`../../../Pages/SCR-28-CRM-Contacts-List.dc.html`](../../Pages/SCR-28-CRM-Contacts-List.dc.html)
- Wireframes: [SCR-26](../screens/wireframes/SCR-26-crm-companies.md) · [SCR-28](../screens/wireframes/SCR-28-crm-contacts.md)

## Files to inspect

- `app/src/app/(operator)/app/crm/companies/page.tsx`
- `app/src/app/(operator)/app/crm/contacts/page.tsx`
- `app/src/components/crm/crm-screen-gate.tsx`

## Files likely to modify / create

- `app/src/app/(operator)/app/crm/companies/page.tsx`
- `app/src/app/(operator)/app/crm/contacts/page.tsx`
- `app/src/components/crm/ (new list components as needed)`

## Definition of Done

- [ ] Companies list: EntityList + StatusChip from crmStatusDotToken
- [ ] Contacts list: EntityList, role_title as sub-label
- [ ] Remove CrmScreenGate from both list pages
- [ ] Empty state renders
- [ ] Manual QA: /app/crm/companies and /app/crm/contacts

## Verification

```bash
cd app && npm run lint && npm run build && npm test -- crm
```

## Risk

Medium — first real CRM UI

## Notes

Build-order Step 3. One concern: list screens only — Pipeline/Deal in separate tasks.

## Skills

`refactor-plan` · `design-to-production` · `shadcn` · `nextjs-developer` · `worktrees`
