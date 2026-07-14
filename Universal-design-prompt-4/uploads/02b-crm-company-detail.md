# Claude Design Prompt — Company Detail

Paste after `02-crm-design-master.md` + `02a-crm-companies-list.md`.

**Purpose:** The company's full relationship record — linked contacts, deals, and activity — plus the
convert-to-brand entry point once a deal is won.
**Route:** `/app/crm/companies/:id`
**User:** Brand operator / business-development lead.
**Screen goal:** See everything about this relationship and the next best action in one view, without
tab-hunting.

## Layout

3-panel shell, reused. Workspace header: company name + status `Badge` + breadcrumb (`Companies / {name}`).

## Center workspace content

**Overview block:** name, domain, industry, owner, status, `brand_id` link if already converted (renders as
a link to the existing Brand Detail screen — `/app/brand/:id` — not a CRM-owned page).

**Tabs** (plain shadcn `Tabs`, not a new tab primitive): **Overview** · **Contacts** · **Deals** ·
**Activity**.
- *Overview:* summary fields above + `EvidenceBlock` relationship summary (`summarizeRelationship`).
- *Contacts:* list of linked `crm_contacts` (reuses the Contacts List row/card shape, filtered to this
  company) + `[Add contact]`.
- *Deals:* list of linked `crm_deals` with stage `Badge`, value (mono numerals), + `[New deal]`.
- *Activity:* the unified `crm_activities` timeline (note/call/email/meeting/task/ai_summary) — one
  chronological list, newest first, each row shows a type icon + author + timestamp + body. This tab **is**
  the "Communications timeline" — there is no separate Communications screen (see `00-design-audit.md`).

**AI Chat Dock:** context-aware — e.g. *"Acme Co. has been quiet for 9 days. I can draft a follow-up — want
me to?"*

## Right AI panel content (`IntelligencePanel`, reused as-is)

Context (company name/status) → relationship health flag → next-best-action (`scoreDealHealth`,
`summarizeRelationship`) → any pending `ApprovalCard` (e.g. a drafted follow-up awaiting approval) →
`EvidenceBlock` → recent activity mirror.

## Components

Reused: `OperatorShell`, `IntelligencePanel`, `PersistentChatDock`, `EvidenceBlock`, `ApprovalCard`. New:
none beyond what `02a` already introduces (`CompanyCard` for the linked-contacts/deals sub-lists uses the
same row shapes as their own list screens).

## States

- **Populated:** tabs as above.
- **Prospect, not yet converted:** no `brand_id` link shown; instead a muted note "Not yet a brand" (no
  action button here — conversion only happens from Deal Detail on `won`, never a manual button on Company
  Detail, to keep the terminal-architecture decision in one place).
- **Empty tabs:** shadcn `Empty` per tab ("No contacts yet" / "No deals yet" / "No activity yet").
- **Loading:** `Skeleton` matching the tab layout.
- **Error:** `Alert` + Retry.

## Mobile behavior

Tabs become a horizontal scroll row. `IntelligencePanel` becomes a bottom sheet.

## Interactions

Tab switch is client-side, no route change. Contact/Deal row click navigates to that entity's Detail
screen. `[Add contact]`/`[New deal]` open inline forms, not new routes.

## Accessibility notes

- Tabs use `TabsList`/`TabsTrigger` (shadcn) — never custom-styled buttons standing in for tabs.
- Activity timeline entries are in a `role="feed"` list-equivalent structure with clear per-item timestamps
  for screen readers (not relying on visual proximity alone).

## What NOT to build

- A "Convert to brand" button on this screen — conversion is gated at Deal Detail's `won` transition only
  (`api/crm/deals/[id]/convert`), never a parallel manual action here.
- A Documents tab with real functionality — Documents management is Advanced/deferred; if a tab placeholder
  is shown at all, it must say "Coming later," not imply working upload.

## AI Context

| Layer | Tech | Usage |
|---|---|---|
| **Mastra agent** | `crm-assistant` | `summarizeRelationship`, `scoreDealHealth`, `logActivity` |
| **Gemini** | via `resolveModel()` | Relationship summary generation |
| **Supabase** | `crm_companies`, `crm_contacts`, `crm_deals`, `crm_activities` | Joined reads scoped to this company |

## Implementation mapping

| Feature | Build step |
|---|---|
| Overview + Contacts + Deals tabs (no AI) | `05-crm-prd.md` §14.2 step 3 |
| Activity tab | Step 3 (schema already covers unified activities) |
| AI summary / next-best-action | Step 6–7 |

## React Reality Check

Same table as `02a-crm-companies-list.md` — no additional components introduced beyond `Tabs` (shadcn,
already available per the `shadcn` skill's component list).
