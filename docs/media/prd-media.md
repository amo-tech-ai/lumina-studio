# Media System PRD — AI-Native FashionOS

**Version:** 1.0
**Date:** 2026-06-25
**Status:** Product requirements. Pairs with [roadmap-media.md](roadmap-media.md) (sequencing) and [40-media-intelligence-plan.md](40-media-intelligence-plan.md) (schema source of truth).
**Grounded in:** repo migrations (117), `app/src/mastra/*`, [squareshot.md](../screenshots/squareshot/squareshot.md) (competitor audit + data model), image KB [02-image-types.md](02-image-types.md), video KB [11-video-plan.md](11-video-plan.md).

---

## 1. Problem & thesis

Studios and brands plan shoots blind: they don't know what assets a channel needs, whether their library has gaps, or which shots convert. Squareshot (the incumbent we audited) captures *what you ask for* through a manual brief — zero AI, zero brand context, zero quality check, a static 527-image reference library that never learns.

**iPix thesis:** the intelligence layer *above* the brief. We analyze the brand, tell the operator what to shoot (grounded in a spec DB, never invented), the human approves at every gate, then assets flow to commerce/social automatically.

**One sentence:** *Brand URL → AI-recommended, channel-complete shoot plan → human-approved production → DNA-scored delivery → auto-publish to Shopify/Amazon/social.*

**Three measurable outcomes (the only justification for any feature):**
1. Plan a compliant shoot in minutes, zero hallucinated specs → less rework.
2. Surface coverage gaps before booking → fewer reshoots.
3. Publish approved assets from one place → faster time-to-campaign.

---

## 2. What already exists (do NOT rebuild)

| Capability | State | Where |
|---|---|---|
| **Brand intelligence** | Built | `brands`, `brand_scores`, `brand_crawls`, `brand_crawl_results`, `brand_competitors`, `brand_social_channels`, `brand_graph_*`, `brand_agent_results` |
| **Shoot/booking data model** | Built (in `shoot` schema) | `shoots`, `shoot_intake_drafts`, `shoot_deliverables`, `shot_list`, `shoot_crew`, `shoot_assets`, `shot_deliverable_links` |
| **Shot reference library** | Built (~49 rows) | `shot_type_references` + `lookupShotReferences` tool (PR #98) |
| **Production-planner agent + wizard** | Built (foundation) | `production-planner` agent, `shoot-wizard` workflow, 7 planner tools |
| **AI memory** | Built (branch `ai/ipi-135`) | `getPlannerMemory`, `PlannerWorkingMemory`, PostgresStore |
| **Commerce links** | Built | `amazon_media_links`, `shopify_media_links`, `asset_links` |
| **Cloudinary assets** | Built | `cloudinary_assets`, `assets`, `asset_variants` |
| **Legacy spec table** | Built (legacy) | `media_size_specs` — keep, don't extend |
| **Stripe** | Built | commerce track |

**Net-new gap this PRD targets:** the **spec-grounding layer** (`image_specs` + `lookupChannelSpecs`), the **recommendation layer** (`media_recommendations`), **coverage scoring**, and **publishing automation** (Postiz). Everything else is wiring on top of what's built.

> Tenancy everywhere: `org_members` + `brands.org_id`. `shoot` schema not REST-exposed → browser reads via `public.*_view`, writes via service-role edge functions. (No `brand_members` table — that name in old docs is wrong.)

---

## 3. AI agent role — advisory expert, never autonomous

The AI is an **advisor/expert that recommends; the human decides.** This is the product's spine, not a setting.

| | |
|---|---|
| **Acts like** | Creative Director + Production Planner + Ecommerce Consultant + Channel Strategist |
| **Always does** | Recommends shoot type, deliverables, shot list, budget, asset mix — each grounded in DB rows + brand DNA, with confidence + reasoning |
| **Never does** | Write the DB directly · lock a plan · spend money · publish — all gated behind HITL approval cards and service-role edge functions |
| **Grounding rule** | Specs and references come from `image_specs`/`shot_type_references`. If the DB doesn't have it, the agent says so — it does not invent values |
| **HITL gates** | (1) Deliverables → (2) Shot list → (3) Budget → (4) Asset DNA review → (5) Publish. Nothing persists or ships before its gate |

**Why advisory, not autonomous:** every output touches money (shoots), brand reputation (published assets), or talent (crew). The cost of a wrong autonomous action dwarfs the cost of one approval click.

---

## 4. Tech stack — review & verdict

| Layer | Choice | Verdict |
|---|---|---|
| Frontend | React + Vite + TS + Tailwind + shadcn/ui | ✅ Keep. Matches repo. |
| AI chat/UI | **CopilotKit** | ✅ Keep for chat + generative UI (approval cards stream as components). Don't build a custom chat UI. |
| Agents/workflows | **Mastra** (`getMastra()` singleton, HITL workflow steps) | ✅ Keep. Reuse `shoot-wizard` pattern; don't add an orchestration framework. |
| LLM | **Gemini** via `resolveGeminiModel()` (centralized, never hardcoded) | ✅ Keep. Flash for structured extraction, Pro for reasoning. |
| Tools/agents | Typed Mastra tools (pure reads/drafts), 6 agents | ✅ Keep. New capabilities = **tools on existing agents**, not new agents. |
| DB | **Supabase Postgres** + RLS + Edge Functions | ✅ Keep. Writes via edge fns only. |
| **pgvector** | Embeddings for RAG | ⚠️ **Phase 3 only.** MVP grounds on structured spec tables — no embeddings needed to answer "what size is an IG post." Don't pay vector cost early. |
| Cloudinary | Asset storage/transform | ✅ Keep. Drives coverage + channel variants. |
| Stripe | Payments | ✅ Keep (commerce track). Deposits/milestones reuse existing. |
| Publishing | **Postiz** | ✅ One hub → IG/TikTok/FB/Pinterest/YouTube. Avoids 6 OAuth integrations. |

**Stack risk:** the only over-engineering temptation is pgvector + per-vertical agents + 14 direct integrations. All three are cut/deferred (see §10).

---

## 5. Image & video taxonomy — use cases by buyer

Source of truth: image KB [02-image-types.md](02-image-types.md), video KB [11-video-plan.md](11-video-plan.md), shot taxonomy in [squareshot.md](../screenshots/squareshot/squareshot.md). Buyer nuance is **seed data** (`industry_playbooks`), not code.

### 5.1 Shot categories (from the audited library)
Clothing (flat-lay / ghost / model) · Beauty (product / swatch / on-model) · Accessories · Home goods · AI services. Each angle carries a `channel_fit` (e.g. ghost-front → Shopify PDP + Amazon; lifestyle-outdoor → IG/TikTok/Editorial).

### 5.2 Buyer → required asset mix (seed rows, 5 verticals ship first)

| Buyer | Hero / PDP | Lifestyle / Social | Signature need | Primary channels |
|---|---|---|---|---|
| **Fashion designer / clothing** | Ghost + model full-body | Lifestyle indoor/outdoor, movement | Fit on real bodies, editorial | Shopify, IG, TikTok, Amazon |
| **Jewelry** | Macro hero on white, 45° | On-model worn, hand close-ups | Extreme macro, sparkle/detail | Shopify, IG, Pinterest |
| **Beauty / cosmetics** | Hero overhead, texture macro | On-model in-use, swatch spread | Swatches, splash/pour motion | Shopify, IG, TikTok, Amazon |
| **Luxury / accessories** | Hero white, detail hardware | Styled lifestyle, editorial | Material/craft close-ups | Shopify, IG, Editorial |
| **Handbags / shoes** | 45° hero, ghost/worn | On-model, scale reference | Worn-in-context, detail | Shopify, IG, Amazon |

Other 20+ verticals (food, hotels, real estate, automotive, etc.) = a **playbook insert when a customer appears**, not a subsystem now.

### 5.3 Video types & effectiveness
Reels/Stories (9:16, awareness/social) · Product demo & unboxing (PDP/conversion) · UGC/testimonial (trust/ads) · Brand story & editorial (campaign) · Runway/fashion-show (collection launch). Effectiveness is logged post-launch (Phase 3 perf loop) → raises future priority.

---

## 6. End-to-end journey (discovery → publish → measure)

This is the **production system** the user asked for — most stages map to tables that already exist.

```mermaid
flowchart LR
  A[Discovery: brand URL] --> B[analyzeBrandDna -> brand_scores]
  B --> C[Selection: channels + goal]
  C --> D[Recommend deliverables]
  D -->|HITL Gate 1| E[shoot_intake_drafts]
  E --> F[lookupShotReferences + lookupChannelSpecs]
  F --> G[Shot list draft]
  G -->|HITL Gate 2| H[Budget estimate]
  H -->|HITL Gate 3| I[commit edge fn -> shoots + shot_list + deliverables]
  I --> J[Crew/location/equipment assignment]
  J --> K[Production: asset upload -> cloudinary_assets]
  K --> L[score-shoot-asset DNA]
  L -->|HITL Gate 4| M[Editing/retouch + approval]
  M --> N[Channel variants via Cloudinary]
  N -->|HITL Gate 5| O[Auto-publish: Postiz / Shopify / Amazon]
  O --> P[Payment: Stripe deposits/milestones]
  P --> Q[Performance import -> raises future priority]
```

### Booking stakeholders (resource model = rows, AI matches)
Photographers · videographers · models (with measurements) · stylists · hair/makeup · producers · art directors · editors/retouchers · locations (indoor/outdoor/studio) · equipment (lighting/audio/camera) · props/wardrobe. The AI `matchShootCrew` tool recommends the team from the shot list; operator confirms. Squareshot proves the model-marketplace shape (talent pool + measurements + sourcing cost) — we mirror it as `shoot_crew`.

---

## 7. Frontend — screens, dashboards, chatbot

| Surface | Purpose | State |
|---|---|---|
| **Shoot Wizard** (chatbot-driven, CopilotKit) | Discovery → 5 HITL gates → commit. The product's core loop | Foundation built; add spec surfacing + recommendation cards |
| **Shoots Dashboard** | Kanban: Draft / Review / Approved / In-production / Delivered + AI "resume / next missing field" banner | Build on existing shoots data |
| **Shoot Workspace** (detail) | Tabs: brief · deliverables · shot list · crew · assets (realtime DNA) · publish | Build |
| **Asset Library** | Brand assets + reference library; AI search ("beauty close-ups for TikTok") | Cloudinary-backed |
| **Coverage Widget** | Gap score -> "book a shoot" CTA | Phase 2 |
| **Publishing Dashboard** | Approved assets -> channel queue (Postiz/Shopify/Amazon) with approval | Phase 3 |
| **Analytics Dashboard** | Asset/campaign performance -> feeds priority loop | Phase 3 |
| **Finance** | Deposits/milestones/invoices (Stripe) | Reuse commerce track |

**Chatbot = the wizard.** Don't build a separate assistant. Every recommendation renders as a generative-UI approval card (DeliverableApprovalCard, ShotListApprovalCard, BudgetApprovalCard), streamed.

**Four UI states required on every data surface:** loading / error / empty / success.

---

## 8. Backend — APIs, edge functions, jobs

| Concern | Approach |
|---|---|
| Agent tools | Pure reads/drafts in `app/src/mastra/tools/` — no DB writes |
| Writes | Service-role **edge functions** (`commit-approved-shoot`, `score-shoot-asset`, publish jobs) |
| RAG | pgvector over brand assets + briefs — **Phase 3** |
| Publishing jobs | `publish_jobs` queue -> Postiz API; export files for Shopify/Amazon first, native API on demand |
| Notifications/webhooks | Reuse existing patterns; Stripe webhooks already wired |
| Background | DNA scoring, perf import — edge fns / scheduled |

---

## 9. Database — net-new only (existing tables in §2)

Full DDL in [40-media-intelligence-plan.md](40-media-intelligence-plan.md) §2–3. New tables, all `public`. RLS model differs by table purpose:

| Table | Phase | RLS | Purpose |
|---|---|---|---|
| `platforms`, `image_type_defs`, `image_specs`, `recommendation_rules` | MVP | **Global reference** — no `brand_id`; one authenticated `SELECT` policy, writes seed-only | spec grounding (seed from image KB) |
| `video_type_specs`, `video_recommendation_rules` | P2 | **Global reference** — authenticated `SELECT` only | video grounding (seed from video KB) |
| `media_recommendations` | P2 | **Tenant-scoped** via `org_members`/`brand_id` | persisted agent output (priority/confidence/reasoning) |
| `industry_playbooks` | P2 | **Tenant-scoped** via `org_members`/`brand_id` | buyer -> asset mix (5 verticals) |
| `asset_coverage_scores` | P2 | **Tenant-scoped** via `org_members`/`brand_id` | gap score per brand |
| `publish_jobs` | P3 | **Tenant-scoped** via `org_members`/`brand_id` | publishing queue |
| embeddings (pgvector) | P3 | Tenant-scoped | RAG |

**Best-practice gate (per `ipix-supabase` skill):** every table — RLS enabled, `timestamptz`/`jsonb` only, seeds via hand-written migration (diff can't capture DML), reviewed by `migration-reviewer`. Global reference tables: FK + lookup-column indexes, authenticated read-only. Tenant tables: `brand_id`/`status` indexed, `org_members`-scoped policies. Spec values seeded **verbatim** from the KB — zero invented numbers.

---

## 10. Scope challenges (what we cut and why)

| Brief asked for | Decision | Why |
|---|---|---|
| 18 AI agents | **6 reused, 0 new for MVP** | Roles ≠ agents; consultants are playbook rows. Promote `media-advisor` only if planner prompt overflows |
| 28 business types | **5 verticals seeded; rest = inserts** | Adding a vertical is a migration row, not a release |
| 20 production services | **Existing taxonomy covers most**; drone/podcast/livestream = a row when booked | No subsystem for unbooked services |
| 14 integrations | **Cloudinary + Postiz + Stripe**; Shopify/Amazon via export files first | Postiz fans out to 6 socials; one integration not six |
| pgvector RAG in MVP | **Phase 3** | Structured spec tables ground the MVP without embeddings |
| Booking/Sales/CS/Finance agents | **Out of media scope** | CRM/commerce track (Mercur), not media |
| Full normalized 26-table ops schema | **Reuse existing `shoot` schema**; add 4 spec tables for MVP | The model is already built |

---

## 11. Acceptance (MVP)

- [ ] Operator: "image specs for Instagram feed?" -> planner answers `1080×1350, 4:5, JPEG/PNG ≤8MB` from `image_specs`, zero hallucination
- [ ] Unknown channel -> empty state, not a guess
- [ ] Spec rows surfaced in Shoot Wizard step 1 alongside existing shot-type suggestions
- [ ] All 5 HITL gates block persistence/publishing until approved
- [ ] Spec seed = KB verbatim; migration passes `migration-reviewer`; RLS = `org_members` predicate

---

## 12. Risks & assumptions

| # | Risk | Mitigation |
|---|---|---|
| R1 | Scope explosion (the brief) | Ship MVP (4 tables + 1 tool + wizard surfacing) first; gate the rest |
| R2 | RLS join-in-policy anti-pattern | Low-volume tables -> index `brand_id`; wrap in `public.user_brand_ids()` helper if perf bites |
| R3 | Spec staleness | `last_verified_at` on `image_specs`; tool warns >90 days |
| R4 | Duplicate `shoots` in `public` + `shoot` schema | Confirm which is canonical before new FKs; reads via `public.*_view` |
| R5 | Agent writes to DB | Architecturally blocked — writes only via edge fns |
| R6 | Linear views ([ai-intelligence](https://linear.app/amo100/view/ai-intelligence-da5702146a74), [brand](https://linear.app/amo100/view/brand-cf010b8aecb8)) | Use real IPI numbers from those views at planning time; never invent IDs (old docs collided with real issues) |
