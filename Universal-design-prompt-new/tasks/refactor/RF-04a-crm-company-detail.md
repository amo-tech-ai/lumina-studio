# RF-04a — CRM Company detail page

| Field | Value |
|---|---|
| **ID** | RF-04a |
| **Refactor action** | A5 — detail template (build real page first) |
| **Priority** | P1 |
| **Complexity** | L |
| **Status** | 🔴 Not Started |
| **Dependencies** | RF-01 · RF-03 |
| **Unblocks** | RF-04b Profile360 extract · SCR-27 |
| **Linear** | [IPI-391](https://linear.app/amo100/issue/IPI-391) · blocked by IPI-388, IPI-385 |
| **Branch** | `ipi/rf-04a-crm-company-detail` |
| **Sources** | [`../../REFACTOR.md`](../docs/REFACTOR.md) · [`../../refactor/build-order.md`](README.md) |

## Objective

Fill `crm/companies/[id]/page.tsx` with header + tabs (Overview / Contacts / Deals / Activity). Build as normal page first — extract Profile360 after Contact detail proves the shape.

## Ground truth (2026-07-06)

Zero detail pages in code today. Activity tab greyed until Timeline (IPI-366). No `kind` column — skip TypeChip.

## Design source

- [`../../../Pages/SCR-27-CRM-Company-Detail.dc.html`](../../Pages/SCR-27-CRM-Company-Detail.dc.html)
- Wireframe: [SCR-27](../screens/wireframes/SCR-27-crm-company-detail.md)

## Files to inspect

- `app/src/app/(operator)/app/crm/companies/[id]/page.tsx`
- `Universal-design-prompt-new/Pages/SCR-27-CRM-Company-Detail.dc.html`

## Files likely to modify / create

- `app/src/app/(operator)/app/crm/companies/[id]/page.tsx`
- `app/src/components/crm/company-detail/ (new)`

## Definition of Done

- [ ] Header + tab strip matches SCR-27
- [ ] Overview = facts; Contacts/Deals tabs link out (never embed)
- [ ] Activity tab greyed 'ships with IPI-366'
- [ ] Remove CrmScreenGate
- [ ] Side-by-side QA vs SCR-27 DC

## Verification

```bash
cd app && npm run lint && npm test -- crm
```

## Risk

Medium

## Notes

Build-order Step 4a. Do not build generic Profile360 before this page exists.

## Skills

`refactor-plan` · `design-to-production` · `shadcn` · `nextjs-developer` · `worktrees`
