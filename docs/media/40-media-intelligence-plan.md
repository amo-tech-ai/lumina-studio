# Media Intelligence — Reconciled Build Plan

**Version:** 1.0
**Date:** 2026-06-25
**Status:** Authoritative. Supersedes `strategy.md` and `media-agent-plan.md` for **schema, tenancy, work-item sequencing, and issue numbering.**
**Canonical references (unchanged):** `02-image-types.md` (image KB + schema §13) · `11-video-plan.md` (video KB + schema §8).

> Why this doc exists: `strategy.md` and `media-agent-plan.md` were written in parallel and disagree on table names, redefine `media_recommendations` with conflicting columns, invent Linear issue numbers that collide **with each other and with real issues** (e.g. `IPI-184` is already "SHOOT-DATA-002 · Shot Type Reference Library"), and specify RLS against a `brand_members` table that does not exist. This doc is the single source of truth. The two originals are kept for prose/persona detail only.

---

## 1. Verified ground truth (checked against the repo, 2026-06-25)

| Claim in old plans | Reality | Source |
|---|---|---|
| "four production agents" | **Six** agents exist: `production-planner`, `creative-director`, `social-discovery`, `public-marketing`, `visual-identity` (+ `extractVisualIdentity` sub-agent) | `app/src/mastra/agents/` |
| Tables `platform_image_specs` / `image_types` (strategy.md) | Do not exist; **not** the KB names | grep migrations |
| Canonical spec tables | `platforms`, `image_type_defs`, `image_specs`, `recommendation_rules` | `02-image-types.md §13.2` |
| RLS via `brand_members` | **No such table.** Tenancy is `org_members` + `brands.org_id` | grep migrations; `visual-identity.test.ts` |
| `media_size_specs` | Exists + seeded; legacy | migration `20251129061555…` |
| `brand_scores`, `brand_social_channels` | Exist in `public` | migrations |
| `shot_type_references` + `lookupShotReferences` tool | **Already built** (49 rows, `shoot` schema, `*_view` exposed) on PR #98 | `docs/plan/notes/notes-1.md` |
| `media_recommendations` | Does not exist yet (net-new) | grep migrations |

**Tenancy pattern (use this everywhere):**
- `shoot` schema is **not** REST-exposed → browser reads go through `public.*_view`, writes through service-role edge functions.
- Media-intelligence tables live in **`public`** (like `brand_scores`) so the agent and browser both reach them under RLS — no view shim needed.
- RLS predicate:
  ```sql
  brand_id IN (
    SELECT b.id FROM brands b
    JOIN org_members m ON m.org_id = b.org_id
    WHERE m.user_id = auth.uid()
  )
  ```

---

## 2. Canonical schema (one definition each)

Source of truth is `02-image-types.md §13` (images) and `11-video-plan.md §8` (video). No renames.

### 2.1 Spec tables (seed from the KBs)
- `platforms` — KB §13.2 verbatim.
- `image_type_defs` — KB §13.2 verbatim.
- `image_specs` — KB §13.2 verbatim. **This is the agent-facing table.** (`media_size_specs` stays as legacy; do **not** add the §13.1 columns to it — pick one table, not two half-schemas.)
- `recommendation_rules` — KB §13.2 verbatim.
- `video_type_specs`, `video_recommendation_rules` — `11-video-plan.md §8.2–8.3` verbatim. (Reject the name `platform_video_specs` from strategy.md Phase 5.)

### 2.2 Agent output — single `media_recommendations`

Reconciles strategy.md §6 and media-agent-plan §8.2 into one. Public schema, RLS via `org_members`.

```sql
CREATE TABLE media_recommendations (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id           uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  shoot_id           uuid,                       -- nullable; links to shoot.shoots when planned
  brief_id           uuid,                       -- nullable; set when discovery flow exists (post-MVP)
  status             text NOT NULL DEFAULT 'draft'
                       CHECK (status IN ('draft','approved','rejected','archived')),
  -- payloads (jsonb arrays of the typed shapes in media-agent-plan Appendix A)
  image_types        jsonb NOT NULL DEFAULT '[]',
  video_types        jsonb NOT NULL DEFAULT '[]',
  ad_creatives       jsonb NOT NULL DEFAULT '[]',
  ecommerce_assets   jsonb NOT NULL DEFAULT '[]',
  missing_assets     jsonb NOT NULL DEFAULT '[]',
  content_mix        jsonb NOT NULL DEFAULT '{}',
  shoot_requirements jsonb NOT NULL DEFAULT '[]',
  priority_score     integer CHECK (priority_score BETWEEN 0 AND 100),
  confidence_score   integer CHECK (confidence_score BETWEEN 0 AND 100),
  reasoning          text,                       -- single string (not text[])
  created_at         timestamptz NOT NULL DEFAULT now(),
  approved_at        timestamptz,
  approved_by        uuid REFERENCES auth.users(id)
);
CREATE INDEX idx_media_recs_brand  ON media_recommendations(brand_id);
CREATE INDEX idx_media_recs_status ON media_recommendations(status);

ALTER TABLE media_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members read own brand recs" ON media_recommendations FOR SELECT
  USING (brand_id IN (SELECT b.id FROM brands b JOIN org_members m ON m.org_id = b.org_id WHERE m.user_id = auth.uid()));
-- writes are service-role only (agent edge fn); no anon/auth insert policy.
```

Post-MVP tables (`media_briefs`, `asset_coverage_scores`, `industry_playbooks`) keep media-agent-plan §8.2 DDL **but** swap their RLS to the `org_members` predicate above.

---

## 3. The MVP (do this first)

> Core thesis from strategy.md: *the agent recommends platform-correct specs grounded in the DB, never invented.* The smallest thing that delivers it does **not** need a new agent.

Both old plans over-built: a whole new `media-advisor` agent + 6 tools + a 5-step discovery flow. But `production-planner` **already exists, already runs the wizard, already calls `lookupShotReferences`**. The MVP is one sibling tool next to it.

| ID | Work item | What | Files |
|----|-----------|------|-------|
| **MI-01** | Spec tables migration + seed | `platforms` + `image_type_defs` + `image_specs` + `recommendation_rules` in `public`; seed from `02-image-types.md`; RLS via `org_members` | `supabase/migrations/` |
| **MI-02** | `lookupChannelSpecs` tool | `channels: string[]` → spec rows from `image_specs JOIN image_type_defs JOIN platforms`; mirrors the existing `lookupShotReferences` tool exactly | `app/src/mastra/tools/` + register in `production-planner` |
| **MI-03** | Wizard step 1 surfacing | When operator picks channels, show required specs next to the existing shot-type suggestions | shoot wizard step 1 |

**MVP exit criterion:** operator asks "what image specs do I need for Instagram feed?" → `production-planner` answers `1080×1350, 4:5, JPEG/PNG ≤8MB` from `image_specs`. Zero hallucinated values. No new agent shipped.

**MVP explicitly excludes:** the `media-advisor` agent, discovery flow, `media_briefs`, coverage scoring, video, industry playbooks, recommendation persistence. All post-MVP.

---

## 4. Post-MVP phases (condensed, behind the MVP)

| Phase | Goal | Work items |
|---|---|---|
| **P1 — Recommend** | Agent ranks asset types, persists output | MI-04 `media_recommendations` table · MI-05 `recommendImageTypes` · MI-06 `recommendCreativeMix` · MI-07 industry playbook seed (fashion/beauty/jewelry/luxury/accessories) |
| **P2 — Advisor agent** | Promote from tool-on-`production-planner` to dedicated `media-advisor` **only if** the wizard prompt gets too large | MI-08 `media-advisor` agent + discovery flow · MI-09 `media_briefs` table |
| **P3 — Coverage** | Dashboard coverage score + gap → brief | MI-10 `scoreAssetCoverage` · MI-11 `asset_coverage_scores` · MI-12 coverage widget |
| **P4 — Video** | Video deliverables in the same wizard | MI-13 `video_type_specs` seed · MI-14 `recommendVideoTypes` · MI-15 video in wizard |
| **P5 — Loop** | Performance data raises future priority | MI-16 spec-compliance validation · MI-17 perf import · MI-18 high-DNA → `shot_type_references` promotion |

Persona detail (5 capabilities), campaign-trigger playbooks (brand launch, BFCM, UGC, etc.), and the full Zod types are still good — read them in `media-agent-plan.md §2, §6–7, Appendix A` when building P1–P2. Just ignore that doc's table names, RLS, and IPI numbers.

---

## 5. Issue numbering — read before filing anything

**Do not file the `IPI-184…234` numbers from the old plans.** They are invented and collide with real issues (`IPI-184` = Shot Type Reference Library; `IPI-150/151/85/86/87/113` are real and unrelated).

This plan uses internal `MI-NN` IDs only. When you create real Linear issues, fill the right column and Linear auto-assigns the number:

| MI ID | Title | Linear issue (fill on creation) |
|---|---|---|
| MI-01 | Spec tables migration + seed | — |
| MI-02 | `lookupChannelSpecs` tool | — |
| MI-03 | Wizard step 1 spec surfacing | — |
| MI-04…MI-18 | (see §4) | — |

I can create these in Linear under the IPI team on request — that's the only way to get non-colliding real numbers.

---

## 6. Open items carried over (still valid)

- **Spec staleness:** `last_verified_at` on `image_specs`; warn in tool output when >90 days. (strategy.md §9)
- **Cloudinary transform-to-spec:** close coverage gaps from existing assets before booking a shoot. (strategy.md §9) — P3+.
- **Empty source briefs:** `21-booking-system.md` and `31-production-system-plan.md` are 0 bytes; their briefs (`20-`, `30-`) were never executed. Out of scope here.
