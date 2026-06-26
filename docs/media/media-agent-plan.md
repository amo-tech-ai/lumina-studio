# iPix AI Media Advisor — Technical Build Plan

> ⚠️ **SUPERSEDED for schema, tenancy, and issue numbers by [`40-media-intelligence-plan.md`](40-media-intelligence-plan.md).** Known wrong here: "four agents" (six exist), RLS via `brand_members` (no such table — use `org_members`), and `IPI-200…234` (invented, collide with real issues). Personas (§2), playbooks (§6–7), and Appendix A Zod types remain good — use them with the corrected schema.

**Version:** 1.0
**Date:** 2026-06-27
**Author:** AI Team
**Status:** Draft — ready for sprint planning
**Related issues:** IPI-135 (agent memory), IPI-148 (shoot tools), IPI-183 (e2e suite)

---

## Table of Contents

1. [Agent Architecture](#1-agent-architecture)
2. [Expert Persona Stack](#2-expert-persona-stack)
3. [Discovery Flow](#3-discovery-flow)
4. [Recommendation Engine](#4-recommendation-engine)
5. [Mastra Tool Definitions](#5-mastra-tool-definitions)
6. [Industry Playbooks](#6-industry-playbooks)
7. [Campaign Workflow Triggers](#7-campaign-workflow-triggers)
8. [Database Integration](#8-database-integration)
9. [Linear Issue Mapping](#9-linear-issue-mapping)

---

## 1. Agent Architecture

### 1.1 Agent Registry

The iPix Mastra registry will have four production agents. `media-advisor` is new; the others already ship.

| Agent ID | File | Role | Status |
|----------|------|------|--------|
| `production-planner` | `agents/index.ts` | Shoot planning, shot lists, budget, HITL | Shipped (IPI-148) |
| `creative-director` | `agents/index.ts` | Brand DNA → creative briefs, moodboards | Shipped (IPI-133) |
| `social-discovery` | `agents/social-discovery.ts` | Brand social channel crawl, DNA extraction | Shipped (IPI-27) |
| `media-advisor` | `agents/media-advisor.ts` | Platform strategy, asset recommendations, gap analysis | **New (this plan)** |

### 1.2 Agent Definition

```typescript
// app/src/mastra/agents/media-advisor.ts
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { Agent } from "@mastra/core/agent";
import { getMastraMemory } from "@/mastra/memory";
import { resolveGeminiModel } from "@/mastra/models";
import { mediaAdvisorTools } from "@/mastra/tools/media-advisor";

const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
const GEMINI_MODEL = resolveGeminiModel();

export const mediaAdvisorAgent = new Agent({
  id: "media-advisor",
  name: "Media Advisor",
  model: google(GEMINI_MODEL),
  tools: mediaAdvisorTools,
  memory: getMastraMemory(),
  instructions: MEDIA_ADVISOR_SYSTEM_PROMPT, // see Section 2
});
```

### 1.3 Routing Rules — When Each Agent Fires

Routing lives in the operator-facing API layer (`/api/agents/[agentId]/stream`). The frontend selects `agentId` based on user context:

| Trigger | Agent | Entry Condition |
|---------|-------|-----------------|
| Operator opens a new brand with no shoots | `media-advisor` | `brand.shoots.count === 0` |
| Operator clicks "Plan Campaign" | `media-advisor` | explicit UI action |
| Operator clicks "Start Shoot" | `production-planner` | explicit UI action |
| Brand DNA score < 40 or missing channels | `media-advisor` | auto-surfaced as alert |
| Creative brief needed for a shoot | `creative-director` | `production-planner` hands off |
| New brand onboarding (URL submitted) | `social-discovery` → `media-advisor` | pipeline: discovery then advise |

### 1.4 Handoff Protocol

```
social-discovery  ──>  media-advisor  ──>  creative-director  ──>  production-planner
       |                     |                      |                       |
  crawl brand URL       run discovery        turn brief into          plan shoot,
  extract channels      flow, produce        moodboard + style        shot list,
  compute DNA score     MediaBrief           direction                 budget
```

**Concrete handoff mechanism:** Each agent writes structured output to Postgres via its write tools. The next agent reads from shared tables (`brand_profiles`, `media_briefs`, `shoot_briefs`). No direct agent-to-agent calls — the operator confirms each handoff in the UI (HITL gate).

`media-advisor` to `production-planner` handoff:

```typescript
// media-advisor calls planDeliverables (production-planner tool) indirectly
// by writing a shoot_brief row with source='media-advisor'
// production-planner picks it up on next thread start
await supabase.from('shoot_briefs').insert({
  brand_id,
  source_agent: 'media-advisor',
  deliverables: recommendation.shootRequirements,
  status: 'pending_operator_review',
});
```

---

## 2. Expert Persona Stack

The `media-advisor` is one agent with one system prompt. Personas are named capability sections within the prompt — not separate agents. The model activates each based on the task at hand.

### System Prompt Skeleton

```typescript
const MEDIA_ADVISOR_SYSTEM_PROMPT = `
You are the iPix Media Advisor — a world-class creative and marketing intelligence
system for fashion, beauty, luxury, and lifestyle brands on the FashionOS platform.

You embody five expert capabilities, each activated by context:

## CAPABILITY 1: Creative Director
## CAPABILITY 2: Platform Strategist
## CAPABILITY 3: Ecommerce Specialist
## CAPABILITY 4: Performance Marketer
## CAPABILITY 5: Fashion / Beauty / Luxury Expert

## Decision Rules
- Always complete brand discovery before making recommendations.
- Never recommend platforms not listed in the operator's active channels.
- Always surface missing assets as critical alerts, not suggestions.
- When budget is micro (<$2k/month), prioritize organic; suppress paid ad recs.
- Always cite reasoning for every recommendation.
- Output structured JSON for all recommendations — never prose-only.
`;
```

### 2.1 Creative Director Persona

**Responsibilities:** Brand voice definition, visual direction, campaign concept development, style guide enforcement.

**Knowledge domain:** Art direction, colour theory, fashion photography styles, moodboard construction, seasonal trends, editorial vs. commercial photography.

**Inputs → Outputs:**

| Input | Output |
|-------|--------|
| Brand URL, existing assets | Visual DNA summary |
| Campaign goal + season | Campaign concept (2-3 directions) |
| Industry + budget tier | Shoot style recommendation |
| Brand DNA score from `brand_scores` | Style conformance alerts |

**Decision rules:**
- If `brand_dna_score < 40`: flag identity gap, recommend brand shoot before product shoot.
- If no editorial content in last 30 days: recommend editorial campaign.
- Luxury brands: clean, minimal, model-forward. Never meme or UGC-first.
- Streetwear: UGC-heavy, raw, authentic. Editorial secondary.

### 2.2 Platform Strategist Persona

**Responsibilities:** Channel selection, format prioritisation, posting cadence, cross-platform content adaptation.

**Knowledge domain:** Platform algorithm behaviour (2025-2026), organic reach optimisation, stories vs. feed vs. reels performance data, shopping integrations, platform-specific safe zones and aspect ratios (sourced from `02-image-types.md`).

**Inputs → Outputs:**

| Input | Output |
|-------|--------|
| Brand industry + audience | Platform priority ranking |
| Budget tier | Organic vs. paid split |
| Existing channels | Gap analysis — missing platforms |
| Campaign goal | Format recommendations per platform |

**Decision rules:**
- Fashion + Beauty: Instagram and TikTok are always tier-1.
- Luxury: Instagram and Pinterest tier-1; TikTok only if brand DNA allows.
- Jewelry: Pinterest is mandatory (long shelf life for discovery).
- Any ecommerce brand: include Amazon, Shopify, and Meta catalog in recommendations.
- If `channels.includes('tiktok')` and `budget_tier !== 'micro'`: recommend TikTok Ads alongside organic.

### 2.3 Ecommerce Specialist Persona

**Responsibilities:** Product image requirements by marketplace, catalog completeness scoring, conversion optimisation.

**Knowledge domain:** Amazon main image rules (pure white, 85-100% fill, 2000x2000 px JPEG), Shopify zoom requirements (2048x2048 minimum), Meta catalog specs (1080x1080, no watermarks), TikTok Shop specs, Etsy 4:3 thumbnail optimisation.

**Inputs → Outputs:**

| Input | Output |
|-------|--------|
| Active channels | Required catalog specs per platform |
| Existing product assets | Missing asset alerts with severity |
| Product count | Shoot volume estimate |
| Marketplace platforms | Platform-specific checklist |

**Decision rules:**
- Amazon: always require 2000x2000 pure white main, >=3 lifestyle, >=2 detail, >=1 infographic.
- Shopify: warn if any product image < 1024x1024 (zoom disabled).
- Meta catalog: reject if watermarks or price overlays detected.
- Etsy: require 4:3 (2700x2025) and minimum 5 images per listing.

### 2.4 Performance Marketer Persona

**Responsibilities:** Ad creative recommendations, A/B test frameworks, ROAS-optimised asset selection, creative fatigue monitoring.

**Knowledge domain:** Meta Ads creative best practices, TikTok Spark Ads, Pinterest Promoted Pins, retargeting vs. prospecting creative differences, dynamic product ads, creative refresh cadences.

**Inputs → Outputs:**

| Input | Output |
|-------|--------|
| Ad budget + platforms | Ad creative mix by placement |
| Funnel stage | Creative type per stage |
| Existing ad assets | Creative fatigue alert (if same asset > 3 weeks) |
| Campaign goal | KPI targets + A/B test plan |

**Decision rules:**
- Awareness (top funnel): lifestyle 4:5 feed + story 9:16. No product-on-white.
- Conversion (bottom funnel): dynamic catalog ads + carousel. 1:1 or 4:5.
- Retargeting: UGC or testimonial creative. Never the same hero as prospecting.
- Creative refresh: flag after 21 days of continuous run.
- A/B always test: creative style (lifestyle vs. studio) AND format (single vs. carousel).

### 2.5 Fashion / Beauty / Luxury Expert Persona

**Responsibilities:** Industry-specific creative norms, seasonal calendar, must-have image types by vertical, trend integration.

**Knowledge domain:** Fashion show calendar (NYFW, Paris, Milan), beauty photography conventions, luxury brand visual grammar, jewelry macro photography, skincare before/after ethics.

**Inputs → Outputs:**

| Input | Output |
|-------|--------|
| Industry (fashion/beauty/luxury/jewelry/...) | Industry playbook (Section 6) |
| Season / collection | Seasonal content priorities |
| Brand tier (mass/premium/luxury) | Visual grammar rules |
| Product type | Required shot types |

**Decision rules:**
- Luxury brands: never recommend meme, UGC-first, or text-heavy creative.
- Beauty: always include closeup texture/detail shots and before/after (where ethical).
- Jewelry: macro photography is mandatory — detail shots drive purchase confidence.
- Swimwear: lifestyle on-location is mandatory. White background swimwear converts poorly.
- Streetwear: UGC and street-style content outperforms editorial.

---

## 3. Discovery Flow

The agent runs a structured conversation with a new operator to produce a `MediaBrief`. Steps are sequential; each step is skipped if data already exists in `brand_profiles`.

### Step 1 — Brand URL Analysis (Automated)

```
Agent action: consume social-discovery agent output + crawl brand website
Data extracted:
  - Industry vertical (from product categories, domain, meta tags)
  - Visual style (colour palette, typography, photography style)
  - Existing social channels (links found on site)
  - Active ecommerce platforms (Shopify/WooCommerce/Amazon links)
  - Asset gaps (what is missing from crawl)

Output: BrandSnapshot {
  industry: string
  subIndustry: string
  visualStyleClues: string[]
  detectedChannels: string[]
  detectedEcommercePlatforms: string[]
  competitorPositioning: string
}
```

### Step 2 — Channel Selection and Goal Setting (Operator confirms)

```
Agent presents recommended channels based on BrandSnapshot.
Operator adds/removes channels.
Agent stores confirmed channels in brand_profiles.channels.
```

### Step 3 — Budget Tier Classification

```
Agent asks monthly content + advertising budget.
Options:
  A. Micro  — under $2,000/month (organic-first, minimal paid)
  B. Growth — $2,000-$10,000/month (mixed organic + paid)
  C. Scale  — $10,000+/month (full paid + organic + UGC)

Mapping:
  micro  -> organic: 80%, paid: 0%,  ugc: low
  growth -> organic: 60%, paid: 40%, ugc: medium
  scale  -> organic: 40%, paid: 40%, ugc: 20%
```

### Step 4 — Season and Campaign Type Detection

```
Agent checks current date to derive active fashion season:
  Jan-Mar: SS launch
  Apr-Jun: SS continuation / pre-fall
  Jul-Sep: AW preview + launch
  Oct-Dec: AW continuation + Holiday + BFCM

Agent asks:
  - Campaign type: brand_launch | product_launch | collection_launch |
                   seasonal | holiday | influencer | ugc | retargeting | always_on
  - Product count (integer)
  - Existing brand assets (yes/no + optional upload)
```

### Step 5 — Output: MediaBrief JSON

```typescript
interface MediaBrief {
  brand_id: string;
  created_at: string;

  brand: {
    name: string;
    url: string;
    industry: Industry;
    sub_industry: string;
    brand_tier: 'mass' | 'premium' | 'luxury';
    visual_style: string[];
    dna_score: number | null;  // from brand_scores
  };

  channels: {
    social: SocialChannel[];
    ecommerce: EcommerceChannel[];
    advertising: AdChannel[];
  };

  campaign: {
    type: CampaignType;
    season: Season;
    goal: CampaignGoal;
    funnel_stage: FunnelStage;
    product_count: number;
    launch_date: string | null;
  };

  budget: {
    tier: 'micro' | 'growth' | 'scale';
    monthly_usd: number | null;
    organic_pct: number;
    paid_pct: number;
    ugc_pct: number;
  };

  existing_assets: {
    has_brand_shoot: boolean;
    has_product_on_white: boolean;
    has_lifestyle: boolean;
    has_video: boolean;
    has_ugc: boolean;
    asset_list: ExistingAsset[];
  };

  gaps: AssetGap[];  // pre-computed before recommendation pass
}
```

---

## 4. Recommendation Engine

Given a `MediaBrief`, the agent calls its tool suite and produces a `MediaRecommendation`.

### 4.1 Output Types

```typescript
interface MediaRecommendation {
  id: string;
  brand_id: string;
  brief_id: string;
  created_at: string;
  platform: string;                   // primary platform for this rec

  imageTypes: ImageTypeRec[];
  videoTypes: VideoTypeRec[];
  adCreatives: AdCreativeRec[];
  ecommerceAssets: EcommerceAssetRec[];
  missingAssets: MissingAssetAlert[];

  contentMix: ContentMixRec;          // e.g. 40% lifestyle, 25% product, 20% UGC
  shootRequirements: ShootRequirement[];

  priorityScore: number;              // 0-100; how urgent is this rec
  confidenceScore: number;            // 0-100; how confident is the model
  reasoning: string;
}

interface ImageTypeRec {
  image_type_slug: string;
  platform_slug: string;
  width_px: number;
  height_px: number;
  aspect_ratio_label: string;
  accepted_formats: string[];
  background_required: string | null;
  quantity: number;                   // how many to shoot
  priority: 'required' | 'recommended' | 'optional';
  funnel_stage: FunnelStage;
  reasoning: string;
}

interface VideoTypeRec {
  video_type: string;                 // e.g. 'reel', 'tiktok_organic', 'story'
  platform_slug: string;
  width_px: number;
  height_px: number;
  aspect_ratio_label: string;
  duration_seconds: number;
  quantity: number;
  priority: 'required' | 'recommended' | 'optional';
  reasoning: string;
}

interface AdCreativeRec {
  ad_format: string;                  // e.g. 'meta_feed_1x1', 'tiktok_in_feed'
  platform_slug: string;
  placement: string;
  width_px: number;
  height_px: number;
  funnel_stage: FunnelStage;
  creative_style: string;             // e.g. 'lifestyle', 'product_catalog', 'ugc'
  quantity: number;
  a_b_variants: number;
  refresh_interval_days: number;
  reasoning: string;
}

interface EcommerceAssetRec {
  platform_slug: string;
  asset_type: string;                 // e.g. 'main_product_image', 'a_plus_banner'
  width_px: number;
  height_px: number;
  background_required: string | null;
  product_fill_min_pct: number | null;
  quantity_per_product: number;
  total_quantity: number;             // quantity_per_product x product_count
  priority: 'required' | 'recommended' | 'optional';
  reasoning: string;
}

interface MissingAssetAlert {
  channel: string;
  asset_type: string;
  severity: 'critical' | 'warning' | 'suggestion';
  message: string;
  recommended_spec: {
    width_px: number;
    height_px: number;
    aspect_ratio_label: string;
    format: string;
  };
}

interface ContentMixRec {
  lifestyle_pct: number;
  product_studio_pct: number;
  ugc_pct: number;
  editorial_pct: number;
  behind_scenes_pct: number;
  ad_creative_pct: number;
  reasoning: string;
}

interface ShootRequirement {
  shoot_type: string;                 // 'studio', 'location', 'ecommerce_white', 'macro'
  priority: 'required' | 'recommended';
  deliverable_count: number;
  estimated_hours: number;
  crew: string[];
  notes: string;
}
```

### 4.2 Integration with Shoot Wizard

`shootRequirements` feeds directly into `planDeliverables` (the production-planner tool). When the operator confirms the `MediaRecommendation`, the system writes a `shoot_brief` row:

```typescript
// In media-advisor tool: confirmMediaRecommendation()
await supabase.from('shoot_briefs').insert({
  brand_id: brief.brand_id,
  source_agent: 'media-advisor',
  media_recommendation_id: recommendation.id,
  deliverables: recommendation.shootRequirements.map(r => ({
    shoot_type: r.shoot_type,
    deliverable_count: r.deliverable_count,
    image_types: recommendation.imageTypes
      .filter(i => i.priority === 'required')
      .map(i => ({
        slug: i.image_type_slug,
        quantity: i.quantity,
        spec: { width_px: i.width_px, height_px: i.height_px },
      })),
  })),
  status: 'pending_operator_review',
});
```

The operator then opens the shoot wizard, which loads this `shoot_brief` and passes it to `production-planner`.

---

## 5. Mastra Tool Definitions

All tools live in `app/src/mastra/tools/media-advisor/`. Tools use `createTool` from `@mastra/core/tools` and Zod for schema validation.

### 5.1 `recommendImageTypes`

```typescript
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const BrandProfileSchema = z.object({
  industry: z.enum(['fashion','luxury','beauty','jewelry','accessories',
    'streetwear','swimwear','footwear','handbags','cosmetics','skincare',
    'haircare','restaurant','hotel','fitness','other']),
  brand_tier: z.enum(['mass','premium','luxury']),
  dna_score: z.number().min(0).max(100).optional(),
  visual_style: z.array(z.string()),
  budget_tier: z.enum(['micro','growth','scale']),
  product_count: z.number().int().positive(),
  campaign_type: z.enum(['brand_launch','product_launch','collection_launch',
    'seasonal','holiday','bfcm','influencer','ugc','retargeting','always_on']),
  season: z.enum(['SS','AW','holiday','pre_fall','resort']),
});

const GoalSchema = z.enum([
  'brand_awareness','product_launch','conversion','retention',
  'community','seo_discovery','ecommerce_direct',
]);

export const recommendImageTypes = createTool({
  id: "recommendImageTypes",
  description: "Given a brand profile, selected channels, and campaign goal, recommend image types with specs and quantities to shoot.",
  inputSchema: z.object({
    brandProfile: BrandProfileSchema,
    channels: z.array(z.string()).min(1),
    goal: GoalSchema,
  }),
  outputSchema: z.array(z.object({
    image_type_slug: z.string(),
    platform_slug: z.string(),
    width_px: z.number(),
    height_px: z.number(),
    aspect_ratio_label: z.string(),
    accepted_formats: z.array(z.string()),
    background_required: z.string().nullable(),
    quantity: z.number(),
    priority: z.enum(['required','recommended','optional']),
    funnel_stage: z.enum(['awareness','consideration','conversion','retention']),
    reasoning: z.string(),
  })),
  execute: async ({ context }) => {
    // 1. Query image_specs JOIN image_type_defs JOIN platforms for all channel slugs
    // 2. Apply recommendation_rules WHERE rule_type IN ('channel_required','objective_best','category_best')
    // 3. Apply industry playbook overrides (Section 6)
    // 4. Compute quantity: base x product_count x campaign_multiplier
    // 5. Return sorted by priority desc, platform
    return await computeImageTypeRecommendations(context.brandProfile, context.channels, context.goal);
  },
});
```

### 5.2 `recommendVideoTypes`

```typescript
export const recommendVideoTypes = createTool({
  id: "recommendVideoTypes",
  description: "Recommend video content types by platform, format, and quantity for a brand's campaign.",
  inputSchema: z.object({
    brandProfile: BrandProfileSchema,
    channels: z.array(z.string()),
    goal: GoalSchema,
  }),
  outputSchema: z.array(z.object({
    video_type: z.string(),
    platform_slug: z.string(),
    width_px: z.number(),
    height_px: z.number(),
    aspect_ratio_label: z.string(),
    duration_seconds: z.number(),
    quantity: z.number(),
    priority: z.enum(['required','recommended','optional']),
    reasoning: z.string(),
  })),
  execute: async ({ context }) => {
    // TikTok always: 9:16 organic (1080x1920)
    // Instagram: Reels (9:16) + Stories (9:16) + optional feed video
    // YouTube: 16:9 thumbnail + optional long-form
    // Pinterest: 2:3 video pin if in channels
    return await computeVideoTypeRecommendations(context);
  },
});
```

### 5.3 `recommendCreativeMix`

```typescript
export const recommendCreativeMix = createTool({
  id: "recommendCreativeMix",
  description: "Return a percentage content mix (lifestyle, product studio, UGC, editorial, BTS, ads) for a brand's industry, channels, and funnel stage.",
  inputSchema: z.object({
    industry: BrandProfileSchema.shape.industry,
    channels: z.array(z.string()),
    funnel: z.enum(['full_funnel','top','mid','bottom']),
    budget_tier: z.enum(['micro','growth','scale']),
    campaign_type: BrandProfileSchema.shape.campaign_type,
  }),
  outputSchema: z.object({
    lifestyle_pct: z.number(),
    product_studio_pct: z.number(),
    ugc_pct: z.number(),
    editorial_pct: z.number(),
    behind_scenes_pct: z.number(),
    ad_creative_pct: z.number(),
    reasoning: z.string(),
  }),
  execute: async ({ context }) => {
    // Reads from industry_playbooks table
    // Adjusts for budget_tier: micro -> no ad_creative, scale -> ugc_pct higher
    return await computeCreativeMix(context);
  },
});
```

### 5.4 `recommendMissingAssets`

```typescript
const ExistingAssetSchema = z.object({
  platform_slug: z.string(),
  asset_type_slug: z.string(),
  width_px: z.number(),
  height_px: z.number(),
  has_watermark: z.boolean().default(false),
  background: z.enum(['white','neutral','lifestyle','other']).optional(),
});

export const recommendMissingAssets = createTool({
  id: "recommendMissingAssets",
  description: "Compare a brand's existing assets against channel requirements and return a list of missing assets by severity.",
  inputSchema: z.object({
    existingAssets: z.array(ExistingAssetSchema),
    channels: z.array(z.string()),
  }),
  outputSchema: z.array(z.object({
    channel: z.string(),
    asset_type: z.string(),
    severity: z.enum(['critical','warning','suggestion']),
    message: z.string(),
    recommended_spec: z.object({
      width_px: z.number(),
      height_px: z.number(),
      aspect_ratio_label: z.string(),
      format: z.string(),
    }),
  })),
  execute: async ({ context }) => {
    // Implements detect_missing_assets logic from 02-image-types.md section 12.5
    // Amazon: white bg, 2000px, fill%; Shopify: zoom threshold;
    // Meta catalog: no watermarks; Pinterest: 2:3 ratio; Etsy: >=5 images, 4:3
    return await detectMissingAssets(context.existingAssets, context.channels);
  },
});
```

### 5.5 `generateChannelRequirements`

```typescript
export const generateChannelRequirements = createTool({
  id: "generateChannelRequirements",
  description: "Return the full required and recommended image/video spec set for a list of channels, sourced from image_specs and platforms tables.",
  inputSchema: z.object({
    channels: z.array(z.string()),
    include_optional: z.boolean().default(false),
  }),
  outputSchema: z.array(z.object({
    platform_slug: z.string(),
    platform_name: z.string(),
    required: z.array(z.object({
      image_type_slug: z.string(),
      width_px: z.number(),
      height_px: z.number(),
      aspect_ratio_label: z.string(),
      formats: z.array(z.string()),
      notes: z.string().optional(),
    })),
    recommended: z.array(z.object({
      image_type_slug: z.string(),
      width_px: z.number(),
      height_px: z.number(),
      aspect_ratio_label: z.string(),
      formats: z.array(z.string()),
    })),
    optional: z.array(z.object({
      image_type_slug: z.string(),
      width_px: z.number(),
      height_px: z.number(),
      aspect_ratio_label: z.string(),
    })).optional(),
  })),
  execute: async ({ context }) => {
    // Implements channel -> required specs rules from 02-image-types.md section 12.1
    // Queries image_specs JOIN platforms WHERE platform_slug IN channels
    return await buildChannelRequirements(context.channels, context.include_optional);
  },
});
```

### 5.6 `scoreAssetCoverage`

```typescript
export const scoreAssetCoverage = createTool({
  id: "scoreAssetCoverage",
  description: "Score a brand's asset library completeness against their active channels. Returns 0-100 per platform and overall.",
  inputSchema: z.object({
    assets: z.array(ExistingAssetSchema),
    channels: z.array(z.string()),
    product_count: z.number().int().positive(),
  }),
  outputSchema: z.object({
    overall_score: z.number().min(0).max(100),
    platform_scores: z.array(z.object({
      platform_slug: z.string(),
      score: z.number().min(0).max(100),
      covered: z.number(),
      total_required: z.number(),
      missing_critical: z.number(),
    })),
    grade: z.enum(['A','B','C','D','F']),
    summary: z.string(),
  }),
  execute: async ({ context }) => {
    // For each channel: count required_asset_count from recommendation_rules
    // actual_covered = count of matching existing assets with correct specs
    // score = (covered / required) * 100, weighted by severity
    // Writes result to asset_coverage_scores table
    return await computeAssetCoverageScore(context);
  },
});
```

---

## 6. Industry Playbooks

These are the canonical data set for the `industry_playbooks` Postgres table. The recommendation engine queries this table at runtime.

### 6.1 Fashion (Ready-to-Wear)

| Attribute | Value |
|-----------|-------|
| Monthly volume (micro) | 30-50 images, 8-12 videos |
| Monthly volume (growth) | 80-120 images, 20-30 videos |
| Monthly volume (scale) | 200+ images, 60+ videos |
| Platform priority | Instagram > TikTok > Pinterest > Facebook > Threads |
| Ecommerce priority | Shopify > Instagram Shop > Facebook Shop |

**Content mix:**
```
Lifestyle (on-figure, location):  40%  -- drives aspiration + Instagram algorithm
Product studio (on-white/grey):   20%  -- ecommerce catalog, shopping ads
UGC / street style:               15%  -- social proof, retargeting
Editorial / campaign:             15%  -- brand equity, seasonal launches
Behind the scenes:                 5%  -- brand humanisation
Ad creatives:                      5%  -- Meta feed + story ads
```

**Must-have image types:** Feed portrait 4:5, Story 9:16, Carousel (lookbook), flat lay, on-figure front+back, collection cover.

**Must-have video types:** Reels 9:16 (15-30s), TikTok organic (30-60s), Story video, TikTok carousel.

**Ad creative mix:** 60% lifestyle 4:5 feed, 30% story 9:16, 10% carousel multi-product.

**Shoot frequency:** 2x per month studio + 1x per month location.

---

### 6.2 Luxury Fashion

| Attribute | Value |
|-----------|-------|
| Monthly volume | 20-40 images (quality > quantity) |
| Platform priority | Instagram > Pinterest > YouTube > LinkedIn |
| Ecommerce | Shopify DTC only. No Amazon. No Etsy. |

**Content mix:**
```
Editorial / campaign:             45%  -- luxury requires investment in narrative
Lifestyle (aspirational):         30%  -- quiet luxury aesthetic
Product studio (clean, minimal):  15%  -- never cluttered
Behind the scenes (craft focus):  10%  -- artisanship storytelling
UGC:                               0%  -- brand control is paramount
```

**Must-have image types:** Campaign hero (landscape 16:9 + portrait 4:5), editorial carousel, model portrait, detail/texture closeup, packaging hero.

**Must-have video types:** Campaign film (YouTube 16:9, 60-90s), Reels (15-30s, cinematic), Story (9:16, minimal text).

**Ad creative mix:** 80% editorial/campaign image, 20% story video. Never dynamic product ads.

**Shoot frequency:** 1x per month major editorial.

**Restrictions:** No text overlays on hero images. No price callouts. No UGC as primary content. No TikTok unless brand DNA explicitly allows.

---

### 6.3 Beauty

| Attribute | Value |
|-----------|-------|
| Monthly volume (growth) | 60-100 images, 20-40 videos |
| Platform priority | Instagram > TikTok > Pinterest > YouTube |
| Ecommerce | Shopify + Amazon + Instagram Shop + TikTok Shop |

**Content mix:**
```
Tutorial / how-to:                30%  -- TikTok and YouTube primary driver
Product closeup / texture:        25%  -- macro photography, ingredient focus
Lifestyle (person using product): 20%  -- Instagram feed
UGC / before-after:               15%  -- social proof, highest conversion
Editorial:                         5%  -- seasonal campaigns
Behind the scenes (lab):           5%
```

**Must-have image types:** Product macro closeup, texture/ingredient hero, before/after, flat lay, on-skin model, pack shot.

**Must-have video types:** Tutorial Reel (30-60s), TikTok organic tutorial, product application demo, before/after Story.

**Amazon requirements per SKU:** Main (white bg, 2000x2000) + x3 lifestyle/in-use + x2 ingredient/texture + x1 infographic + x1 before/after.

**Shoot frequency:** 2x per month product focus + 1x per month model/tutorial shoot.

---

### 6.4 Jewelry

| Attribute | Value |
|-----------|-------|
| Monthly volume | 40-80 images, 10-20 videos |
| Platform priority | Pinterest > Instagram > Facebook > TikTok (unboxing) |
| Ecommerce | Shopify + Etsy + Amazon (if fashion jewelry) |

**Content mix:**
```
Product macro / detail:           35%  -- gem clarity, metal, craftsmanship
Lifestyle (worn, styled):         30%  -- aspirational, gift context
Flat lay (editorial):             15%  -- Pinterest dominant
Collection / group shot:          10%  -- range display
UGC / gifting:                    10%  -- social proof for mid-tier price point
```

**Must-have image types:** Macro closeup (ring detail, gem face-up), on-hand/on-neck lifestyle, flat lay styled, product-on-white 1:1, gift box/packaging.

**Must-have video types:** Macro product video (Reel, 9:16, rotating/sparkle effect), unboxing TikTok, Story (gift context).

**Pinterest:** Mandatory. 2:3 pins (1000x1500). Text overlay with metal type + price drives click-through for jewelry.

**Shoot frequency:** 1x macro studio/month + 1x lifestyle/month.

---

### 6.5 Accessories (Bags, Belts, Hats, Scarves)

| Attribute | Value |
|-----------|-------|
| Monthly volume | 40-70 images, 10-20 videos |
| Platform priority | Instagram > Pinterest > TikTok > Facebook |
| Ecommerce | Shopify + Instagram Shop + Amazon |

**Content mix:**
```
Lifestyle (worn, styled with outfit): 35%
Product studio (multiple angles):     25%
Flat lay (editorial):                 20%
Model / editorial:                    10%
UGC:                                  10%
```

**Must-have image types:** Front/back/side studio (1:1), in-use lifestyle (4:5), interior detail, size comparison, flat lay, on-model.

**Must-have video types:** 360 view Reel, styling video (TikTok), Story (versatility demo).

---

### 6.6 Streetwear

| Attribute | Value |
|-----------|-------|
| Monthly volume | 50-120 images, 30-60 videos |
| Platform priority | TikTok > Instagram > Pinterest (low priority) |
| Ecommerce | Shopify + Instagram Shop + TikTok Shop |

**Content mix:**
```
UGC / street style:               35%  -- authenticity is the brand
Lifestyle (crew / community):     25%  -- culture-forward
Product drop content:             20%  -- hype-building
Behind the scenes:                10%  -- brand narrative
Editorial (minimal):               5%  -- campaign only
Ad creatives:                      5%
```

**Must-have image types:** On-body street style (4:5), group/crew lifestyle, flat lay (styled), product drop graphic (1:1).

**Must-have video types:** TikTok organic (30-60s, raw), Reels (styled drop), Story countdown.

**Restrictions:** Avoid over-produced editorial — reads as inauthentic. Prioritise raw footage over studio.

---

### 6.7 Swimwear

| Attribute | Value |
|-----------|-------|
| Monthly volume | 40-80 images, 15-25 videos |
| Platform priority | Instagram > Pinterest > TikTok |
| Ecommerce | Shopify + Instagram Shop |
| Peak season | Jan-Apr (Northern Hemisphere pre-summer) |

**Content mix:**
```
Lifestyle on-location (beach/pool): 50%  -- white bg swimwear converts poorly
Model on-figure (editorial):         20%
Flat lay:                            10%
UGC (customers wearing product):     10%
Campaign editorial:                  10%
```

**Must-have image types:** On-figure location (4:5), front + back studio (catalog only), lifestyle group, detail stitching/fabric, flat lay.

**Must-have video types:** Reel on-location (lifestyle), TikTok (try-on), Story (styling tips).

**Critical note:** Never use white background as the primary image for swimwear — location context (water, sun) drives purchase intent. White bg is for catalog/ecommerce only.

---

## 7. Campaign Workflow Triggers

### 7.1 Brand Launch

**Trigger:** `campaign_type === 'brand_launch'`
**Pre-condition:** No existing brand assets.

**Agent outputs:**
1. Full brand asset kit: logo variations, profile photos (all channels), cover photos.
2. Foundation shoot plan: studio (white bg) + editorial (lifestyle) + hero campaign image.
3. Platform setup checklist: profile + cover per channel.
4. Ecommerce baseline: Shopify homepage hero, collection images, product-on-white (all SKUs).
5. Ad creative seed set: 3x lifestyle (awareness), 2x product (conversion).

**Minimum viable set (micro budget):**
```
Instagram: profile 320x320, 9x feed posts (4:5), 5x stories
TikTok: profile 200x200, 3x organic videos (9:16)
Shopify: hero 1920x1080, 5x product 2048x2048
```

---

### 7.2 Product Launch

**Trigger:** `campaign_type === 'product_launch'`

**Agent outputs:**
1. Product hero image set (all platforms + all angles).
2. Lifestyle context images (product in use).
3. Launch story/reel set (9:16 countdown + reveal).
4. Carousel (product features or collection comparison).
5. Ad creative set: awareness (launch teaser) + conversion (DPA-ready).

**Timeline recommendation:**
```
T-7 days: teaser content (Story, Reel BTS)
T-3 days: campaign hero drops (feed, Pinterest)
T-0:      launch day (Stories, TikTok, email banner)
T+7:      UGC round-up, retargeting ads fire
```

---

### 7.3 Collection Launch

**Trigger:** `campaign_type === 'collection_launch'`

**Agent outputs:**
1. Lookbook carousel (6-12 images, 4:5).
2. Campaign hero per platform.
3. Pinterest collection pin (2:3 + collection cover).
4. Instagram Shop collection cover (1080x1080).
5. Collection banner for Shopify (2048x2048 or 16:9).
6. TikTok lookbook video (9:16, 30-60s).

---

### 7.4 Seasonal Campaign

**Trigger:** `campaign_type === 'seasonal'` or season detected from current date.

**Season detection:**
```typescript
function detectSeason(date: Date): Season {
  const month = date.getMonth() + 1;
  if (month >= 1 && month <= 3)  return 'SS_launch';
  if (month >= 4 && month <= 6)  return 'SS_continuation';
  if (month >= 7 && month <= 9)  return 'AW_launch';
  return 'AW_holiday';
}
```

**Additional requirements on top of base:**
- Campaign hero with season-appropriate mood/location.
- Seasonal Story set (9:16) with date-specific messaging.
- Pinterest seasonal pin (2:3) — 90-day advance scheduling recommended.

---

### 7.5 Black Friday / Holiday

**Trigger:** `campaign_type === 'bfcm'` or `campaign_type === 'holiday'`

**Special requirements:**
- Price/deal callout graphics (1080x1080 and 1080x1920) — exception to the no-text-overlay rule.
- Countdown Story set (9:16).
- Email banner hero (600x300 email + 1920x1080 web).
- Facebook Event cover (1920x1080).
- Dynamic Product Ads ready — catalog must be 100% complete before BFCM.

**Volume boost:** +50% above baseline. Plan 3 creative variants minimum per format to prevent fatigue.

---

### 7.6 Influencer / UGC Campaign

**Trigger:** `campaign_type === 'influencer'` or `campaign_type === 'ugc'`

**Agent outputs:**
1. Creator brief template with required specs.
2. Repurposing plan: UGC -> Reels, UGC -> Story, UGC -> retargeting ad.
3. Rights management note (confirm usage rights before ad use).
4. Spec requirements to send creators: 9:16 vertical, 1080x1920, no watermarks.

**Spec enforcement for UGC:**
- Minimum: 1080x1920 (9:16) video, 1080x1080 (1:1) photo.
- No platform watermarks (TikTok watermark blocks Meta ad use).
- Colour grade recommendation: match brand DNA visual style.

---

### 7.7 Retargeting Campaign

**Trigger:** `campaign_type === 'retargeting'`

**Key rules:**
- Never use the same creative as prospecting — differentiated messaging required.
- Product catalog must be complete (all SKUs with white bg images).
- Dynamic Product Ads: auto-generated from catalog, but require >=1 lifestyle variant per SKU.
- Top formats: Instagram Story 9:16, Facebook Feed 1:1, Pinterest 2:3.
- Recommended creative: UGC testimonial or before/after (highest trust signal for warm audiences).

---

### 7.8 Always-On Content Calendar

**Trigger:** `campaign_type === 'always_on'`

**Output types:**
```typescript
interface ContentCalendarMonth {
  month: string;
  weeks: ContentWeek[];
  total_posts: number;
  total_stories: number;
  total_videos: number;
}

interface ContentWeek {
  week: number;
  theme: string;
  posts: ContentPost[];
}

interface ContentPost {
  platform: string;
  format: string;
  image_type: string;
  copy_direction: string;
  cta: string;
  day_of_week: string;
  optimal_time: string;  // platform-specific best time
}
```

**Standard cadence (growth tier):**
```
Instagram feed:  4-5 posts/week (mix 4:5 lifestyle + 1:1 product)
Instagram story: 3-5 stories/day (UGC, product, polls, BTS)
TikTok:          3-5 videos/week (organic)
Pinterest:       5-10 pins/week (scheduled 90 days ahead)
Facebook:        3-4 posts/week (repurposed from Instagram)
```

---

## 8. Database Integration

### 8.1 Existing Tables Used

| Table | How Used |
|-------|----------|
| `shot_type_references` | Validates `shootRequirements` — agent queries to ensure shot types are known |
| `media_size_specs` | Existing dimension lookup; fallback until `image_specs` migration lands |
| `brand_scores` | Reads `dna_score` to tailor style recommendations (low score -> brand shoot first) |
| `brand_social_channels` | From social-discovery agent — confirms active channels before recommending |

### 8.2 New Tables

```sql
-- Media briefs (output of discovery flow)
CREATE TABLE media_briefs (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id              uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  status                text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','confirmed','archived')),
  campaign_type         text NOT NULL,
  season                text,
  goal                  text,
  funnel_stage          text,
  budget_tier           text NOT NULL CHECK (budget_tier IN ('micro','growth','scale')),
  monthly_budget_usd    integer,
  organic_pct           integer NOT NULL DEFAULT 80,
  paid_pct              integer NOT NULL DEFAULT 20,
  ugc_pct               integer NOT NULL DEFAULT 0,
  product_count         integer NOT NULL DEFAULT 1,
  channels_social       text[] NOT NULL DEFAULT '{}',
  channels_ecommerce    text[] NOT NULL DEFAULT '{}',
  channels_advertising  text[] NOT NULL DEFAULT '{}',
  has_brand_shoot       boolean NOT NULL DEFAULT false,
  has_product_on_white  boolean NOT NULL DEFAULT false,
  has_lifestyle         boolean NOT NULL DEFAULT false,
  has_video             boolean NOT NULL DEFAULT false,
  has_ugc               boolean NOT NULL DEFAULT false,
  raw_brief             jsonb
);

-- Media recommendations (output of recommendation engine)
CREATE TABLE media_recommendations (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id              uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  brief_id              uuid REFERENCES media_briefs(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  status                text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','rejected','archived')),
  priority_score        integer NOT NULL DEFAULT 0 CHECK (priority_score BETWEEN 0 AND 100),
  confidence_score      integer NOT NULL DEFAULT 0 CHECK (confidence_score BETWEEN 0 AND 100),
  reasoning             text,
  content_mix           jsonb,       -- ContentMixRec
  image_types           jsonb,       -- ImageTypeRec[]
  video_types           jsonb,       -- VideoTypeRec[]
  ad_creatives          jsonb,       -- AdCreativeRec[]
  ecommerce_assets      jsonb,       -- EcommerceAssetRec[]
  missing_assets        jsonb,       -- MissingAssetAlert[]
  shoot_requirements    jsonb,       -- ShootRequirement[]
  confirmed_at          timestamptz,
  confirmed_by          uuid REFERENCES auth.users(id)
);

-- Asset coverage scores
CREATE TABLE asset_coverage_scores (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id              uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  computed_at           timestamptz NOT NULL DEFAULT now(),
  overall_score         integer NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  grade                 text NOT NULL CHECK (grade IN ('A','B','C','D','F')),
  platform_scores       jsonb NOT NULL DEFAULT '[]',
  total_required        integer NOT NULL DEFAULT 0,
  total_covered         integer NOT NULL DEFAULT 0,
  missing_critical      integer NOT NULL DEFAULT 0,
  summary               text
);

-- Industry playbooks (seeded — drives recommendation engine)
CREATE TABLE industry_playbooks (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_slug         text UNIQUE NOT NULL,
  industry_name         text NOT NULL,
  platform_priority     text[] NOT NULL,
  ecommerce_priority    text[] NOT NULL DEFAULT '{}',
  content_mix           jsonb NOT NULL,
  monthly_volume_micro  jsonb,                -- {images: n, videos: n}
  monthly_volume_growth jsonb,
  monthly_volume_scale  jsonb,
  required_image_types  text[] NOT NULL DEFAULT '{}',
  required_video_types  text[] NOT NULL DEFAULT '{}',
  ad_creative_mix       jsonb,
  shoot_frequency       text,
  restrictions          text[],
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_media_briefs_brand     ON media_briefs(brand_id);
CREATE INDEX idx_media_recs_brand       ON media_recommendations(brand_id);
CREATE INDEX idx_media_recs_status      ON media_recommendations(status);
CREATE INDEX idx_asset_scores_brand     ON asset_coverage_scores(brand_id);
CREATE INDEX idx_asset_scores_computed  ON asset_coverage_scores(computed_at DESC);
```

### 8.3 RLS Policies

```sql
ALTER TABLE media_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brand operators can manage their own briefs"
  ON media_briefs FOR ALL
  USING (
    brand_id IN (
      SELECT brand_id FROM brand_members WHERE user_id = auth.uid()
    )
  );

ALTER TABLE media_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brand operators can view their own recommendations"
  ON media_recommendations FOR SELECT
  USING (
    brand_id IN (
      SELECT brand_id FROM brand_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "service role can write recommendations"
  ON media_recommendations FOR INSERT
  WITH CHECK (true);  -- restricted to service_role key in agent
```

### 8.4 Key Queries

```sql
-- Brand's confirmed channels
SELECT platform_slug, handle, verified
FROM brand_social_channels
WHERE brand_id = $1 AND active = true;

-- Brand DNA score for style tuning
SELECT overall_score, visual_score, content_score
FROM brand_scores
WHERE brand_id = $1
ORDER BY computed_at DESC
LIMIT 1;

-- All required specs for a set of channels
SELECT
  p.slug             AS platform_slug,
  itd.slug           AS image_type_slug,
  s.width_px,
  s.height_px,
  s.aspect_ratio_label,
  s.accepted_formats,
  s.background_required,
  s.product_fill_min_pct,
  s.spec_confidence
FROM image_specs s
JOIN platforms p         ON p.id = s.platform_id
JOIN image_type_defs itd ON itd.id = s.image_type_id
WHERE p.slug = ANY($1::text[])
ORDER BY p.slug, itd.category;

-- Industry playbook for recommendation engine
SELECT content_mix, required_image_types, required_video_types,
       monthly_volume_growth, ad_creative_mix, restrictions
FROM industry_playbooks
WHERE industry_slug = $1;
```

---

## 9. Linear Issue Mapping

### Sprint 1 — Foundation

| IPI Issue | Feature | File(s) | Notes |
|-----------|---------|---------|-------|
| IPI-200 | `media-advisor` agent definition | `agents/media-advisor.ts` | New agent; model + memory + tools wired |
| IPI-201 | `MediaBrief` Zod schema + TypeScript types | `lib/types/media.ts` | Shared across agent + API |
| IPI-202 | Discovery flow conversation (Steps 1-5) | `agents/media-advisor.ts` instructions | Operator-facing UX |
| IPI-203 | `generateChannelRequirements` tool | `tools/media-advisor/channel-requirements.ts` | Queries `image_specs` table |
| IPI-204 | `recommendMissingAssets` tool | `tools/media-advisor/missing-assets.ts` | Implements section 12.5 from 02-image-types.md |
| IPI-205 | DB migration: `media_briefs` + `media_recommendations` + `asset_coverage_scores` | `supabase/migrations/` | See section 8.2 |
| IPI-206 | DB migration: `industry_playbooks` seed data | `supabase/seeds/industry-playbooks.sql` | Section 6 data |

### Sprint 2 — Recommendation Engine

| IPI Issue | Feature | File(s) | Notes |
|-----------|---------|---------|-------|
| IPI-210 | `recommendImageTypes` tool | `tools/media-advisor/recommend-image-types.ts` | Core recommendation logic |
| IPI-211 | `recommendVideoTypes` tool | `tools/media-advisor/recommend-video-types.ts` | Platform video format matrix |
| IPI-212 | `recommendCreativeMix` tool | `tools/media-advisor/recommend-creative-mix.ts` | Reads `industry_playbooks` |
| IPI-213 | `scoreAssetCoverage` tool | `tools/media-advisor/score-asset-coverage.ts` | Writes to `asset_coverage_scores` |
| IPI-214 | `MediaRecommendation` output builder | `tools/media-advisor/build-recommendation.ts` | Assembles all tool outputs |
| IPI-215 | `confirmMediaRecommendation` tool | `tools/media-advisor/confirm-recommendation.ts` | HITL gate -> writes `shoot_briefs` for production-planner |

### Sprint 3 — UI + Campaign Workflows

| IPI Issue | Feature | File(s) | Notes |
|-----------|---------|---------|-------|
| IPI-220 | Media Advisor chat page | `app/brand/[id]/media-advisor/` | Frontend UI |
| IPI-221 | Discovery flow UI (channel selector, budget tier, campaign type) | Component in media-advisor page | Wizard-style multi-step |
| IPI-222 | Recommendation display UI (image type cards, coverage score) | `MediaRecommendationPanel` component | Shows rec output |
| IPI-223 | Asset coverage score badge on brand dashboard | `BrandDashboard` component | Alert when score < 60 |
| IPI-224 | 7 campaign workflow triggers | Agent instruction + tool routing | brand_launch, product_launch, collection_launch, seasonal, bfcm, influencer, retargeting |
| IPI-225 | `image_specs` + `platforms` DB migration | `supabase/migrations/` | From section 13.2 of 02-image-types.md |

### Sprint 4 — Industry Playbooks + Quality

| IPI Issue | Feature | File(s) | Notes |
|-----------|---------|---------|-------|
| IPI-230 | Industry playbook seeds: Fashion, Luxury, Beauty, Jewelry, Accessories, Streetwear, Swimwear | `supabase/seeds/` | 7 playbooks from section 6 |
| IPI-231 | `media-advisor` agent test suite | `agents/media-advisor.test.ts` | Mock brand profiles -> assert rec shape |
| IPI-232 | Creative fatigue monitoring (ad asset age > 21 days alert) | `tools/media-advisor/creative-fatigue.ts` | Checks `media_recommendations.confirmed_at` |
| IPI-233 | Seasonal campaign auto-detection | `tools/media-advisor/detect-season.ts` | Date-based + brand schedule |
| IPI-234 | BFCM + holiday campaign workflow | Agent instruction + tool routing | See section 7.5 |

---

## Appendix A — Shared Zod Schemas

```typescript
// app/src/lib/types/media.ts
import { z } from "zod";

export const IndustrySchema = z.enum([
  'fashion','luxury','beauty','jewelry','accessories',
  'streetwear','swimwear','footwear','handbags','cosmetics',
  'skincare','haircare','restaurant','hotel','fitness','other',
]);

export const CampaignTypeSchema = z.enum([
  'brand_launch','product_launch','collection_launch',
  'seasonal','holiday','bfcm','influencer','ugc','retargeting','always_on',
]);

export const SeasonSchema = z.enum([
  'SS','AW','holiday','pre_fall','resort','SS_launch','AW_launch',
]);

export const BudgetTierSchema = z.enum(['micro','growth','scale']);

export const FunnelStageSchema = z.enum([
  'awareness','consideration','conversion','retention',
]);

export const CampaignGoalSchema = z.enum([
  'brand_awareness','product_launch','conversion','retention',
  'community','seo_discovery','ecommerce_direct',
]);

export const PrioritySchema = z.enum(['required','recommended','optional']);

export const SeveritySchema = z.enum(['critical','warning','suggestion']);

export const MediaBriefSchema = z.object({
  brand_id: z.string().uuid(),
  created_at: z.string().datetime(),
  brand: z.object({
    name: z.string(),
    url: z.string().url(),
    industry: IndustrySchema,
    sub_industry: z.string().optional(),
    brand_tier: z.enum(['mass','premium','luxury']),
    visual_style: z.array(z.string()),
    dna_score: z.number().min(0).max(100).nullable(),
  }),
  channels: z.object({
    social: z.array(z.string()),
    ecommerce: z.array(z.string()),
    advertising: z.array(z.string()),
  }),
  campaign: z.object({
    type: CampaignTypeSchema,
    season: SeasonSchema,
    goal: CampaignGoalSchema,
    funnel_stage: FunnelStageSchema,
    product_count: z.number().int().positive(),
    launch_date: z.string().datetime().nullable(),
  }),
  budget: z.object({
    tier: BudgetTierSchema,
    monthly_usd: z.number().nullable(),
    organic_pct: z.number().min(0).max(100),
    paid_pct: z.number().min(0).max(100),
    ugc_pct: z.number().min(0).max(100),
  }),
  existing_assets: z.object({
    has_brand_shoot: z.boolean(),
    has_product_on_white: z.boolean(),
    has_lifestyle: z.boolean(),
    has_video: z.boolean(),
    has_ugc: z.boolean(),
    asset_list: z.array(z.object({
      platform_slug: z.string(),
      asset_type_slug: z.string(),
      width_px: z.number(),
      height_px: z.number(),
      has_watermark: z.boolean().default(false),
      background: z.enum(['white','neutral','lifestyle','other']).optional(),
    })),
  }),
  gaps: z.array(z.object({
    channel: z.string(),
    asset_type: z.string(),
    severity: SeveritySchema,
    message: z.string(),
  })),
});

export type MediaBrief = z.infer<typeof MediaBriefSchema>;

export const ContentMixRecSchema = z.object({
  lifestyle_pct: z.number().min(0).max(100),
  product_studio_pct: z.number().min(0).max(100),
  ugc_pct: z.number().min(0).max(100),
  editorial_pct: z.number().min(0).max(100),
  behind_scenes_pct: z.number().min(0).max(100),
  ad_creative_pct: z.number().min(0).max(100),
  reasoning: z.string(),
});

export const MediaRecommendationSchema = z.object({
  id: z.string().uuid(),
  brand_id: z.string().uuid(),
  brief_id: z.string().uuid(),
  created_at: z.string().datetime(),
  platform: z.string(),
  imageTypes: z.array(z.object({
    image_type_slug: z.string(),
    platform_slug: z.string(),
    width_px: z.number(),
    height_px: z.number(),
    aspect_ratio_label: z.string(),
    accepted_formats: z.array(z.string()),
    background_required: z.string().nullable(),
    quantity: z.number().int().positive(),
    priority: PrioritySchema,
    funnel_stage: FunnelStageSchema,
    reasoning: z.string(),
  })),
  videoTypes: z.array(z.object({
    video_type: z.string(),
    platform_slug: z.string(),
    width_px: z.number(),
    height_px: z.number(),
    aspect_ratio_label: z.string(),
    duration_seconds: z.number(),
    quantity: z.number(),
    priority: PrioritySchema,
    reasoning: z.string(),
  })),
  adCreatives: z.array(z.object({
    ad_format: z.string(),
    platform_slug: z.string(),
    placement: z.string(),
    width_px: z.number(),
    height_px: z.number(),
    funnel_stage: FunnelStageSchema,
    creative_style: z.string(),
    quantity: z.number(),
    a_b_variants: z.number(),
    refresh_interval_days: z.number(),
    reasoning: z.string(),
  })),
  ecommerceAssets: z.array(z.object({
    platform_slug: z.string(),
    asset_type: z.string(),
    width_px: z.number(),
    height_px: z.number(),
    background_required: z.string().nullable(),
    product_fill_min_pct: z.number().nullable(),
    quantity_per_product: z.number(),
    total_quantity: z.number(),
    priority: PrioritySchema,
    reasoning: z.string(),
  })),
  missingAssets: z.array(z.object({
    channel: z.string(),
    asset_type: z.string(),
    severity: SeveritySchema,
    message: z.string(),
    recommended_spec: z.object({
      width_px: z.number(),
      height_px: z.number(),
      aspect_ratio_label: z.string(),
      format: z.string(),
    }),
  })),
  contentMix: ContentMixRecSchema,
  shootRequirements: z.array(z.object({
    shoot_type: z.enum(['studio','location','ecommerce_white','macro']),
    priority: z.enum(['required','recommended']),
    deliverable_count: z.number(),
    estimated_hours: z.number(),
    crew: z.array(z.string()),
    notes: z.string(),
  })),
  priorityScore: z.number().min(0).max(100),
  confidenceScore: z.number().min(0).max(100),
  reasoning: z.string(),
});

export type MediaRecommendation = z.infer<typeof MediaRecommendationSchema>;
```

---

*This document is the authoritative technical specification for the `media-advisor` agent. All sprint issues and implementation decisions should reference this plan.*
