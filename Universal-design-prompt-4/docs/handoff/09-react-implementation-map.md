# 09 — React Implementation Map (for Claude Code)

> Per screen: page, components, APIs, agent, Supabase, Cloudinary, CopilotKit, Mastra, Gemini, acceptance. Stack assumptions are **proposals** — confirm against the live repo (`route-agent-map.ts`, `mastra/`, Supabase schema). Order → [10](10-implementation-order.md). Checklists → [11](11-screen-checklists.md).

## Stack (target)
Next.js (App Router) · Supabase (Postgres + Auth + Realtime + RLS) · Cloudinary (images) · CopilotKit (dock runtime) · Mastra (agents) · Gemini (generation/scoring). Tokens from `tokens.css` → Tailwind/CSS vars. Icons → Lucide.

## Design → React mapping matrix (D-DS18)
> One row per screen: DC prototype → React page → route → agent → owner → Linear → status. **Owner/Linear** are for Claude Code to fill in the code repo; **Design** is ✅ for the 13 built screens (see `DESIGN-TASKS.md §0` completion matrix). Keep this table as the single index; per-screen detail is below.

| DC prototype (`/`) | React page | Route | Agent | Owner | Linear | Design | React |
|---|---|---|---|---|:--:|:--:|:--:|
| `Command Center.v2…` | `(operator)/page.tsx` | `/app` | production-planner | _TBD_ | _TBD_ | ✅ | 🔴 |
| `Brand List.v2…` | `(operator)/brand/page.tsx` | `/app/brand` | brand-intelligence | _TBD_ | _TBD_ | ✅ | 🔴 |
| `Brand Detail.v2…` | `(operator)/brand/[id]/page.tsx` | `/app/brand/:id` | brand-intelligence | _TBD_ | _TBD_ | ✅ | 🔴 |
| `Shoots List.v2…` | `(operator)/shoots/page.tsx` | `/app/shoots` | production-planner | _TBD_ | _TBD_ | ✅ | 🔴 |
| `Shoot Detail.v2…` | `(operator)/shoots/[id]/page.tsx` | `/app/shoots/:id` | production-planner | _TBD_ | _TBD_ | ✅ | 🔴 |
| `Shoot Wizard.v2…` | `(operator)/shoots/new/page.tsx` | `/app/shoots/new` | production-planner (durable) | _TBD_ | _TBD_ | ✅ | 🔴 |
| `Campaigns.v2…` | `(operator)/campaigns/page.tsx` | `/app/campaigns` | creative-director | _TBD_ | _TBD_ | ✅ | 🔴 |
| `Assets.v2…` | `(operator)/assets/page.tsx` | `/app/assets` | creative-director | _TBD_ | _TBD_ | ✅ | 🔴 |
| `Matching.v2…` | `(operator)/matching/page.tsx` | `/app/matching` | social-discovery | _TBD_ | _TBD_ | ✅ | 🔴 |
| `Channel Preview.v2…` | `(operator)/preview/page.tsx` | `/app/preview` | visual-identity | _TBD_ | _TBD_ | ✅ | 🔴 |
| `Onboarding.v2…` | `onboarding/page.tsx` | `/onboarding` | brand-intelligence | _TBD_ | _TBD_ | ✅ | 🔴 |
| `Analytics.v2…` | `(operator)/analytics/page.tsx` | `/app/analytics` | production-planner | _TBD_ | _TBD_ | ✅ | 🔴 |
| `Campaign Performance.v2…` | `(operator)/analytics/[id]/page.tsx` | `/app/analytics/:id` | creative-director | _TBD_ | _TBD_ | ✅ | 🔴 |
| _new_ SCR-12/13/14/15/18 | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ | 🔴 | 🔴 |

**Shared React components** (build once, used by many — see dependency matrix in `03-component-map.md`): `<OperatorShell>`, `<NavSidebar>`, `<IntelligencePanel>`, `<EvidenceBlock>`, `<StatusChip>`, the 4 cards, `<EmptyState>`, `<SkeletonLoader>`, `<FilterBar>`, `<SearchBar>`, `<BottomNav>`, `<BottomSheet>`, `<ChatDock>`. These are **not** per-route — one component each.

---

## Global
- **OperatorShell** wraps all `/app/*` pages (NavSidebar + Workspace + IntelligencePanel + mobile tab/sheet). Auth gate + role (viewer/operator/admin) → RLS + UI gating (blocked state).
- **CopilotKit** provider at the shell; per-route agent + suggestions.
- **Realtime**: Supabase channel per active object → live/reconnecting/stale banner.

---

### Command Center `/app`
- **Page:** `app/(operator)/page.tsx`. **Components:** OperatorShell, ApprovalCard, BrandCard rows, realtime status strip.
- **APIs:** portfolio summary, pending approvals, realtime status. **Agent:** production-planner.
- **Supabase:** `brands`, `approvals`, `activity`. **Cloudinary:** brand covers. **CopilotKit:** dock + suggestions. **Gemini:** next-best-action.
- **Acceptance:** 5 states render; approvals approve/edit/reject; realtime banner reflects channel; nav works desktop+mobile.

### Brand List `/app/brand`
- **Page:** `app/(operator)/brand/page.tsx`. **Components:** BrandCard (3 variants), SearchBar, FilterBar, EmptyState, SkeletonLoader.
- **APIs:** list brands + DNA; client search/filter. **Agent:** brand-intelligence. **Supabase:** `brands`, `dna_scores`. **Cloudinary:** covers.
- **Acceptance:** search filters by name/brand/status + no-match; card/rail/Fix-now → `/app/brand/:id`; analysing per-card; non-durable retry.

### Brand Detail `/app/brand/[id]`
- **Page:** `app/(operator)/brand/[id]/page.tsx`. **Components:** DNA pillars, AssetCard (tile), ApprovalCard, StatusChip, breadcrumb, Plan-a-Shoot CTA.
- **APIs:** brand by id, DNA breakdown, assets, approvals; analysis trigger (determinate progress, **no resumable stream**). **Agent:** brand-intelligence. **Supabase:** `brands`, `dna_scores`, `assets`, `approvals`. **Gemini:** scoring + recs.
- **Acceptance:** loaded/analysing(n/47)/error(Retry·Report·Go back)/no-data; breadcrumb → list; Plan a Shoot → wizard with `?brand&campaign&season`.

### Shoots List `/app/shoots`
- **Page:** `app/(operator)/shoots/page.tsx`. **Components:** ShootCard, SearchBar, FilterBar. **Agent:** production-planner. **Supabase:** `shoots`, `brands`. **Cloudinary:** shoot covers.
- **Acceptance:** search+filter combine; Open → `/app/shoots/:id`; New → `/app/shoots/new`.

### Shoot Detail `/app/shoots/[id]`
- **Page:** `app/(operator)/shoots/[id]/page.tsx`. **Components:** 9 tabs, AssetCard, ApprovalCard, StatusChip, insights panel.
- **APIs:** shoot + shot_list + assets + crew + schedule + budget + approvals + deliverables + activity. **Agent:** production-planner. **Supabase:** `shoots`,`shot_list`,`crew`,`schedule`,`budget`,`approvals`,`deliverables`,`activity`,`assets`. **Cloudinary:** captured assets.
- **Acceptance:** resolves `:id`; 9 tabs; edit-shoot modal; View-in-Assets deep-link.

### Shoot Wizard `/app/shoots/new`
- **Page:** `app/(operator)/shoots/new/page.tsx`. **Components:** WizardStep, inline ChatDock, modals, toasts, Review dashboard.
- **APIs:** prefill from `?brand&campaign&season`; AI draft (brief/shots/crew/budget/timeline/call-sheet); scoring; create. **Agent:** production-planner (durable). **Supabase:** write `shoots/*`. **Gemini:** drafts. **CopilotKit:** per-step suggestions.
- **Acceptance:** hydrate+lock Step 2; live Review scoring; confirm → create → `/app/shoots/:id`; exit guard.

### Campaigns `/app/campaigns`
- **Page:** `app/(operator)/campaigns/page.tsx`. **Components:** CampaignCard, right-panel detail. **Agent:** creative-director. **Supabase:** `campaigns`, `deliverables`.
- **Acceptance:** card → panel (deliverables + timeline); search/filter.

### Assets `/app/assets`
- **Page:** `app/(operator)/assets/page.tsx`. **Components:** AssetCard (masonry+tile), FilterBar, grid/table toggle, right panel (AI analysis, channel readiness, quick actions), toast.
- **APIs:** assets + DNA match + channel readiness; `?shoot=` filter. **Agent:** creative-director. **Supabase:** `assets`, `dna_match`. **Cloudinary:** all media.
- **Acceptance:** card/row → panel; shoot chip filters + clears; actions (use/replace/download/preview).

### Matching `/app/matching`
- **Page:** `app/(operator)/matching/page.tsx`. **Components:** swipe deck, data table, StatusChip, shortlist drawer, toast. **Agent:** social-discovery. **Supabase:** `creators`, `shortlists`, `invites`.
- **Acceptance:** Save/Invite toasts + shortlist count; drawer Remove/Send-invites; persists across swipe/table.

### Channel Preview `/app/preview`
- **Page:** `app/(operator)/preview/page.tsx`. **Components:** phone frames, safe-zone toggle, channel checks, publish modal (select channels). **Agent:** visual-identity. **Supabase:** `publishes`. **External:** channel APIs.
- **Acceptance:** confirm select/deselect → count; progress per selected → success → `/app`.

### Onboarding `/onboarding`
- **Page:** `app/(marketing or onboarding)/onboarding/page.tsx`. **Components:** standalone funnel. **Agent:** brand-intelligence. **Supabase:** `brands`. **Cloudinary:** uploads. **Gemini:** DNA.
- **Acceptance:** funnel + validation; analysis → DNA payoff; Open FashionOS → `/app`.

## Open backend decisions (flag before build)
Exact Supabase schema + RLS policies; Mastra tool signatures + durability config (`durable.ts`); Cloudinary transform presets; channel-publish integrations; CopilotKit suggestion registration per route. None block UI build; all needed for data wiring.
