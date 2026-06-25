# iPix Product Requirements Documents

Canonical PRDs for iPix product layers beyond the live MVP. Most are **design-ready** and specify a
layer to build after the approved 8-proof MVP; the **commerce/Stripe** PRDs are **P1** (the payments
+ commerce backbone). Some PRDs live in sibling folders (`../stripe/`, `../postiz/`, `../ecommerce/`)
and are path-linked here. The repo-wide north star remains [`../../prd.md`](../../prd.md); these PRDs
deepen specific verticals.

## Index

| PRD | ID | Layer | Status | Priority |
|---|---|---|---|---|
| [`shoot-prd.md`](./shoot-prd.md) | PRD-SHOOT-001 | **Shoot execution** — wizard, deliverables→shot list, crew, DNA handoff | Design-ready · **Phase 5** | P1 (post brand MVP) |
| [`campaign-prd.md`](./campaign-prd.md) | PRD-CAMPAIGN-001 | **Campaign & creative layer** — campaigns, briefs, moodboards, creative direction | Draft · **Phase 7** | P2 |
| [`openclaw-prd.md`](./openclaw-prd.md) | PRD-OPENCLAW-001 | **OpenClaw audit** — multi-channel comms + ops orchestration | Audit + recommendation, decision-ready | P2 (deferred Phase 3+) |
| [`../postiz/postiz-prd.md`](../postiz/postiz-prd.md) | PRD-POSTIZ-001 | **Postiz audit** — open-source publishing/scheduling engine | Audit + roadmap, decision-ready | P2 (post-MVP; Publishing stage) |
| [`../stripe/stripe-prd.md`](../stripe/stripe-prd.md) | PRD-STRIPE-001 | **Stripe audit** — payments backbone (commerce · marketplace · SaaS · AI billing) | Audit + architecture, decision-ready | P1 (payments backbone) |
| [`../ecommerce/prd-ecommerce.md`](../ecommerce/prd-ecommerce.md) | PRD-ECOMMERCE-001 | **iPix Commerce** — Mercur catalog, asset→product links, AI commerce | Draft (curated from mdeai) | P1 (commerce vertical) |
| [`prd-intelligence.md`](./prd-intelligence.md) | PRD-INTEL-001 | **Intelligence layer** — CopilotKit v2 + Mastra + HITL + operator dashboards | Canonical v2.1 (2026-06-25) | P1 (operator AI spine) |

## How the layers fit together

```
Brand → Brand Intelligence (Brand DNA)            [shipped — prd.md]
  → Campaign  ──────────────────────────────────  campaign-prd.md   (planning layer)
      → Creative Brief / Moodboard / Concepts      campaign-prd.md
      → (fan out) Shoots  ───────────────────────  shoot-prd.md      (execution layer)
          → Deliverables → Shot List → Assets → DNA Scoring
          → Asset DNA → AI content → Publishing  ──  ../postiz/postiz-prd.md (Postiz engine)
  → Marketplace (book studios/photographers/…)     ../shoot/shoot-research.md (separate track)

OpenClaw  ─────────────────────────────────────── openclaw-prd.md
  = comms/ops surface (WhatsApp/Slack concierge + cron) AROUND the cores above,
    NOT a replacement for the in-app stack.
Postiz    ─────────────────────────────────────── ../postiz/postiz-prd.md
  = headless publishing engine for the Publishing stage (Gemini thinks, Mastra
    orchestrates, CopilotKit approves, Postiz executes). NOT the brain or the UI.
Commerce  ─────────────────────────────────────── ../ecommerce/prd-ecommerce.md
  = Mercur catalog + asset→product links + AI commerce (CopilotKit ProductCards).
Stripe    ─────────────────────────────────────── ../stripe/stripe-prd.md
  = money source of truth (commerce · marketplace Connect · SaaS · AI billing).
    Supabase mirrors read-only via the Stripe Sync Engine — never authors money state.
Intelligence ──────────────────────────────────── prd-intelligence.md
  = CopilotKit v2 + in-process Mastra (`app/`) + Gemini edge fns + HITL drafts spine
    for every `/app/*` operator dashboard. 9-phase roadmap: Phases 1–4 platform/brand,
    Phase 5 shoots, Phase 6 assets, Phase 7 campaigns, Phase 9 advanced (RAG/MCP/browser).
```

**Boundaries (deliberate, to avoid an unmaintainable mega-product):**
- **Campaign** sits *above* **Shoot**: one campaign → many briefs → many shoots. The campaign PRD
  owns planning entities; the shoot PRD owns execution. They do not duplicate each other.
- **Marketplace** (booking studios/photographers/locations/equipment/stylists/models) is a
  *separate* track — see [`../shoot/shoot-research.md`](../shoot/shoot-research.md) and
  [`../shoot/prompt-plan.md`](../shoot/prompt-plan.md). The shoot↔marketplace seam is advanced
  crew matching only.
- **OpenClaw** is a comms/ops *layer*, not the product core.

## Shared architectural contract

Every PRD here inherits the same non-negotiables (from [`../shoot/00-ai-native-shoot-system.md`](../shoot/00-ai-native-shoot-system.md)):

- **Routes** under `/app/*` in the **Next.js operator app** (`app/`) — never `/dashboard/*` or Vite `:8080`.
- **Runtime:** In-process Mastra via `/api/copilotkit` — never standalone `:4111`.
- **Agents:** Mastra route agents (one per surface, e.g. `production-planner`, `creative-director`) — supervisor (**AIOR-020**) Phase 4+ only.
- **UI runtime:** CopilotKit v2 (`useAgent`, `useAgentContext`, `useRenderToolCall`).
- **HITL before every write:** AI produces reviewable drafts; workflows use **AIOR-018** snapshots; commit via edge fns.
- **Chain:** Agent → Workflow → HITL → Tool → Edge Fn → Supabase — never direct DB write.
- **System of record:** Supabase (Postgres + RLS + pgvector); single-owner `brands.user_id`.
- **Google ADK:** explicitly deferred — Mastra suspend/resume covers long-running workflows until
  a real need forces otherwise.

## Status & next steps

- **shoot-prd.md** — v1.1 · **Phase 5** in intelligence roadmap. Ready for design review
  (**IPI-84 · SHOOT-UX-001**). Prerequisites: **IPI-129**, **AIOR-018** on brand workflow, **IPI-51**.
  Open **D-1:** legacy FashionOS shoot tables vs `brand_id`-keyed schema.
- **campaign-prd.md** — v0.2 · **Phase 7**; sequence after Phase 5 shoot workspace. Land
  `campaigns` + `campaign_shoots` first; `creative-director` agent exists smoke-level in `app/`.
- **openclaw-prd.md** — recommendation: **Option B** (current stack + OpenClaw, Phase 3+, isolated
  per trust boundary). Verify repo health before any engineering commitment.
- **postiz-prd.md** *(lives in [`../postiz/`](../postiz/))* — adopt as the headless **Publishing**
  engine (`POSTIZ-001 — Postiz webhook → asset published`), self-hosted on Hostinger. **Gating
  constraint: AGPL-3.0** — internal use is clean, but any paid/white-label offering needs AGPL
  compliance or a Gitroom commercial license. Resolve licensing before external billing.
- **stripe-prd.md** *(lives in [`../stripe/`](../stripe/))* — payments backbone for commerce,
  marketplace (Connect Express), SaaS (Billing) and AI usage (Meters). **Key call:** Stripe = money
  source of truth, **Supabase mirrors read-only** via the Stripe Sync Engine (corrects the prompt's
  "payment tables in Supabase"). Colombia is unsupported by Stripe — deferred.
- **prd-ecommerce.md** *(lives in [`../ecommerce/`](../ecommerce/))* — iPix Commerce on Mercur;
  Supabase holds only `commerce_product_links` + intel. Prove a single-vendor paid order before
  marketplace/Connect work. Curated from mdeai (`SAN-*` Linear IDs → re-map to iPix `COM-*`).

## Conventions

- Reference Linear tasks in full: `IPI-XXX · TASK-ID — Full Task Name` (never bare IDs).
- PRDs change **docs only** — no production code, migrations, or schema edits in a PRD pass.
- Sibling source docs live in [`../shoot/`](../shoot/) (shoot system specs `00`–`14`, research).
