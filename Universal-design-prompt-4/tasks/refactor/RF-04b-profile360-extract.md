# RF-04b — CRM Contact detail + Profile360 extract

| Field | Value |
|---|---|
| **ID** | RF-04b |
| **Refactor action** | A5 — Profile360 template extraction |
| **Priority** | P1 |
| **Complexity** | L |
| **Status** | 🔴 Not Started |
| **Dependencies** | RF-04a |
| **Unblocks** | SCR-29 · SCR-27 refactor to config · T2 Profile360 |
| **Linear** | [IPI-392](https://linear.app/amo100/issue/IPI-392) · blocked by IPI-391 |
| **Branch** | `ipi/rf-04b-profile360-extract` |
| **Sources** | [`../../REFACTOR.md`](../docs/REFACTOR.md) · [`../../refactor/build-order.md`](README.md) |

## Objective

Build Contact detail page, then extract shared `<Profile360>` + `companyProfileConfig`/`contactProfileConfig` from the two real detail pages.

## Ground truth (2026-07-06)

Same shape as company detail — extract only after both pages exist (conscious choice vs template-first).

## Design source

- [`../../../Pages/SCR-29-CRM-Contact-Detail.dc.html`](../../Pages/SCR-29-CRM-Contact-Detail.dc.html)
- [`../../../Pages/DEMO-360-Agency.dc.html`](../../Pages/DEMO-360-Agency.dc.html)
- Wireframes: [SCR-29](../screens/wireframes/SCR-29-crm-contact-detail.md) · [SCR-27](../screens/wireframes/SCR-27-crm-company-detail.md) (Profile360 source)

## Files to inspect

- `app/src/app/(operator)/app/crm/contacts/[id]/page.tsx`
- `app/src/app/(operator)/app/crm/companies/[id]/page.tsx (refactor to config)`

## Files likely to modify / create

- `app/src/app/(operator)/app/crm/contacts/[id]/page.tsx`
- `app/src/components/crm/profile-360.tsx (new — extracted)`
- `app/src/components/crm/profile-360.test.tsx (new)`
- `app/src/lib/crm/company-profile-config.ts (new)`
- `app/src/lib/crm/contact-profile-config.ts (new)`

## Definition of Done

- [ ] Contact detail: Overview (multi email/phone) / Deals / Activity
- [ ] Extract Profile360 config engine from company + contact pages
- [ ] Linked tabs are links not embeds
- [ ] Gated tabs show greyed state
- [ ] profile-360.test.tsx passes

## Verification

```bash
cd app && npm run lint && npx vitest run src/components/crm/profile-360.test.tsx
```

## Risk

Medium — extraction after 2 real consumers

## Notes

Build-order Step 4b. Maps to implement.md T2.

## Skills

`refactor-plan` · `design-to-production` · `shadcn` · `nextjs-developer` · `worktrees`
