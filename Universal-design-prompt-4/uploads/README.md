# CRM — Claude Design Prompts

**Scope:** IPI-362 (Schema), IPI-363/364 (Companies/Contacts screens), IPI-365 (Pipeline board), IPI-366 (Deal Detail), IPI-367 (Won/Lost HITL gate), IPI-368/369 (`crm-assistant` agent). Linear project: [CRM — Relationship Layer](https://linear.app/amo100/project/crm-relationship-layer-6eaf40894535).

Visual system: v3 **Zeely Editorial** — pure white/`#FAFAFA`/hairline-grey, Inter, **black** primary CTAs, image-first. **Not** the orange/Geist system described in `app/design/00-README.md` — that file is stale for this and every current operator screen; verified against `tasks/design-docs/handoff/01-overview.md` and the shipped component code (2026-07-04).

## Instructions for Claude Design

### Step 1: Assess current design setup

Before generating anything:

1. Read `app/design/DESIGN.md` — product vision, architecture, design principles.
2. **Do not rely on `app/design/00-README.md`'s token table** (orange `#E87C4D` / Geist Sans) — it's outdated. Use the tokens below instead, sourced from `app/src/styles/tokens.css` and `tasks/design-docs/handoff/01-overview.md`.
3. Upload `app/src/styles/tokens.css` — design tokens source of truth.
4. Read `00-design-audit.md` (this folder) — confirms which shared components actually exist in `app/src/components/` (grep-verified, not assumed) vs. which are design-doc target names only.
5. **Read `06-crm-supabase-design-reference.md` (this folder)** — the backend/data reference. Says exactly which tables exist vs. are proposed, what fields and states are real, and what to never invent (contact status, a "health" column, Tasks/Communications/Meetings as separate tables). Read this before designing any screen that shows data, filters, or status — it's the single source of truth for "is this real" questions.
6. Read `02-crm-design-master.md` (this folder) — screen map, shared tokens, shadcn component substitutes, AI context.

**Corrected tokens for this module:**

| Token | Value | Use |
|---|---|---|
| Page background | `#FFFFFF` | Page |
| Surface | `#FAFAFA` | Cards, panels |
| Border | `#E5E7EB` | Hairlines — no shadows except transient overlays |
| Primary text | `#111111` | — |
| Secondary text | `#6B7280` | — |
| Primary action | `#111111` (black) | Buttons, links — **no orange** |
| HITL pending | Amber (`--approval-border`) | The *only* place amber appears — `won`/`lost` and draft approvals |
| Font | **Inter** (not Geist) | All UI text; mono numerals for deal values/dates/ids |

### Step 2: Create a plan

After assessment, propose a brief plan covering:
- Which of the 6 screens you'll generate (Companies List/Detail, Contacts List/Detail, Pipeline, Deal Detail)
- Which existing components you'll reuse (see Reality Check in Step 4 — most of the shell is real; several "canonical" names are not)
- What new components you'll build (`CompanyCard`, `ContactCard`, `PipelineBoard`, `DealCard`, `DealStageChip` — the only genuinely new ones)
- What states you'll cover (populated/loading/empty/error/mobile) per screen

### Step 3: Generate screens

Read order:

| Order | File | Covers |
|---|---|---|
| 1 | `00-design-audit.md` | Sitemap reconciliation (6 MVP screens vs. the master prompt's aspirational 20) + component reality check |
| 2 | `02-crm-design-master.md` | Master overview — screen map, routes, tokens, shadcn substitutes, AI context |
| 3 | `02a-crm-companies-list.md` | Companies List |
| 4 | `02b-crm-company-detail.md` | Company Detail (Overview/Contacts/Deals/Activity tabs) |
| 5 | `02c-crm-contacts-list.md` | Contacts List |
| 6 | `02d-crm-contact-detail.md` | Contact Detail |
| 7 | `02e-crm-pipeline.md` | Pipeline kanban board — the one net-new layout primitive |
| 8 | `02f-crm-deal-detail.md` | Deal Detail — the `won`/`lost` HITL gate, the safety-critical screen |

**Not in scope for this pass** (deferred by design, not missing — see `00-design-audit.md`'s reconciliation table): Tasks, Communications, Calendar, Documents, Analytics, Notifications, Settings, Relationship Intelligence, universal Search, a full CRM Dashboard.

### Step 4: Follow the Reality Check

`00-design-audit.md` documents which shared components are 🟢 real (verified by grep against `app/src/components/` on 2026-07-04) vs. 🔴 design-doc target names that don't exist yet:

| Component | Status | What to use instead |
|---|---|---|
| `OperatorShell`, `IntelligencePanel`, `PersistentChatDock`, `EvidenceBlock`, `ApprovalCard` | 🟢 real, reuse as-is | — |
| `PageHeader`, `FilterBar`, `SearchBar`, `StatusChip` | 🔴 not built anywhere | shadcn `Badge` / inline `Select`/`ToggleGroup` / `Input` (see `shadcn` skill) |
| `BrandCard` | 🟡 real file is `brand-hub/brand-list-card.tsx` | `CompanyCard`/`ContactCard` copy its anatomy, not a component literally named `BrandCard` |

Do not import a component that doesn't exist. Every screen prompt in this folder already specifies the correct shadcn substitute — follow it.

### Key rules

- All screens use the existing **3-panel shell** (`OperatorShell`) — one new `NavSidebar` entry for CRM, no new app shell.
- No Tasks/Communications/Calendar/Documents/Analytics/Notifications/Settings screens — see Step 3.
- `won`/`lost` is **always** behind an `ApprovalCard` — no screen may show a direct "mark won" action that skips it, including the Pipeline board's drag interaction.
- `EvidenceBlock` is the ONLY AI-explainability surface — no bespoke popovers.
- No voice mode, ever.
- `crm-assistant` (Mastra agent, 🔴 not built) is page-context-aware on every CRM screen via the existing `PersistentChatDock` — design its presence, mark it clearly as not-yet-wired.

### Output format

Full-page HTML prototype per screen, all listed states as toggle-able views, functional tab switching, mobile layout at the 1024px breakpoint — same convention as `app/design/prompts/`.

### Dependencies (Linear)

| Screen | Linear | Design file |
|---|---|---|
| Companies List + Detail | [IPI-363](https://linear.app/amo100/issue/IPI-363) | `02a`, `02b` |
| Contacts List + Detail | [IPI-364](https://linear.app/amo100/issue/IPI-364) | `02c`, `02d` |
| Pipeline board | [IPI-365](https://linear.app/amo100/issue/IPI-365) | `02e` |
| Deal Detail | [IPI-366](https://linear.app/amo100/issue/IPI-366) | `02f` |
| Won/Lost HITL gate | [IPI-367](https://linear.app/amo100/issue/IPI-367) | `02f` (ApprovalCard section) |
| `crm-assistant` agent | [IPI-368](https://linear.app/amo100/issue/IPI-368), [IPI-369](https://linear.app/amo100/issue/IPI-369) | `02-crm-design-master.md` AI Context |

## Audit & source of truth

This folder is a **copy** for Claude Design's direct access — the canonical, actively-maintained source is `tasks/crm/design/` in the repo root. If the two ever diverge, `tasks/crm/design/` wins; re-copy from there, don't edit here as the primary.

Full forensic audits: `tasks/crm/audit/01-audit.md` (PRD/brief/plans) · `tasks/crm/audit/02-linear-audit.md` (Linear issues). Product PRD: `tasks/crm/05-crm-prd.md`. Architecture: `tasks/crm/02-crm-architecture-brief.md`. Diagrams: `tasks/crm/diagrams/`.
