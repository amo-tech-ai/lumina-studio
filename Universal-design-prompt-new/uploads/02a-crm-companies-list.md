# Claude Design Prompt — Companies List

Paste after `02-crm-design-master.md`.

**Purpose:** Browse, filter, and search every company relationship — prospects and already-converted brands
together — before drilling into one.
**Route:** `/app/crm/companies`
**User:** Brand operator / business-development lead.
**Screen goal:** Find a specific company, or scan the prospect list, in under 10 seconds.

## Layout

Standard 3-panel shell (`OperatorShell`, reused as-is): NavSidebar | Workspace | IntelligencePanel.
Workspace header: plain heading `Companies` + count (`PageHeader` not built — use a simple `<h1>` + `<p>`
muted count, per `00-design-audit.md`).

## Left nav behavior

`NavSidebar` gains one new entry: **CRM** (or "Relationships"), expandable to Companies/Contacts/Pipeline —
this is the only new nav item across all 6 CRM screens.

## Center workspace content

**Filter row** (inline `Select`/`ToggleGroup`, not a shared `FilterBar`): Status (`prospect`/`active`/
`inactive`/`lost`), Owner, Industry.

**Search** (plain `Input` + search icon, not a shared `SearchBar`): name/domain.

**List:** `Table` on desktop (columns: name, status badge, industry, owner, last activity date in mono
numerals, deal count), card grid on mobile/narrow — each card copies `brand-hub/brand-list-card.tsx`'s
anatomy (image-first if a logo exists, status badge on corner, `onOpen`).

**New Company** button (top-right, black primary) opens an inline create form (name, domain, industry,
owner) — no separate wizard route.

**AI Chat Dock:** context-aware greeting naming a concrete surfaced item — e.g. *"You have 4 companies with
no activity in 14+ days. Want me to draft a follow-up for the oldest one?"* — never "How can I help?".

## Right AI panel content (`IntelligencePanel`, reused as-is)

On row/card select (before opening full detail): quick-facts (status, owner, open deal count), one-line
`crm-assistant` summary via `EvidenceBlock`, actions `[Open]` (primary) + `[Log activity]` (outline).

## Components

Reused: `OperatorShell`, `NavSidebar`, `IntelligencePanel`, `EvidenceBlock`, `PersistentChatDock`. New:
`CompanyCard` (copies `brand-list-card.tsx` anatomy), inline filter `Select`s, search `Input`.

## States

- **Populated:** table/grid as above.
- **Empty (no companies yet):** shadcn `Empty` — "No companies yet" + `[Add a company]`.
- **Loading:** `Skeleton` rows/cards matching final layout.
- **Error:** `Alert` banner + Retry, never color-only.
- **Filtered-empty:** "No companies match these filters" + `[Clear filters]`.

## Mobile behavior

Table collapses to a card list (one `CompanyCard` per row, full width). Filter row collapses to a single
"Filters" trigger opening a `Sheet`. `IntelligencePanel` becomes a bottom sheet, trigger pill e.g.
"Insights".

## Interactions

Row/card click → select (panel updates) or open (navigates to Company Detail, click target depends on
zone, same convention as Brand List). Filter selects narrow the list live. New Company button opens an
inline create form, not a route change.

## Accessibility notes

- Status badges are never color-only — status name is always rendered as text inside the `Badge`.
- Table rows are keyboard-navigable; `Enter` opens the selected row.
- Loading skeletons use `aria-busy`.

## What NOT to build

- A CRM Dashboard landing page — this list *is* the CRM landing surface for now.
- A dedicated "New Company" wizard route — inline form only.
- Universal cross-entity search — this search box is Companies-only.

## AI Context

| Layer | Tech | Usage |
|---|---|---|
| **Mastra agent** | `crm-assistant` (🔴 not built) | `searchCompanies`, greeting summary |
| **CopilotKit** | `useAgent({ agentId: "crm-assistant" })` | Chat dock + panel |
| **Supabase** | `crm_companies` | List/filter query, `is_org_member(org_id)` RLS |

## Implementation mapping

| Feature | Build step |
|---|---|
| Companies list + filters + search | `05-crm-prd.md` §14.2 step 3 |
| `crm-assistant` greeting/summary | Step 6–7 (wave 1/2 tools) |

## React Reality Check

| Component | Status | Action |
|---|---|---|
| `OperatorShell` | 🟢 `operator-panel/operator-panel.tsx` | Reuse as-is |
| `NavSidebar` | 🟢 `operator-panel/nav-sidebar.tsx` | Add one CRM entry |
| `IntelligencePanel` | 🟢 `intelligence-panel/intelligence-panel.tsx` | Reuse as-is |
| `PersistentChatDock` | 🟢 `operator-panel/operator-chat-dock.tsx` | Reuse as-is |
| `EvidenceBlock` | 🟢 `evidence-block/evidence-block.tsx` | Reuse as-is |
| `CompanyCard` | 🔴 New | Copy `brand-hub/brand-list-card.tsx` anatomy |
| `FilterBar`/`SearchBar`/`StatusChip` | 🔴 Not built anywhere | Use shadcn `Select`/`ToggleGroup`/`Input`/`Badge` |
| `crm_companies` table, `crm-assistant` agent | 🔴 Not built | Required before live data/AI summary work |
