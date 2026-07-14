# CRM Supabase Design Reference — for Claude Design

**Purpose:** Give Claude Design enough backend truth to design accurate CRM screens without inventing tables,
states, workflows, or capabilities that don't exist. **Design only** — no migrations, SQL, API code, or
React code are produced by this document.

**Verification method:** Every 🟢/🔴 status below was checked directly against the live Supabase project
(`nvdlhrodvevgwdsneplk`) via MCP (`list_tables`, `execute_sql`, `list_migrations`) on 2026-07-04, plus
`docs/linear/issues/IPI-362..370` and `tasks/crm/02-crm-architecture-brief.md`/`03-crm-existing-state-audit.md`.
Nothing here is asserted from memory or from a design-doc target name alone.

**Status legend:** 🟢 exists live · 🔴 proposed (schema not built — IPI-362 not started) · ⚪ future/Phase 2, no schema at all yet

---

## 1. CRM data concepts

| Concept | Is it a table? | Status |
|---|---|---|
| Companies | Yes — `crm_companies` | 🔴 proposed |
| Contacts | Yes — `crm_contacts` | 🔴 proposed |
| Deals | Yes — `crm_deals` | 🔴 proposed |
| Activities | Yes — `crm_activities` (unified) | 🔴 proposed |
| **Tasks** | **No** — a `crm_activities` row with `type = 'task'` | 🔴 proposed (as a type, not a table) |
| **Communications** (calls/emails/meetings) | **No** — `crm_activities` rows with `type = 'call'/'email'/'meeting'` | 🔴 proposed (as types, not a table) |
| **Notes** | **No** — a `crm_activities` row with `type = 'note'` | 🔴 proposed (as a type, not a table) |
| **Meetings** | **No** — a `crm_activities` row with `type = 'meeting'`; a dedicated Calendar/scheduling table is ⚪ future, not in MVP | 🔴 (as an activity type) / ⚪ (as a calendar system) |
| Notifications | Yes — extends existing `public.notifications` | 🟢 table exists · 🔴 CRM event types not added yet |
| Brand conversion | **No** — a write path (`api/crm/deals/[id]/convert`) that links/creates a row in the existing `brands` table | 🟢 `brands` exists · 🔴 convert route not built |
| **Relationship health** | **No** — a computed signal from a not-yet-built Mastra tool (`scoreDealHealth`), never a stored column | 🔴 tool proposed, no schema of its own |

**Read this before designing anything:** Tasks, Communications, Notes, and Meetings are **not four more
tables** — this was a repeatedly re-proposed idea (see `02-crm-architecture-brief.md`'s "frequently
re-proposed, already covered" note) and the answer is always the same: one unified `crm_activities` table
with a `type` column. Design a single chronological timeline component, not four separate lists.

---

## 2. Suggested table names

### `crm_companies` — 🔴 proposed

| | |
|---|---|
| Plain-English purpose | A company iPix has a relationship with — a prospect not yet a customer, or one already converted to a real `brands` row |
| Key fields for design | `name`, `domain`, `industry`, `status` (`prospect`/`active`/`inactive`/`lost`), `owner`, `brand_id` (nullable — populated only after conversion) |
| Relationships | Optionally linked to one `brands` row (nullable, one-way); has many `crm_contacts`, `crm_deals`, `crm_activities` |
| Screens | Companies List, Company Detail |
| States shown in UI | Status badge (4 values above); "not yet a brand" muted note when `brand_id` is null — **never** a manual "convert" button here, conversion only happens from Deal Detail |
| Permissions affecting design | Org-scoped — a company from another organization never renders, not even as an empty state; there is no per-company sharing/visibility control beyond org membership |
| Empty/loading/error | Empty: "No companies yet" + `[Add a company]`. Loading: skeleton cards. Error: inline banner + Retry |

### `crm_contacts` — 🔴 proposed

| | |
|---|---|
| Plain-English purpose | A person at a company (or unaffiliated) that iPix communicates with |
| Key fields for design | `name`, `company_id` (nullable), `profile_id` (nullable — set only if this person is also a platform user), `email`/`phone` as **arrays** (a person can have more than one of each, each entry tagged with a type like work/personal/mobile) |
| Relationships | Optionally linked to one `crm_companies` row; optionally linked to one `profiles` row; has many `crm_deals` (via company) and `crm_activities` |
| Screens | Contacts List, Contact Detail |
| States shown in UI | **No status field exists for contacts.** Do not design a status badge here — if a signal is needed, use a derived one like "has an open deal" (computed from related `crm_deals`, not a stored column) |
| Permissions affecting design | Org-scoped, same as companies |
| Empty/loading/error | Empty: "No contacts yet". Loading: skeleton rows. Error: inline banner. Each email/phone entry must be individually labeled (primary/type) since it's an array, not a single value |

### `crm_deals` — 🔴 proposed

| | |
|---|---|
| Plain-English purpose | A relationship's progress toward becoming a real brand engagement — the pipeline unit |
| Key fields for design | `company_id`, `stage` (`lead`/`qualified`/`proposal`/`negotiation`/`won`/`lost`), `value`, `currency`, `shoot_id` (nullable), `campaign_id` (nullable — inactive FK, no `campaigns` table exists yet), `owner`, `expected_close_date` |
| Relationships | Belongs to one `crm_companies` row; optionally linked to a `shoots` row (existing table) once won; has many `crm_activities` |
| Screens | Pipeline (kanban), Deal Detail |
| States shown in UI | 6-stage `DealStageChip`. **`won`/`lost` are the only two stages a UI action may never write directly** — see §8 rules |
| Permissions affecting design | Org-scoped. The `won`/`lost` transition is additionally gated by a required human approval step (`ApprovalCard`) — this is a design requirement, not just a backend one: every screen showing a stage control must render the approval flow, never a plain dropdown that writes on select for these two values |
| Empty/loading/error | Empty: "No deals yet" + `[New deal]", board columns still render. Loading: skeleton cards per column. Error: inline banner |

### `crm_activities` — 🔴 proposed

| | |
|---|---|
| Plain-English purpose | The one unified timeline for everything that happens on a relationship — notes, calls, emails, meetings, tasks, and AI-generated summaries |
| Key fields for design | `type` (`note`/`call`/`email`/`meeting`/`task`/`ai_summary`), `body`, `due_at`, `completed_at`, `company_id`/`contact_id`/`deal_id` (at least one is always set) |
| Relationships | Anchored to at least one of `crm_companies`/`crm_contacts`/`crm_deals` |
| Screens | The "Activity" tab on Company Detail, Contact Detail, and Deal Detail — same component, filtered by anchor |
| States shown in UI | A type icon per row (note/call/email/meeting/task/AI). **Task-like rows derive their state from dates, not a stored status:** `due_at` in the future or null → Pending; `due_at` in the past and `completed_at` null → Overdue; `completed_at` set → Completed. There is no `status` column to read |
| Permissions affecting design | Org-scoped |
| Empty/loading/error | Empty: "No activity yet" + `[Log activity]`. Loading: skeleton list. Error: inline banner |

### `public.notifications` — 🟢 exists (extended for CRM)

| | |
|---|---|
| Plain-English purpose | Platform-wide notification feed — CRM adds two new event kinds to the existing table, doesn't create a parallel one |
| Current `kind` values (verified live) | `booking_approved`, `booking_confirmed`, `booking_quoted`, `booking_requested` — **all booking-domain today; zero CRM kinds exist yet** |
| CRM adds | `deal_stage_changed`, `follow_up_due` |
| Relationships | Not directly FK'd to `crm_*` tables in the current design — payload carries the reference |
| Screens | No dedicated CRM notifications screen in this pass — the existing platform notification surface (wherever it's shown) picks these up for free once the new `kind` values exist |
| States shown in UI | Read/unread — `public.notification_reads` (per-user read table) **and** `list_notifications`/`mark_notifications_read` RPCs already exist live, but **no `app/src` route or UI calls them yet** — this is a pre-existing platform gap, not something CRM screens need to solve |
| Permissions | Org/user-scoped via existing RLS |
| Empty/loading/error | Not this module's concern — inherits whatever the existing notification surface already does |

### `brands` (existing) — 🟢 exists — brand-conversion target

| | |
|---|---|
| Plain-English purpose | The real, already-shipped brand record that Brand Intelligence, Shoots, and Campaigns all key off of |
| Verified live | 87 rows, org-scoped, RLS enabled |
| CRM's relationship to it | `crm_companies.brand_id` is a nullable FK into this table. A deal reaching `won` creates a new `brands` row (if none exists) or links the existing one — CRM never duplicates brand data |
| Design implication | Once `crm_companies.brand_id` is set, Company Detail shows a link to the **existing** Brand Detail screen (`/app/brand/:id`) — do not design a second "brand profile" surface inside CRM |
| Known legacy duplicate | `fashion_brands` also exists live (legacy, from an older casting-system migration) — **never** design against this table; it's out of scope and not a CRM concern to resolve |

### Relationship health — 🔴 not a table

| | |
|---|---|
| Plain-English purpose | A computed "how is this deal/relationship doing" signal shown in the IntelligencePanel |
| What it actually is | The output of a not-yet-built Mastra tool, `scoreDealHealth` — a deterministic formula (days-to-close, stage, value, last-activity age), not an LLM judgment and not a stored database column |
| Design implication | Never design a "health" field as if it were a database column with a fixed enum. Design it as a computed badge/score with a short explanation (`EvidenceBlock`), refreshed on view — the same pattern as an existing DNA score, not a static status pill |

---

## 3. Design impact — what each table enables in the UI

| Table/concept | List views | Detail pages | Cards | Filters | Timeline | Status chips | AI summaries | EvidenceBlock | ApprovalCard | Notifications | Chat context |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `crm_companies` | ✅ Companies List | ✅ Company Detail | ✅ `CompanyCard` | Status/Owner/Industry | — | ✅ status | ✅ relationship summary | ✅ | — (no direct approval here) | — | ✅ current company |
| `crm_contacts` | ✅ Contacts List | ✅ Contact Detail | ✅ `ContactCard` | Company/Role/Has-deal | — | — (no status field) | ✅ relationship summary | ✅ | — | — | ✅ current contact |
| `crm_deals` | ✅ Pipeline (kanban, not a plain list) | ✅ Deal Detail | ✅ `DealCard` | Owner/Value/At-risk | — | ✅ `DealStageChip` (6 stages) | ✅ health + next-best-action | ✅ | ✅ **required** for `won`/`lost` | — | ✅ current deal |
| `crm_activities` | — (no standalone list screen) | embedded as a tab | — | Type filter within the tab | ✅ the canonical use of this table | ✅ type icon, Pending/Overdue/Completed derived states | ✅ `ai_summary` type rows | — | ✅ for `draftFollowUp` output before it's logged | feeds `deal_stage_changed`/`follow_up_due` | ✅ `logActivity` tool |
| `public.notifications` | — (existing platform surface) | — | — | — | — | read/unread | — | — | — | ✅ this is the table | — |
| `brands` (conversion) | — | ✅ existing Brand Detail (link only) | — | — | — | — | — | — | ✅ the conversion itself is approval-gated | — | — |

---

## 4. CRM lifecycle states (design-safe)

| Concept | Design-safe states | Source of truth |
|---|---|---|
| Company status | `prospect` · `active` · `inactive` · `lost` | Stored column, `crm_companies.status` |
| Contact status | **None.** Do not design a contact status badge | No such column exists |
| Deal stage | `lead` → `qualified` → `proposal` → `negotiation` → `won` / `lost` | Stored column, `crm_deals.stage`; `won`/`lost` are terminal and approval-gated |
| Activity type | `note` · `call` · `email` · `meeting` · `task` · `ai_summary` | Stored column, `crm_activities.type` |
| Task status (derived, not stored) | Pending (no `due_at` or future) · Overdue (`due_at` past, `completed_at` null) · Completed (`completed_at` set) | Computed from two timestamp columns, not an enum |
| Communication type | Same as activity type, filtered to `call`/`email`/`meeting` | Same column as above — not a separate concept |
| Notification kind | Existing: `booking_approved`/`booking_confirmed`/`booking_quoted`/`booking_requested` (booking-domain, pre-existing). New for CRM: `deal_stage_changed`, `follow_up_due` | `public.notifications.kind` |

---

## 5. Screen-to-data matrix

| Screen | Data needed | Table concepts | UI components | AI context | Phase |
|---|---|---|---|---|---|
| CRM Dashboard | Deal counts/value per stage | `crm_deals` (aggregated) | Pipeline's own stage counts double as this — **no dedicated dashboard screen in MVP** | `crm-assistant` greeting only | Phase 2 (thin version) / Later (full widget dashboard) |
| Companies List | Company rows, filters | `crm_companies` | `CompanyCard`, filter row, search | `searchCompanies` | **Phase 1 (MVP)** |
| Company Detail | One company + linked contacts/deals/activities | `crm_companies`, `crm_contacts`, `crm_deals`, `crm_activities` | Tabs, `EvidenceBlock`, `IntelligencePanel` | `summarizeRelationship`, `logActivity` | **Phase 1 (MVP)** |
| Contacts List | Contact rows, filters | `crm_contacts` | `ContactCard`, `Avatar` | `searchContacts` | **Phase 1 (MVP)** |
| Contact Detail | One contact + linked deals/activities | `crm_contacts`, `crm_deals`, `crm_activities` | Tabs, multi-email/phone display | `summarizeRelationship` | **Phase 1 (MVP)** |
| Pipeline | All deals grouped by stage | `crm_deals` | `PipelineBoard`, `DealCard`, `DealStageChip` | `scoreDealHealth(focus: all\|at_risk)` | **Phase 1 (MVP)** |
| Deal Detail | One deal + activities + stage control | `crm_deals`, `crm_activities`, `brands` (on convert) | Stage control, `ApprovalCard`, timeline | `scoreDealHealth`, `draftFollowUp`, `moveDealStage` | **Phase 1 (MVP)** (won/lost gate is its own follow-up issue, same screen) |
| Tasks | Filtered `crm_activities` where `type='task'` | `crm_activities` | **No standalone screen** — a filtered view, design as a query state on an existing list, not a new table/screen | `logActivity` | Phase 2 (a dedicated "My Tasks" view is not MVP) |
| Communications | Filtered `crm_activities` where `type in (call,email,meeting)` | `crm_activities` | **No standalone screen** — already the Activity tab | — | N/A — already covered, not missing |
| Calendar / Meetings | Would need a new scheduling table | none exist | Not designed this pass | — | **Later/Advanced** — no schema, don't design |
| Relationship Intelligence | Advanced scoring beyond `scoreDealHealth` | none exist beyond the deal-health formula | Not designed this pass | — | **Later/Advanced** — no schema, don't design |

---

## 6. AI design reference

Every CRM screen shares one agent, `crm-assistant` (🔴 not built — `docs/linear/issues/IPI-368-crm-assistant-wave1.md`, `IPI-369-crm-assistant-wave2.md`), mounted via the existing `PersistentChatDock`. Design it consistently across screens, not per-screen bespoke behavior.

| Screen | CopilotKit chat context | IntelligencePanel context | Mastra/Gemini behavior (placeholder) | HITL approval points | AI may suggest | AI must never do automatically |
|---|---|---|---|---|---|---|
| Companies List/Detail | Current company id | Relationship summary, quick facts | `summarizeRelationship` (Gemini) | None on this screen | Enrichment suggestions, next-best-action | Convert to brand (that only happens via Deal Detail) |
| Contacts List/Detail | Current contact id | Relationship summary | `summarizeRelationship` (Gemini) | None on this screen | Flag decision-makers **only if** a defined methodology exists later — do not invent a score now | Any new scoring dimension without a defined formula |
| Pipeline | Whole-board summary, "at risk" query | Selected deal's health breakdown | `scoreDealHealth` (deterministic formula, Gemini narrates only) | None for ungated stage moves | Batch "which deals need attention" (one call, `focus: at_risk`) | Move any deal to `won`/`lost` — the board's own drag must no-op on those columns |
| Deal Detail | Current deal id | Health score, next-best-action, pending approvals | `scoreDealHealth`, `draftFollowUp` (Gemini, draft object only) | **Required**: `won`/`lost` transition; **required**: any outbound draft before it's logged | Draft a follow-up, suggest a stage move (non-terminal) | Set `won`/`lost` directly; send any drafted communication externally |

**Design placeholder wording for the not-yet-built agent:** greetings should name the active record and a
concrete next action — e.g. *"Acme Co. has been quiet for 9 days. Want me to draft a follow-up?"* — never a
blank "How can I help?", matching the existing Brand Intelligence agent's pattern.

---

## 7. MVP vs Phase 2 vs Future

| Tier | Includes |
|---|---|
| **MVP (design-safe now)** | `crm_companies`, `crm_contacts`, `crm_deals`, `crm_activities` schema; Companies/Contacts List+Detail; Pipeline; Deal Detail; the `won`/`lost` HITL gate; `crm-assistant` wave 1 + wave 2 tools listed above |
| **Phase 2 (backend-dependent, not yet scoped)** | A thin CRM Dashboard (stage counts + recent activity only); a dedicated "My Tasks" filtered view; contact merge/dedup |
| **Future/Advanced (no schema exists, do not design)** | Meetings/Calendar with external sync; Email/WhatsApp/SMS **send** integration (MVP only logs + drafts); Documents; a full HubSpot-style widget dashboard; dedicated Analytics/Reports; advanced Relationship Intelligence scoring (response-likelihood, decision-maker score, buying signals — none have a defined methodology); universal cross-entity search; a Relationship Graph visualization; tags |

---

## 8. Claude Design rules

- Design may use **fixtures** for any screen where the backend isn't implemented yet (everything in this
  document is 🔴 except the notification table/RPCs and `brands`/`organizations`). **Label fixture-only
  behavior clearly** in the prototype (e.g., a small "sample data" note), don't imply it's live.
- Do **not** design auto-send, auto-close, auto-convert, or auto-delete of anything. Every irreversible or
  outbound action is a human decision.
- **Human approval is required** for: a deal moving to `won`/`lost`, any outbound message (email/WhatsApp/etc.,
  even though sending isn't built yet — the draft-approval pattern still applies), and brand conversion.
  These three all route through the same `ApprovalCard` pattern already used elsewhere in the product —
  don't invent a new confirmation UI.
- Do **not** duplicate Brand, Booking, Shoot, or Asset concepts. CRM has no "brand profile," "booking," or
  "asset gallery" of its own — it links into the existing ones (`brands`, `shoots`, DAM/`assets`).
- CRM is a front door onto the existing product, not a parallel one. A won deal hands off to the existing
  Brand Detail/Shoot/Campaign screens — design the handoff (a link), not a reimplementation of what's on
  the other side of it.

---

## 9. Final outputs (this document's own index)

| Output | Section |
|---|---|
| CRM Supabase Design Reference | This document |
| Table concept matrix | §2 |
| Screen-to-data matrix | §5 |
| AI context matrix | §6 |
| Lifecycle/status matrix | §4 |
| Permissions/design-impact matrix | §3 (permissions called out per table in §2) |
| Missing backend validations Claude Code must verify later | See below |

### Missing backend validations for Claude Code to verify later (not Claude Design's concern)

- [ ] `crm_deals_guard_terminal_stage()` DB trigger actually exists and rejects direct `UPDATE` (design should assume it will, per §8, but implementation must prove it — `docs/linear/issues/IPI-362-crm-schema-rls.md`)
- [ ] RLS policies on all 4 new tables reviewed by `rls-policy-auditor`
- [ ] `crm_contacts.email`/`.phone` actually land as jsonb arrays, not text columns
- [ ] `crm_companies.brand_id` never gets FK'd into legacy `fashion_brands`
- [ ] `campaign_id` FK stays inactive/nullable until the `campaigns` table (IPI-268) exists
- [ ] Realtime subscription on `crm_deals` is filtered to `org_id`, never table-wide
- [ ] `list_notifications`/`mark_notifications_read` RPCs (confirmed live) actually get called from a CRM notification consumer, if one is ever built
- [ ] Cross-org negative RLS tests pass on all 4 tables

---

**Source docs this reference is built from:** `tasks/crm/02-crm-architecture-brief.md`, `tasks/crm/03-crm-existing-state-audit.md`, `tasks/crm/05-crm-prd.md`, `tasks/crm/plans/supabase-plan.md`, `tasks/crm/diagrams/01-data-model-er.md`, `docs/linear/issues/IPI-362..370`, and live Supabase MCP verification (2026-07-04).
