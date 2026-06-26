# Media System Plan — AI-Native FashionOS

**Version:** 1.0
**Date:** 2026-06-25
**Status:** Authoritative system plan. Answers the brief in [50-media-system-prompt.md](50-media-system-prompt.md).
**Defers to:** [40-media-intelligence-plan.md](40-media-intelligence-plan.md) for media-intelligence schema, tenancy, work-item IDs (MI-01…18). [02-image-types.md](02-image-types.md) §13 (image KB), [11-video-plan.md](11-video-plan.md) §8 (video KB).

> **How to read this doc.** The brief asks for an everything-platform: 18 agents, 28 business types, 20 production services, 14 integrations, 20 deliverables. The brief's own *Final Requirement* says challenge every feature. So this plan does not spec 18 agents — it grounds every line in what the repo already has, carves a real MVP, and pushes the rest to phases with explicit cuts. Where the brief and reality disagree, reality wins and the disagreement is named.

---

## 0. Verified ground truth (repo, 2026-06-25)

| Brief assumes | Reality | Source |
|---|---|---|
| Build 18 new agents | **6 agents exist**, reuse them: `production-planner`, `creative-director`, `social-discovery`, `public-marketing`, `visual-identity`, `extractVisualIdentity` | `app/src/mastra/agents/index.ts` |
| New shoot/booking flow | `shoot-wizard` workflow + 7 planner tools already run the shoot flow with HITL | `app/src/mastra/workflows/`, `tools/` |
| New AI memory layer | Memory foundation already on branch `ai/ipi-135` (`getPlannerMemory`, `PlannerWorkingMemory`, PostgresStore) | `app/src/mastra/memory` |
| `brand_members` RLS | **No such table.** Tenancy = `org_members` + `brands.org_id` | grep migrations |
| Spec tables to invent | Canonical names fixed: `platforms`, `image_type_defs`, `image_specs`, `recommendation_rules`, `video_type_specs` | [40-plan](40-media-intelligence-plan.md) §2 |
| `media_recommendations` exists | Net-new (MI-04) | grep migrations |
| Gemini model per call | Centralized: `resolveGeminiModel()`, Gemini-only, never hardcoded | `app/src/mastra/models` |

**Existing tools** (`app/src/mastra/tools/`): `recommendShootType`, `planDeliverables`, `generateShotListDraft`, `estimateShootBudget`, `approveShotList`, `saveApprovedShootDraft`, `explainShootDnaAlerts`, `edge`, `social-discovery`.

---

## 1. The one-paragraph product

FashionOS lets a studio operator turn a brand brief into a **platform-correct shoot plan and a publish-ready asset set**, with the AI grounding every spec/recommendation in the database (never invented) and a human approving before anything is saved or published. The wedge is the shoot wizard that already exists; everything else hangs off it.

**Measurable value (the only three that justify the build):**
1. Operator plans a compliant shoot in minutes, zero hallucinated specs → less rework.
2. Asset coverage gaps surfaced before a shoot is booked → fewer reshoots.
3. Approved assets publish to channels from one place → faster time-to-campaign.

If a feature doesn't move one of those three, it's Phase 3 or cut.

---

## 2. Architecture (modular monolith — no microservices)

```
React + Vite + TS + Tailwind + shadcn/ui
        │  CopilotKit (chat + generative UI, streaming)
        ▼
Mastra agents (getMastra() singleton, Gemini via resolveGeminiModel)
  ├─ tools  → read specs/KB, draft plans            (pure, no DB writes)
  └─ memory → PostgresStore (working + semantic recall)
        │  writes only through…
        ▼
Supabase: Postgres (RLS) · Edge Functions (service-role writes) · pgvector (RAG)
        │
        ├─ Cloudinary  (asset storage / transforms / coverage)
        └─ Postiz      (one publishing integration, not 8 direct APIs)
```

**Non-negotiable patterns (already in the codebase — reuse, don't reinvent):**
- Agents **never write the DB directly**. Writes go through service-role edge functions (the `saveApprovedShootDraft` / `approveShotList` pattern).
- `shoot` schema is **not** REST-exposed → browser reads via `public.*_view`, writes via edge fns. Media-intelligence tables live in `public` so agent + browser both reach them under RLS.
- One RLS predicate everywhere: `brand_id IN (SELECT b.id FROM brands b JOIN org_members m ON m.org_id = b.org_id WHERE m.user_id = auth.uid())`.
- HITL is a workflow step, not a UI afterthought: deliverables approved → shot list generated; nothing persists pre-approval.

---

## 3. Agents — 6 reused, not 18 built

The brief lists 18 agents. **Challenge:** most are roles, not agents — an "agent" only earns its own registry entry when its tool set + memory + prompt would otherwise bloat a sibling. Map first, build last.

| Brief agent | Decision | Where it lives |
|---|---|---|
| Creative Director | **Exists** | `creative-director` |
| Shoot Planner / Production Manager / Photographer & Videographer Assistant | **Exists, collapsed** into `production-planner` (it already sequences shoot type → deliverables → shot list → budget) | `production-planner` |
| Brand Strategist / Fashion·Jewelry·Beauty Consultant | **Exists, collapsed** into `visual-identity` + brand DNA. Industry nuance = playbook **data** (MI-07), not 4 agents | `visual-identity` |
| Campaign Planner / Publishing Manager | **Exists** | `social-discovery`, `public-marketing` |
| Ecommerce / Marketplace Specialist | **Tool, not agent** — `recommendChannelAssets` on `production-planner` (P2) | new tool |
| Analytics Agent | **Phase 3** — needs perf data that doesn't exist yet | — |
| Booking · Sales · Customer Success · Finance Agent | **Cut from media scope.** These are CRM/commerce, tracked on the Mercur/commerce track, not the media system | out of scope |

**Net:** 0 new agents for MVP. 1 promotion (`media-advisor`) in P2 **only if** the planner prompt gets too large (40-plan MI-08). Consultants stay as seeded `industry_playbooks` rows — one schema, infinite verticals, vs. one agent per vertical.

**Per-agent spec format** (applied to the 6, not 18) lives in [media-agent-plan.md](media-agent-plan.md) §2/§6–7 — responsibilities, inputs, outputs, tools, HITL points. Reuse it; ignore that doc's table names and IPI numbers.

---

## 4. Business types & production services — data, not code

28 business types and 20 production services do **not** mean 28×20 code paths. They are **rows**:
- Business type → `industry_playbooks` (MI-07): which asset types/content mix a vertical needs. Fashion, jewelry, beauty, luxury, accessories ship first (real demand); the other 23 are inserts when a customer appears.
- Production service → `image_type_defs` / `video_type_specs` already model photography/video/editorial/lifestyle/product/ecommerce/runway/lookbook/catalog. Drone, podcast, livestream, events = add a row when booked, not a subsystem now.

**ponytail:** one seed table per axis, seeded for the 5 verticals with paying intent. Adding a vertical is a migration insert, not a release.

---

## 5. MVP (Phase 1) — ship this first

**Goal:** operator gets platform-correct specs + a compliant shoot plan, fully grounded, with HITL. **No new agent. No new integration. No publishing.**

| ID | Work item | What | Reuse |
|---|---|---|---|
| MI-01 | Spec tables + seed | `platforms`+`image_type_defs`+`image_specs`+`recommendation_rules` in `public`, seeded from image KB, RLS via `org_members` | [40-plan](40-media-intelligence-plan.md) §3 |
| MI-02 | `lookupChannelSpecs` tool | `channels[] → spec rows`; mirrors existing `lookupShotReferences` exactly | planner tool pattern |
| MI-03 | Wizard step-1 surfacing | show required specs next to existing shot-type suggestions | `shoot-wizard` |

**MVP exit:** operator asks "what image specs for Instagram feed?" → planner answers `1080×1350, 4:5, JPEG/PNG ≤8MB` from `image_specs`, zero hallucination.

**MVP explicitly excludes:** `media-advisor` agent, discovery flow, coverage scoring, video, publishing, ecommerce sync, analytics, finance, 13 of 14 integrations, pgvector RAG. All have a phase below.

**MVP checklist:**
- [ ] MI-01 migration reviewed by `migration-reviewer`, RLS = `org_members` predicate, FKs + `brand_id`/`status` indexed
- [ ] Spec seed = image KB §13.2 verbatim (no invented values)
- [ ] MI-02 tool registered on `production-planner`, returns only DB rows
- [ ] MI-03 renders in wizard step 1 with loading/error/empty/success states
- [ ] One runnable test: spec lookup returns KB values for IG feed; unknown channel → empty, not guess

---

## 6. Phases (everything else, gated behind the MVP)

Each phase = Goal · Features · DB · Agents · Workflows · UI · Acceptance. Condensed; full DDL/Zod in [media-agent-plan.md](media-agent-plan.md) Appendix A with table names swapped to §0 above.

### Phase 2 — Enhanced (recommend + persist + coverage + video)

| Axis | Content |
|---|---|
| **Goal** | Agent ranks asset types and persists a recommendation; coverage gaps flagged before booking; video deliverables in the same wizard |
| **Features** | `recommendImageTypes`, `recommendCreativeMix`, `recommendChannelAssets` (ecommerce), `scoreAssetCoverage`, `recommendVideoTypes` |
| **DB** | MI-04 `media_recommendations` · MI-07 `industry_playbooks` (5 verticals) · MI-11 `asset_coverage_scores` · MI-13 `video_type_specs` seed |
| **Agents** | Still the 6. Promote `media-advisor` (MI-08) **only if** planner prompt overflows |
| **Workflows** | Recommendation = tool call inside shoot-wizard + HITL approve → write via edge fn |
| **UI** | Recommendation panel in Campaign/Shoot wizard; coverage widget on dashboard |
| **Acceptance** | Recommendation persists with `priority/confidence` only after operator approves; coverage widget shows gap → "book shoot" CTA; video specs answer like image specs |

### Phase 3 — Advanced (publish, RAG, analytics, optimize)

| Axis | Content |
|---|---|
| **Goal** | Approved assets publish to channels; AI cites brand history via RAG; perf data raises future priority |
| **Features** | Postiz publish from approved assets · pgvector RAG over brand assets/briefs · spec-compliance validation · perf import · high-DNA → `shot_type_references` promotion (MI-16…18) |
| **DB** | pgvector embeddings table (assets, briefs); `publish_jobs`; perf metrics import |
| **Agents** | `public-marketing` gains publish tool; `analytics` agent earns its entry once perf data exists |
| **Integrations** | **Postiz only** for social publish (1 integration fans out to IG/TikTok/FB/Pinterest/YouTube). Cloudinary already in. Shopify/Amazon via export files first, API later |
| **UI** | Publishing dashboard, analytics dashboard |
| **Acceptance** | Operator publishes an approved asset set through Postiz with HITL; RAG answer cites a real prior asset; a logged perf win bumps that asset type's next-shoot priority |

---

## 7. Integrations — 2 now, fan-out via Postiz, not 14 clients

| Integration | Phase | Why |
|---|---|---|
| Cloudinary | **In** | asset storage/transform/coverage — already wired |
| Stripe | existing | commerce track, not media scope |
| Postiz | P3 | **single** social-publish hub → IG/TikTok/FB/Pinterest/YouTube/Google Business. Avoids 6 OAuth integrations |
| Shopify / Amazon | P3 | start with **export files** (CSV/asset bundles), native API only on demand |
| WhatsApp / Chatwoot / Google Calendar | Cut from media scope | support/scheduling, not media |

**ponytail:** every "integration" in the brief that Postiz or an export file covers is not a separate build.

---

## 8. Data, RAG, memory — minimum that delivers grounding

- **RAG (pgvector):** P3, scoped to *brand assets + past briefs* so recommendations cite history. **Not** MVP — MVP grounds on the spec tables (structured), which need no embeddings. Don't pay for vector infra to answer "what size is an IG post."
- **Memory:** reuse the `ai/ipi-135` foundation (working memory + semantic recall on PostgresStore). No new memory layer.
- **Streaming:** CopilotKit streaming is the existing default; recommendations stream as generative UI cards.

---

## 9. User journeys & stories — one golden path, stubs for the rest

**Primary journey (Operator — the only one MVP must nail):**
Brief → pick channels → *see required specs* (MI-03) → recommend shoot type → approve deliverables (HITL) → shot list → budget → save draft. Every other persona (Brand Owner, Marketing Manager, Photographer, Stylist, Model, Editor, Finance, Admin) is a **read/approve view** on this same data — not a separate flow.

**User-story shape** (write per shippable unit, ≤10 ACs each, Given-When-Then, four UI states — per `ipix-task-lifecycle` planning rules):
> *As an operator, when I select Instagram + TikTok, then I see each channel's required image specs from the DB, so I plan a compliant shoot without guessing.* AC: specs match KB; unknown channel → empty state; values never invented.

Full story set is generated per MI-NN issue at planning time, not pre-written here (they rot before they're built).

---

## 10. Risks, assumptions, simplifications

| # | Risk / assumption | Mitigation |
|---|---|---|
| R1 | Scope explosion (the brief itself) | This plan ships 3 work items first; everything else gated. Re-challenge each phase before starting |
| R2 | RLS join-in-policy is the skill's anti-pattern | Low-volume tables → leave it + index `brand_id`; wrap in `public.user_brand_ids()` helper if perf bites |
| R3 | Spec staleness | `last_verified_at` on `image_specs`; tool warns when >90 days |
| R4 | Empty source briefs (`21-`, `31-` are 0 bytes) | Out of scope; don't block on them |
| R5 | Agent writes to DB | Architecturally prevented — writes only via edge fns |
| R6 | 14 integrations | Collapsed to Cloudinary + Postiz + export files |

**Simplifications made (challenge results):**
- 18 agents → 6 reused + 1 conditional promotion.
- 28 business types / 20 services → seed rows, 5 verticals first.
- 14 integrations → 2 + Postiz fan-out.
- Booking/Sales/CS/Finance agents → out of media scope (commerce track).
- RAG/pgvector → P3, not MVP.
- "Every deliverable as a full doc" → decision tables here; full prose pulled from existing KBs/`media-agent-plan.md` at build time.

---

## 11. Deliverables map (brief's 20 → where they live)

| # | Brief deliverable | Where |
|---|---|---|
| 1 Product architecture | §2 |
| 2 PRD | §1 + per-MI Linear issues |
| 3–6 Technical/Frontend/Backend/AI architecture | §2, §8 |
| 7 Database design | [40-plan](40-media-intelligence-plan.md) §2–3 |
| 8–9 User/stakeholder journeys | §9 |
| 10 User stories | §9 + per-MI issues |
| 11 Workflow diagrams | `shoot-wizard` + 40-plan; add mermaid per issue |
| 12 Agent specs | §3 + [media-agent-plan.md](media-agent-plan.md) §2,§6–7 |
| 13 Integration specs | §7 |
| 14 API design | edge-fn + tool contracts (per MI) |
| 15 AI prompt library | agent instructions in `agents/index.ts` + per-tool prompts |
| 16 Implementation roadmap | §5–6 |
| 17 MVP checklist | §5 |
| 18–19 Phase 2/3 roadmap | §6 |
| 20 Risks/assumptions/simplifications | §10 |

---

## 12. Next action

Build **MI-01 → MI-02 → MI-03** in order (§5). Create the Linear issues under IPI (real numbers, no invented IDs — see [40-plan](40-media-intelligence-plan.md) §5) at planning time via `ipix-task-lifecycle`. Everything in §6–7 stays on the shelf until the MVP exit criterion passes.
