# Media System — Task Specs

**Updated:** 2026-06-25
**Companion to:** [todo.md](todo.md) (tracker) · [prd-media.md](prd-media.md) · [roadmap-media.md](roadmap-media.md)
**Format:** per `ipix-task-lifecycle` spec template — each task has *In plain terms · Steps · Wiring · Success criteria · Testing*.
**Conventions ground truth (from repo):**
- Mastra tool = `createTool({ id, description, inputSchema, outputSchema, execute })` from `@mastra/core/tools`; register in `app/src/mastra/tools/index.ts` (`agentTools`).
- **READ** tool → query Supabase with an RLS-scoped client directly (no edge). **WRITE** tool → `callEdgeFunction` after HITL approval, never write tables directly.
- Gemini model only via `resolveGeminiModel()`. Tenancy RLS = `org_members` + `brands.org_id`.
- Testing gates from `ipix-task-lifecycle` testing-matrix.

---

# MVP (Core) — full task cards

## MI-01 — Spec tables migration + seed

**Track:** Platform · **Blocked by:** — · **Unblocks:** MI-02, MI-04, MI-07, MI-12
**Skills:** ipix-supabase · ipix-task-lifecycle

### In plain terms
Create the four reference tables that hold platform image specs, and fill them with the exact numbers from the image knowledge base. This is the "source of truth" the AI reads so it never guesses an Instagram or Amazon spec.

### Steps to complete
- **A. Schema** — add `platforms`, `image_type_defs`, `image_specs`, `recommendation_rules` to a new migration `supabase/migrations/<ts>_media_spec_tables.sql`, `public` schema, columns verbatim from [02-image-types.md](02-image-types.md) §13.2. — proof: migration file
- **B. RLS** — enable RLS; SELECT policy `to authenticated using (true)` (reference data is global, not tenant-scoped); no insert/update/delete policy (seed-only). — proof: policy lines
- **C. Indexes** — index FKs (`image_type_id`, `platform_id`) + any `channel`/`slug` lookup column. — proof: `create index` lines
- **D. Seed** — hand-written `insert` statements from the KB (diff can't capture DML); add `last_verified_at timestamptz default now()` on `image_specs`. — proof: row counts match KB
- **E. Types** — `npm run supabase:gen-types` (or MCP `generate_typescript_types`); commit regenerated types. — proof: types diff

### Wiring plan
| Action | Path | Notes |
|--------|------|-------|
| Create | `supabase/migrations/<ts>_media_spec_tables.sql` | 4 tables + RLS + indexes + seed |
| Modify | `app/src/integrations/supabase/types.ts` | regen after migration |

### Success criteria
- [ ] **AC1** Four tables exist in `public` with KB-verbatim columns — proof: `supabase:verify` lists them
- [ ] **AC2** `image_specs` row for `instagram_feed` = `1080×1350, 4:5, JPEG/PNG ≤8MB` — proof: SQL select
- [ ] **AC3** RLS on; authenticated SELECT works, anon blocked — proof: `verify-rls`
- [ ] **AC4** Zero invented values — every seed row traces to a KB line — proof: spot-check 5 rows
- [ ] **AC5** `migration-reviewer` agent approves (RLS, indexes, rollback note)

### Testing (matrix: migration/new table)
- `npm run supabase:verify` · `npm run supabase:verify-rls` · `migration-reviewer` agent · manual `select` spot-check. No Vitest.

---

## MI-02 — `lookupChannelSpecs` tool

**Track:** AI · **Blocked by:** MI-01 · **Unblocks:** MI-03, MI-05
**Skills:** mastra · ipix-supabase

### In plain terms
A read-only AI tool: give it a list of channels (e.g. `["instagram_feed","amazon"]`), it returns the exact specs from the DB. The production-planner calls this instead of making numbers up. Mirrors the existing `lookupShotReferences` tool exactly.

### Steps to complete
- **A. Tool file** — create `app/src/mastra/tools/lookupChannelSpecs.ts` with `createTool`; `inputSchema` = `{ channels: z.array(channelEnum).min(1) }` (reuse the channel enum from `recommendShootType.ts`); `outputSchema` = array of `{ channel, image_type, width, height, aspect_ratio, file_formats, max_file_mb, last_verified_at }`. — proof: file
- **B. Query** — in `execute`, RLS-scoped Supabase select joining `image_specs ⋈ image_type_defs ⋈ platforms` filtered by channel. READ tool → query directly, no edge. — proof: query
- **C. Staleness** — if `last_verified_at` > 90 days, add a `warning` field to that row. — proof: field
- **D. Empty path** — unknown/unsupported channel → return `[]` (never fabricate). — proof: test
- **E. Register** — add to `agentTools` in `tools/index.ts`; planner instructions reference it before quoting any spec. — proof: registry diff

### Wiring plan
| Action | Path | Notes |
|--------|------|-------|
| Create | `app/src/mastra/tools/lookupChannelSpecs.ts` | read tool |
| Modify | `app/src/mastra/tools/index.ts` | register in `agentTools` |
| Create | `app/src/mastra/tools/lookupChannelSpecs.test.ts` | Vitest |

### Success criteria
- [ ] **AC1** `["instagram_feed"]` → one row `1080×1350, 4:5` from DB — proof: test
- [ ] **AC2** Unknown channel → `[]`, no thrown error, no invented value — proof: test
- [ ] **AC3** Multi-channel input returns one block per channel — proof: test
- [ ] **AC4** Spec >90 days old carries a `warning` — proof: test with seeded old row
- [ ] **AC5** Registered in `agentTools`; planner can call it — proof: registry + manual agent eval

### Testing (matrix: AI tool / logic module)
- `npm run test` (Vitest: happy path, empty channel, staleness, multi-channel) · manual agent eval ≥5 prompts ("specs for IG feed", "for Amazon", "for a made-up channel") · `npm run lint` · `npm run build`.

---

## MI-03 — Wizard step-1 spec surfacing

**Track:** UI · **Blocked by:** MI-02 · **Unblocks:** — (MVP exit)
**Skills:** copilotkit · frontend-design · ipix-wireframe

### In plain terms
In the existing Shoot Wizard step 1, when the operator picks channels, show the required image specs right next to the shot-type suggestions — so they see "Instagram feed needs 1080×1350, 4:5" before planning.

### Steps to complete
- **A. Wireframe** — sketch the step-1 panel: channel chips → spec list card beside existing shot-type suggestions (per `ipix-wireframe`). — proof: wireframe in PR
- **B. Hook** — call `lookupChannelSpecs` for the selected channels (via the planner agent / CopilotKit action); render results as a spec card. — proof: component
- **C. Four states** — loading (skeleton), error (retry), empty (unknown channel → "no spec on file"), success (spec rows). — proof: each state visible
- **D. Styling** — shadcn/ui card + Tailwind, matches existing wizard visual language (`frontend-design`). — proof: screenshot
- **E. Wire into wizard** — mount in `shoot-wizard` step 1 without breaking existing shot-type suggestions. — proof: regression smoke

### Wiring plan
| Action | Path | Notes |
|--------|------|-------|
| Create | `app/src/components/shoot/ChannelSpecCard.tsx` | presentational + states |
| Modify | shoot wizard step-1 component | mount card; pass selected channels |
| Create | `app/src/components/shoot/ChannelSpecCard.test.tsx` | RTL states |

### Success criteria
- [ ] **AC1** Selecting "Instagram feed" renders a card showing `1080×1350, 4:5, JPEG/PNG ≤8MB` — proof: browser
- [ ] **AC2** All four UI states render correctly — proof: screenshots
- [ ] **AC3** Unknown channel → empty state, not a crash or guess — proof: browser
- [ ] **AC4** Existing shot-type suggestions still work (no regression) — proof: smoke
- [ ] **AC5** Mobile breakpoint readable — proof: resize screenshot

### Testing (matrix: data-fetching React component)
- `npm run test` (RTL: 4 states) · browser smoke at `npm run dev` `:8080` (golden path + unknown channel + mobile resize) · `npm run lint` · `npm run build`.

### MVP exit gate
All three tasks green → operator asks "what specs for Instagram feed?" → grounded DB answer, zero hallucination. **MVP done.**

---

# Phase 2 (Enhanced) — task cards

> Detailed wiring is drafted when each task is picked up (avoids rot). Each carries description / key steps / success / testing now.

## MI-04 — `media_recommendations` table
- **In plain terms:** the table that stores an approved recommendation (which images/videos/ads/ecommerce assets a brand should make, with priority + confidence + reasoning).
- **Steps:** A) migration per [40-plan](40-media-intelligence-plan.md) §2.2 (public, RLS via `org_members`, writes service-role only); B) indexes on `brand_id`, `status`; C) regen types.
- **Success:** table + RLS exist; org member reads only own brand's rows; anon/auth cannot insert. 
- **Testing:** `supabase:verify` + `verify-rls`; `migration-reviewer`.

## MI-05 — `recommendImageTypes` tool
- **In plain terms:** ranks which image types a brand needs, from its channels + DNA + the spec tables.
- **Steps:** A) read tool `createTool`; B) score asset types against `recommendation_rules` + brand_scores; C) output ranked list w/ confidence + reasoning; D) register in `agentTools`.
- **Success:** returns ranked, grounded list; cites rule/spec rows; no inventions.
- **Testing:** Vitest (ranking, tie-break, empty); agent eval ≥5 cases.

## MI-06 — `recommendCreativeMix` tool
- **In plain terms:** recommends the content mix per channel (e.g. 40% lifestyle / 30% product / 30% UGC).
- **Steps:** A) read tool; B) derive mix from campaign type + playbook; C) output percentages + rationale; D) register.
- **Success:** percentages sum to 100; rationale references playbook.
- **Testing:** Vitest (sum invariant, per-campaign mix); agent eval.

## MI-07 — `industry_playbooks` table + seed (5 verticals)
- **In plain terms:** seed rows mapping each buyer (fashion, jewelry, beauty, luxury, accessories) to its required asset mix + channels.
- **Steps:** A) migration (public, RLS via `org_members` if tenant-tunable, else global read); B) seed 5 verticals from [prd-media.md](prd-media.md) §5.2 + [02-image-types.md](02-image-types.md); C) regen types.
- **Success:** 5 verticals seeded; tools can read them.
- **Testing:** `supabase:verify` + `verify-rls`; row spot-check.

## MI-08 — Recommendation HITL approval card
- **In plain terms:** the operator sees the AI's recommendation, edits/approves it; only then is it saved (via edge fn).
- **Steps:** A) CopilotKit `useInterrupt` approval card; B) on approve → `callEdgeFunction` writes `media_recommendations`; C) four UI states.
- **Success:** nothing persists before approve; edit then approve persists edited values.
- **Testing:** RTL (states + approve/reject); `verify-edge`; browser smoke.

## MI-09 — `recommendChannelAssets` tool (ecommerce)
- **In plain terms:** recommends the Amazon/Shopify asset set (hero, A+, gallery) for a product.
- **Steps:** A) read tool; B) map product type → marketplace asset checklist; C) output set + which are missing; D) register.
- **Success:** returns required vs. missing per marketplace.
- **Testing:** Vitest (per-marketplace checklist); agent eval.

## MI-10 — `scoreAssetCoverage` tool + `asset_coverage_scores` table
- **In plain terms:** scores how complete a brand's asset library is vs. what its channels need; stores the gap.
- **Steps:** A) migration for scores table; B) read tool compares existing `cloudinary_assets`/links vs. required set; C) write score via edge fn; D) register tool.
- **Success:** brand missing Amazon hero → gap surfaced with the missing list.
- **Testing:** Vitest (coverage math); `supabase:verify` + `verify-rls`; `verify-edge`.

## MI-11 — Coverage widget (dashboard)
- **In plain terms:** a dashboard card showing the coverage gap with a "book a shoot" CTA that pre-fills the wizard.
- **Steps:** A) wireframe (`ipix-wireframe`); B) data-fetching component reads `asset_coverage_scores`; C) CTA routes to wizard with gap pre-filled; D) four states.
- **Success:** gap renders; CTA opens wizard pre-filled.
- **Testing:** RTL (states); browser smoke (CTA → wizard).

## MI-12 — `video_type_specs` + `video_recommendation_rules` seed
- **In plain terms:** the video equivalent of MI-01, seeded from the video KB.
- **Steps:** A) migration per [11-video-plan.md](11-video-plan.md) §8.2–8.3 (public, RLS); B) seed verbatim; C) regen types.
- **Success:** video specs queryable; values KB-verbatim.
- **Testing:** `supabase:verify` + `verify-rls`; spot-check.

## MI-13 — `recommendVideoTypes` tool + wizard
- **In plain terms:** recommends video deliverables (reels, demo, UGC) the same way images work, surfaced in the wizard.
- **Steps:** A) read tool over `video_type_specs`; B) register; C) surface in wizard step (reuse MI-03 card pattern).
- **Success:** "what video for TikTok?" → grounded answer; renders in wizard.
- **Testing:** Vitest; agent eval; browser smoke.

## MI-14 — (Conditional) promote `media-advisor` agent
- **In plain terms:** only if the planner prompt gets too big, split media advice into its own agent.
- **Trigger:** planner instruction/tool surface overflows or eval quality drops.
- **Steps:** A) new `Agent` in `agents/index.ts` (id `media-advisor`, Gemini via `resolveGeminiModel`, own memory); B) move recommend* tools; C) register in Mastra + frontend agentId.
- **Success:** advice quality ≥ planner baseline; planner prompt shrinks.
- **Testing:** agent eval ≥5 cases vs. baseline; `build`.

---

# Phase 3 (Advanced) — task cards

## MI-15 — `publish_jobs` queue + Postiz publish (HITL gate 5)
- **In plain terms:** approved assets get queued and published to social via Postiz, after one approval.
- **Steps:** A) `publish_jobs` migration; B) publish edge fn → Postiz API; C) HITL approval before enqueue; D) status tracking + error handling.
- **Success:** approved set publishes via Postiz with one approval; failures retryable.
- **Testing:** `supabase:verify` + `verify-rls` + `verify-edge`; manual Postiz sandbox publish.

## MI-16 — Publishing Dashboard
- **In plain terms:** a screen to see approved assets, queue them per channel, and track publish status.
- **Steps:** A) wireframe; B) data-fetching views over `publish_jobs`; C) per-channel queue + approval; D) four states.
- **Success:** queue, approve, and status all visible.
- **Testing:** RTL; browser smoke.

## MI-17 — Shopify/Amazon export
- **In plain terms:** generate export files (CSV + asset bundles) for Shopify/Amazon first; native API only if needed.
- **Steps:** A) export builder from approved assets + `*_media_links`; B) channel-correct variants via Cloudinary; C) download/handoff.
- **Success:** valid Shopify CSV + Amazon-spec image bundle produced.
- **Testing:** Vitest (export shape); manual import dry-run.

## MI-18 — pgvector RAG over brand assets + briefs
- **In plain terms:** embeddings so recommendations can cite a brand's real past assets/briefs.
- **Steps:** A) enable pgvector + embeddings table; B) backfill embeddings; C) retrieval in recommend* tools; D) cite source asset.
- **Success:** a recommendation cites a real prior asset by id.
- **Testing:** retrieval eval (recall on known set); `supabase:verify`.

## MI-19 — Performance loop
- **In plain terms:** import channel performance, raise priority of asset types that perform, promote high-DNA assets to the reference library.
- **Steps:** A) perf import (edge/scheduled); B) priority adjustment in recommend*; C) high-DNA (≥80) → `shot_type_references`.
- **Success:** logged perf win bumps that asset type's next-shoot priority.
- **Testing:** Vitest (priority math); `verify-edge`; eval before/after.

## MI-20 — Analytics Dashboard
- **In plain terms:** views of asset/campaign performance feeding the priority loop.
- **Steps:** A) wireframe; B) data-fetching charts over perf data; C) four states.
- **Success:** performance renders; ties to recommendations.
- **Testing:** RTL; browser smoke.

---

## Required gates (every task — testing-matrix)
```bash
npm run lint
npm run build
npm run test               # when matrix marks Vitest
npm run supabase:verify     # after any Supabase touch
npm run supabase:verify-rls # after RLS/migration
npm run supabase:verify-edge# after edge deploy
```
Plus browser smoke for any UI/auth change. Every skipped gate gets a one-line justification in the task's Testing block.
