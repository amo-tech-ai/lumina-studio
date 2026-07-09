# Claude Design Prompt — CRM MVP: Master Overview

**Purpose:** Orientation file for the 6 screen-specific prompts in this directory — read this first
(plus [`00-design-audit.md`](./00-design-audit.md)), then paste the relevant `02a`–`02f` file into a
Claude Design session.

**Screens covered (6):** Companies List · Company Detail · Contacts List · Contact Detail · Pipeline
(kanban) · Deal Detail.

**Routes:** `/app/crm/companies` · `/app/crm/companies/:id` · `/app/crm/contacts` · `/app/crm/contacts/:id`
· `/app/crm/pipeline` · `/app/crm/pipeline/:id`.

**Users:** Brand operator / business-development lead (primary) — captures prospects, manages the pipeline,
converts a won deal into a real brand relationship.

**Agent:** `crm-assistant` (🔴 not yet built) — page-context-aware on every CRM screen, tools:
`searchContacts`/`searchCompanies`/`summarizeRelationship`/`scoreDealHealth`/`draftFollowUp`/`logActivity`/
`moveDealStage`. Never sends a communication or sets `stage = won/lost` without human approval.

---

## Corrections carried into every prompt in this directory

1. **No CRM screens exist today** — confirmed absent from `app/src` (`03-crm-existing-state-audit.md`).
   Every `02a`–`02f` prompt is a from-scratch screen, not a redesign.
2. **`PageHeader`/`FilterBar`/`SearchBar`/`StatusChip` are design-doc target names, not shipped
   components** — verified 🔴 not built (`00-design-audit.md`). Use shadcn primitives (`Badge`, inline
   `Select`/`ToggleGroup`, `Input` with a search icon) directly, same approach `11-model-booking.md` took
   for the same gap.
3. **`OperatorShell`, `IntelligencePanel`, `PersistentChatDock`, `EvidenceBlock`, `ApprovalCard` are real,
   shipped components** (verified paths in `00-design-audit.md`) — reused as-is everywhere below, never
   redesigned.
4. **`CompanyCard`/`ContactCard` copy the anatomy of `brand-hub/brand-list-card.tsx`** (image-first,
   status badge on corner, `onOpen`) — that's the real file; the design-doc's "`BrandCard`" name doesn't
   exist verbatim.
5. **No new app shell, no new nav pattern.** CRM adds one `NavSidebar` entry; every screen is an
   `OperatorShell` instance.

## Core rules (apply to all 6 sub-prompts)

- Reuse the existing 3-panel shell and **Zeely Editorial v3** visual language — pure white/`#FAFAFA`/`#111`,
  Inter, image-first, black primary actions, hairline borders. **No orange** (retired), amber reserved for
  HITL/attention only. This corrects the `frontend-design` skill's own stale cached description of iPix's
  design system (see `00-design-audit.md`).
- No Tasks/Communications/Calendar/Documents/Analytics/Notifications/Settings/Relationship-Intelligence/
  Search/Global-Command screens in this pass — see the Phase 1 audit for why each is deferred.
- No voice mode, ever.
- Never merge the IntelligencePanel (insights) and the chat dock (conversation) into one surface.
- A deal reaching `won`/`lost` is **always** behind an `ApprovalCard` — no screen may show a direct
  "mark won" button that skips it.

## Screen map

```mermaid
flowchart TD
  subgraph Shell["OperatorShell (existing, reused)"]
    NAV[NavSidebar - one new CRM entry]
    IP[IntelligencePanel]
    PCD[PersistentChatDock]
  end

  CL[/app/crm/companies] --> CD[Company Detail]
  CD --> CT[Contacts filtered by company]
  CD --> DL[Deals filtered by company]
  CTL[/app/crm/contacts] --> CTD[Contact Detail]
  PL[/app/crm/pipeline - kanban] --> DD[Deal Detail]
  CD --> DD
  CTD --> DD
  DD -->|won, HITL approved| BD["Company converts/links to brands row (existing Brand Detail)"]
```

## Shared design tokens (all 6 sub-prompts)

Reused verbatim from `tasks/design-docs/handoff/01-overview.md` — no new tokens invented for CRM.

| Element | Token / rule |
|---|---|
| Page background / surfaces | `#FFFFFF` page, `#FAFAFA` surfaces, `#E5E7EB` hairlines |
| Text | `#111` primary, `#6B7280` secondary |
| Primary action | Black (`--color-action:#111`) |
| Type | Inter (UI), mono numerals (`font-feature-settings:'tnum'`) for deal values/dates/ids |
| Card / image radius | ~20px (`--card-radius`) |
| Control radius | ~10px (`--radius-md`) |
| Elevation | 1px hairlines between surfaces; shadow only on transient overlays (Dialog/Sheet/Popover/toast) |
| Status dots (docs, not UI) | 🟢 ready/complete · 🟡 needs attention · ⚪ stale/not-started · 🔴 blocked/critical |
| Deal stage chip | `Badge` variant per stage — `secondary` for `lead`/`qualified`/`proposal`/`negotiation`, a distinct (non-red/green-only) treatment for `won`/`lost` so colorblind users aren't relying on hue alone — pair with the stage name as text, never color-only |
| AI confidence (EvidenceBlock) | Same 3-tier scale as `AI-EXPLAINABILITY.md` — high/mid/low, never color-only |
| HITL pending state | Amber (`--approval-border`) — the *only* place amber appears |

## shadcn components to use (per the `shadcn` skill's Component Selection table)

| Need | Component |
|---|---|
| Status pill (until `StatusChip` is built) | `Badge` with semantic variant |
| Company/Contact/Deal list | `Table` (desktop) / card list (mobile) |
| Kanban columns | `Card` composition (`CardHeader`/`CardContent`) per column, not a bespoke grid |
| Filters (until `FilterBar` is built) | Inline `Select` / `ToggleGroup` (2–7 stage options) |
| Search (until `SearchBar` is built) | `Input` + search icon via `data-icon="inline-start"` |
| Won/Lost approval | Compose inside the existing `ApprovalCard` — do not build a new `AlertDialog` for this |
| Empty states (no companies/contacts/deals yet) | `Empty` |
| Loading | `Skeleton` |
| Toast (e.g. "Company created") | `sonner`'s `toast()` |
| Avatar (contact) | `Avatar` + required `AvatarFallback` |

## Output format (all 6 sub-prompts)

Full-page HTML prototype per screen, all listed states as toggle-able views, mobile layout at the 1024px
breakpoint — same generation convention as the rest of `tasks/models/design/`.

## AI Context (all sub-prompts)

| Layer | Tech | Usage |
|---|---|---|
| **Mastra agent** | `crm-assistant` (🔴 not built) | Search, health scoring, drafting, activity logging, stage moves |
| **CopilotKit** | `useAgent({ agentId: "crm-assistant" })` + page-context injection | Chat in `PersistentChatDock`, insights in `IntelligencePanel` |
| **Gemini** | via `resolveModel()` | `summarizeRelationship`, `draftFollowUp` |
| **EvidenceBlock** | shared component | Relationship-summary / enrichment explainability |
| **ApprovalCard** | shared component | `won`/`lost` gate, outbound-draft gate |
| **Supabase** | `crm_companies`/`crm_contacts`/`crm_deals`/`crm_activities` | All reads/writes, RLS via `is_org_member` |
| **Realtime** | Supabase Realtime on `crm_deals` | Live pipeline board |

## Implementation mapping

| Design screen | PRD route | Build step (`05-crm-prd.md` §14.2) |
|---|---|---|
| Companies List | `/app/crm/companies` | Step 3 |
| Company Detail | `/app/crm/companies/:id` | Step 3 |
| Contacts List | `/app/crm/contacts` | Step 3 |
| Contact Detail | `/app/crm/contacts/:id` | Step 3 |
| Pipeline | `/app/crm/pipeline` | Step 4 |
| Deal Detail | `/app/crm/pipeline/:id` | Step 5 |

No Linear epic exists yet (`05-crm-prd.md` frontmatter) — screens map to PRD build steps, not issue numbers.

## Related task docs

`tasks/crm/02-crm-architecture-brief.md` · `tasks/crm/05-crm-prd.md` · `tasks/crm/diagrams/` ·
`tasks/design-docs/handoff/01-overview.md` (visual system) · `tasks/design-docs/handoff/03-component-map.md`
(target component names — cross-check against `00-design-audit.md`'s verified reality check, not this doc
alone).
