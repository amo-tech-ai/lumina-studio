# Claude Design Prompt — Contacts List

Paste after `02-crm-design-master.md`.

**Purpose:** Browse, filter, and search every contact across all companies.
**Route:** `/app/crm/contacts`
**User:** Brand operator / business-development lead.
**Screen goal:** Find "who do I know at X" or "who's the decision-maker" in under 10 seconds.

## Layout

3-panel shell, reused. Same structural pattern as `02a-crm-companies-list.md` — this doc only calls out
what differs.

## Center workspace content

**Filter row:** Company, Role/title, "Has open deal" toggle.

**Search:** name/email — note `crm_contacts.email`/`.phone` are jsonb arrays (multiple values per contact),
so search matches any array entry, and the list row shows the **primary** entry only (first array item),
not all of them.

**List:** `Table` (avatar via shadcn `Avatar` + required `AvatarFallback`, name, company link, role/title,
primary email, last activity date) / card grid on mobile.

**New Contact** button opens an inline form (name, company picker, role, email, phone) — no wizard route.

## Right AI panel content

Same shape as `02a`: quick-facts + `EvidenceBlock` one-liner + `[Open]`/`[Log activity]`.

## Components

Reused: `OperatorShell`, `NavSidebar`, `IntelligencePanel`, `EvidenceBlock`, `PersistentChatDock`,
`Avatar`+`AvatarFallback`. New: `ContactCard` (mobile card variant, same anatomy as `CompanyCard`).

## States

Same pattern as `02a`: populated / empty (`Empty` — "No contacts yet") / loading (`Skeleton`) / error
(`Alert`) / filtered-empty.

## Mobile behavior

Same as `02a` — card list, filter sheet, panel becomes bottom sheet.

## Interactions

Same as `02a`. Company column is a link to Company Detail, not just text.

## Accessibility notes

Same as `02a`. Additionally: when a contact has multiple emails/phones (jsonb array), the primary one shown
in the list must be programmatically identifiable (not just "first in visual order") for assistive tech —
expose it via an accessible label like "Primary email: x@y.com".

## What NOT to build

- A contact merge/dedup UI — explicitly Later (`02-crm-architecture-brief.md`).
- A full multi-email/phone editor on this list screen — that's Contact Detail's job (`02d`).

## AI Context

| Layer | Tech | Usage |
|---|---|---|
| **Mastra agent** | `crm-assistant` | `searchContacts` |
| **Supabase** | `crm_contacts` | List/filter query |

## Implementation mapping

| Feature | Build step |
|---|---|
| Contacts list + filters + search | `05-crm-prd.md` §14.2 step 3 |

## React Reality Check

Same as `02a-crm-companies-list.md`, plus: `Avatar`/`AvatarFallback` — shadcn, not yet added to this
project's registry (verify with `npx shadcn@latest info` before build, per the `shadcn` skill's workflow).
