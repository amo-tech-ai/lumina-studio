import {
  DEV_PREVIEW_HERO_BRAND_ID,
  isDevSkipMode,
} from "@/components/operator-panel/dev-skip-fixture";
import type { IntelligencePanelData } from "./panel-contract";

export { DEV_PREVIEW_HERO_BRAND_ID, isDevSkipMode };

const CLOUDINARY_CLOUD = "dza2bjwwp";

function cloudinaryImageUrl(publicId: string, { w, h }: { w: number; h: number }): string {
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/upload/c_fill,w_${w},h_${h},g_auto,q_auto,f_auto/${publicId}`;
}

const THUMB_VISUAL = cloudinaryImageUrl("39-fashionos_koxmek", { w: 120, h: 150 });
const THUMB_VOICE = cloudinaryImageUrl("8-fashionos_o0m6yc", { w: 120, h: 150 });
const THUMB_BRAND = cloudinaryImageUrl("103-fashionos_gawzdu", { w: 120, h: 150 });
const HERO_FALLBACK = cloudinaryImageUrl("5-fashionos_wc2p1c", { w: 472, h: 590 });

export const DEV_INTELLIGENCE_PANEL_DATA: IntelligencePanelData = {
  brand: {
    id: DEV_PREVIEW_HERO_BRAND_ID,
    name: "Nike",
    status: "active",
    summary:
      "Portfolio overview — Spring hero live. Visual DNA dipped; 3 drafts need review before campaign push.",
    lastUpdated: "2 hours ago",
  },
  scores: {
    dna: 87,
    pillars: {
      visual: 92,
      audience: 85,
      consistency: 88,
      commerce_readiness: 81,
    },
  },
  health: [
    { key: "brand", label: "Brand", score: 87 },
    { key: "visual", label: "Visual", score: 92, trendDelta: -4 },
    { key: "voice", label: "Voice", score: 85 },
    { key: "commerce", label: "Commerce", score: 81, trendDelta: 2 },
  ],
  dnaEvidence: {
    title: "Nike DNA",
    score: 87,
    potential: 91,
    confidence: 89,
    why: "Composite of visual, voice, and commerce readiness pillars.",
    evidence: [{ text: "Scores derived from brand intelligence analysis." }],
  },
  insights: [
    {
      id: "insight-priority",
      kind: "priority",
      label: "Highest priority",
      value: "Visual identity draft — blocks Spring campaign assets",
      confidence: 91,
    },
    {
      id: "insight-lowest",
      kind: "lowest_score",
      label: "Lowest score",
      value: "Commerce readiness at 81 — PDP imagery gaps on Amazon",
      confidence: 88,
    },
    {
      id: "insight-review",
      kind: "needs_review",
      label: "Needs review",
      value: "3 brand drafts pending · Visual score dropped yesterday",
      confidence: 86,
    },
    {
      id: "insight-rec",
      kind: "recommendation",
      label: "Recommended next action",
      value: "Review Visual Identity draft first, then regenerate IG deliverables",
      confidence: 84,
    },
  ],
  approvals: {
    pendingCount: 3,
    items: [
      {
        id: "dev-approval-1",
        kind: "brand_draft",
        label: "Brand profile draft",
        href: `/app/brand/${DEV_PREVIEW_HERO_BRAND_ID}`,
        thumbnailUrl: THUMB_BRAND,
        confidence: 89,
        explanation: "AI refreshed tagline and category from nike.com crawl.",
        evidence: {
          title: "Brand profile draft",
          score: 87,
          potential: 91,
          confidence: 89,
          why: "Homepage hero and category signals align with performance positioning.",
          reasoning:
            "Gemini matched tone-of-voice samples to existing Spring hero assets.",
          evidence: [{ text: "Tagline shift improves clarity for campaign hooks." }],
          evidenceImgs: [HERO_FALLBACK],
          suggestions: [{ text: "Approve to publish profile", gain: 4 }],
        },
      },
      {
        id: "dev-approval-2",
        kind: "brand_draft",
        label: "Visual identity update",
        href: `/app/brand/${DEV_PREVIEW_HERO_BRAND_ID}`,
        thumbnailUrl: THUMB_VISUAL,
        confidence: 92,
        explanation: "Palette contrast improved; primary orange retained.",
        evidence: {
          title: "Visual identity update",
          score: 92,
          potential: 95,
          confidence: 92,
          why: "Contrast ratio on CTAs meets WCAG AA on mobile previews.",
          evidence: [{ text: "Hero crop rules updated for 4:5 IG grid." }],
          evidenceImgs: [THUMB_VISUAL],
        },
      },
      {
        id: "dev-approval-3",
        kind: "brand_draft",
        label: "Voice guidelines draft",
        href: `/app/brand/${DEV_PREVIEW_HERO_BRAND_ID}`,
        thumbnailUrl: THUMB_VOICE,
        confidence: 78,
        explanation: "Voice tone skews promotional — tighten for performance copy.",
        evidence: {
          title: "Voice guidelines draft",
          score: 85,
          potential: 90,
          confidence: 78,
          why: "Instagram captions in recent shoots exceed sentence-length target.",
          evidence: [{ text: "3 of 5 recent captions flagged for voice drift." }],
        },
      },
    ],
  },
  recommendedActions: [
    { id: "act-review", label: "Review approvals", href: `/app/brand/${DEV_PREVIEW_HERO_BRAND_ID}` },
    { id: "act-visual", label: "Improve visual DNA", href: `/app/brand/${DEV_PREVIEW_HERO_BRAND_ID}` },
    { id: "act-shoot", label: "Plan shoot", href: "/app/shoots/new" },
  ],
  activity: [
    {
      period: "yesterday",
      title: "Yesterday",
      items: [
        { id: "a1", label: "Visual DNA", detail: "Score −4 after carousel audit" },
        { id: "a2", label: "Spring hero", detail: "Shoot marked ready for deliverables" },
      ],
    },
    {
      period: "today",
      title: "Today",
      items: [
        { id: "a3", label: "3 drafts", detail: "Awaiting operator review" },
        { id: "a4", label: "Portfolio sync", detail: "Live · Supabase KPI refresh" },
      ],
    },
    {
      period: "upcoming",
      title: "Upcoming",
      items: [
        { id: "a5", label: "IG deliverables", detail: "Generate after approval gate" },
        { id: "a6", label: "Amazon PDP", detail: "Commerce imagery gap review" },
      ],
    },
  ],
};
