# Media System — Todo & Progress Tracker

**Updated:** 2026-06-25
**Source:** [prd-media.md](prd-media.md) · [roadmap-media.md](roadmap-media.md) · [40-media-intelligence-plan.md](40-media-intelligence-plan.md)
**Status key:** ✅ done · 🟡 in progress · ⚪ not started · ⛔ blocked
**ID note:** internal `MI-NN` IDs. Fill real `IPI-<n>` from Linear [ai-intelligence](https://linear.app/amo100/view/ai-intelligence-da5702146a74) / [brand](https://linear.app/amo100/view/brand-cf010b8aecb8) views at issue creation — never invent numbers.

---

## Already built (do NOT rebuild — verified in repo)

| ✅ | Capability | Where |
|---|---|---|
| ✅ | Brand intelligence | `brands`, `brand_scores`, `brand_crawls`, `brand_competitors`, `brand_social_channels`, `brand_graph_*` |
| ✅ | Shoot/booking data model | `shoot` schema: `shoots`, `shoot_intake_drafts`, `shoot_deliverables`, `shot_list`, `shoot_crew`, `shoot_assets` |
| ✅ | Shot reference library + tool | `shot_type_references` (~49 rows) + `lookupShotReferences` (PR #98) |
| ✅ | production-planner agent + shoot-wizard | `app/src/mastra/agents`, `workflows/shoot-wizard.ts` |
| ✅ | AI memory foundation | `getPlannerMemory`, `PlannerWorkingMemory` (branch `ai/ipi-135`) |
| ✅ | Commerce links | `amazon_media_links`, `shopify_media_links`, `asset_links` |
| ✅ | Cloudinary + Stripe | `cloudinary_assets`, `assets`, `asset_variants`; Stripe (commerce track) |

---

## Tech stack (locked — see [prd-media.md](prd-media.md) §4)

Frontend: React · Vite · TS · Tailwind · shadcn/ui · **CopilotKit**
AI: **Mastra** (`getMastra()` singleton, HITL workflow steps) · **Gemini** (`resolveGeminiModel()`) · typed tools on existing agents
Backend: **Supabase** Postgres + RLS + Edge Functions · pgvector (P3 only)
Assets/pay/publish: **Cloudinary** · **Stripe** · **Postiz**

---

## MVP (Core) — grounded specs, no new agent, no publishing

> Exit: "image specs for Instagram feed?" → `1080×1350, 4:5, JPEG/PNG ≤8MB` from DB; unknown channel → empty, not a guess.

| Seq | ID | Status | Task | Blocked by |
|---|---|---|---|---|
| 1 | MI-01 | ⚪ | Spec tables migration + seed: `platforms`, `image_type_defs`, `image_specs`, `recommendation_rules` (public, RLS via `org_members`, seed verbatim from image KB) | — |
| 2 | MI-01a | ⚪ | `migration-reviewer` pass: RLS predicate, FK + `brand_id`/`status` indexes, `timestamptz`/`jsonb` only | MI-01 |
| 3 | MI-02 | ⚪ | `lookupChannelSpecs` tool (`channels[] → spec rows`), mirror `lookupShotReferences`; register on `production-planner` | MI-01 |
| 4 | MI-03 | ⚪ | Shoot Wizard step-1: surface required specs next to shot-type suggestions (loading/error/empty/success) | MI-02 |
| 5 | MI-03t | ⚪ | Test: IG-feed lookup returns KB values; unknown channel → empty | MI-02 |

---

## Phase 2 (Enhanced) — recommend, persist, coverage, video

> Exit: brand missing Amazon hero shots → coverage widget shows gap → wizard pre-fills recommended mix → operator approves → `media_recommendations` row persists.

| Seq | ID | Status | Task | Blocked by |
|---|---|---|---|---|
| 6 | MI-04 | ⚪ | `media_recommendations` table (image/video/ad/ecommerce mix, priority + confidence + reasoning; RLS via `org_members`) | MI-01 |
| 7 | MI-05 | ⚪ | `recommendImageTypes` tool (rank asset types from specs + brand DNA) | MI-04 |
| 8 | MI-06 | ⚪ | `recommendCreativeMix` tool (content mix per channel) | MI-04 |
| 9 | MI-07 | ⚪ | `industry_playbooks` table + seed 5 verticals (fashion, jewelry, beauty, luxury, accessories) | MI-01 |
| 10 | MI-08 | ⚪ | Recommendation HITL approval card → persist via edge fn | MI-04 |
| 11 | MI-09 | ⚪ | `recommendChannelAssets` tool (ecommerce: Amazon/Shopify asset sets) | MI-07 |
| 12 | MI-10 | ⚪ | `scoreAssetCoverage` tool + `asset_coverage_scores` table (gap vs. channels) | MI-04, MI-07 |
| 13 | MI-11 | ⚪ | Coverage widget on Shoots Dashboard → "book a shoot" CTA | MI-10 |
| 14 | MI-12 | ⚪ | `video_type_specs` + `video_recommendation_rules` seed from video KB | MI-01 |
| 15 | MI-13 | ⚪ | `recommendVideoTypes` tool + video specs in wizard | MI-12 |
| 16 | MI-14 | ⚪ | (Conditional) promote `media-advisor` agent — only if planner prompt overflows | MI-05…09 |

---

## Phase 3 (Advanced) — publish, RAG, performance loop

> Exit: operator publishes an approved set via Postiz in one approval; logged perf win raises that asset type's next-shoot priority; RAG answer cites a real prior asset.

| Seq | ID | Status | Task | Blocked by |
|---|---|---|---|---|
| 17 | MI-15 | ⚪ | `publish_jobs` queue + Postiz publish (HITL gate 5) → IG/TikTok/FB/Pinterest/YouTube | P2 done |
| 18 | MI-16 | ⚪ | Publishing Dashboard (approved assets → channel queue + approval) | MI-15 |
| 19 | MI-17 | ⚪ | Shopify/Amazon export files (CSV/asset bundles); native API on demand | MI-15 |
| 20 | MI-18 | ⚪ | pgvector RAG over brand assets + past briefs (recommendations cite history) | MI-04 |
| 21 | MI-19 | ⚪ | Perf import → bump asset-type priority; high-DNA → `shot_type_references` promotion | MI-15 |
| 22 | MI-20 | ⚪ | Analytics Dashboard (asset/campaign performance) | MI-19 |

---

## Current tasks (now)

- 🟡 Planning docs landed: [prd-media.md](prd-media.md), [roadmap-media.md](roadmap-media.md), [40-media-intelligence-plan.md](40-media-intelligence-plan.md), [51-media-system-plan.md](51-media-system-plan.md), this tracker.
- ⚪ **Next:** MI-01 — draft the spec tables migration + KB seed.
- ⚪ Then: MI-02 → MI-03 to hit the MVP exit criterion.

---

## Gates (per `ipix-task-lifecycle`)

- Migrations before UI; edge fn deployed + verified before client calls it.
- Re-challenge each phase before starting: needed now? simpler? reuse existing? measurable value?
- Phase N+1 stays shelved until Phase N exit criterion passes.
