# Claude Design Prompt — Contact Detail

Paste after `02-crm-design-master.md` + `02c-crm-contacts-list.md`.

**Purpose:** The contact's full profile, activity history, and linked company/deals.
**Route:** `/app/crm/contacts/:id`
**User:** Brand operator / business-development lead.
**Screen goal:** Understand this person's relationship to us and what to do next.

## Layout

3-panel shell, reused. Workspace header: contact name + role/title + breadcrumb (`Contacts / {name}`).

## Center workspace content

**Overview block:** name, role/title, company link, **all** emails/phones from the jsonb arrays (each with
a type label — work/personal/mobile — and a "primary" indicator), `profile_id` link if this contact is also
a platform user (renders as a link to their operator profile, not a CRM-owned page).

**Tabs:** **Overview** · **Deals** (deals this contact is associated with, via the linked company) ·
**Activity** (this contact's slice of `crm_activities`, `contact_id`-scoped).

**AI Chat Dock:** context-aware — e.g. *"Sarah is the decision-maker at Acme. Last contact 12 days ago."*

## Right AI panel content

Context (name/company) → `crm-assistant`'s relationship-health flag for this contact (derived from the
linked deal's `scoreDealHealth`, not a separate per-contact scoring model — see "What NOT to build") →
`EvidenceBlock` → recent activity mirror.

## Components

Reused: `OperatorShell`, `IntelligencePanel`, `PersistentChatDock`, `EvidenceBlock`. No new components
beyond `02c`'s `ContactCard`.

## States

Populated / empty tabs (`Empty`) / loading (`Skeleton`) / error (`Alert`) — same pattern as `02b`.

## Mobile behavior

Tabs → horizontal scroll row. Panel → bottom sheet.

## Interactions

Tab switch client-side. Company link navigates to Company Detail. Deal rows navigate to Deal Detail.

## Accessibility notes

Multiple emails/phones are each individually labeled and keyboard-focusable — not a single unlabeled block
of text.

## What NOT to build

- Separate scoring dimensions like "response likelihood," "decision-maker score," or "buying signals" — none
  of these have a defined methodology yet (unlike `scoreDealHealth`, which is an explicit formula). If a
  reviewer asks for these again, they're Later/speculative, not MVP — reuse the deal-level health score
  instead of inventing new per-contact metrics.
- A relationship graph visualization on this screen — that's a separate, deferred, Later feature
  (`02-crm-architecture-brief.md`), not a Contact Detail sub-feature.

## AI Context

| Layer | Tech | Usage |
|---|---|---|
| **Mastra agent** | `crm-assistant` | `summarizeRelationship`, `logActivity` |
| **Supabase** | `crm_contacts`, `crm_deals`, `crm_activities` | Joined reads scoped to this contact |

## Implementation mapping

| Feature | Build step |
|---|---|
| Overview + Deals + Activity tabs | `05-crm-prd.md` §14.2 step 3 |
| AI summary | Step 6–7 |

## React Reality Check

Same as `02c-crm-contacts-list.md` — no additional components.
