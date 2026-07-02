import {
  cloudinaryImageUrl,
  hashIndex,
  SAMPLE_IMAGE_POOL,
} from "@/lib/command-center/sample-images";
import type { IntelligenceApprovalItem } from "./panel-contract";

export const DC_PANEL_APPROVAL_COUNT = 3;

export function panelApprovalThumb(brandId: string, index: number): string {
  const poolIdx = hashIndex(`${brandId}-approval-${index}`, SAMPLE_IMAGE_POOL.length);
  return cloudinaryImageUrl(SAMPLE_IMAGE_POOL[poolIdx], { w: 92, h: 92 });
}

const FALLBACK_DEFS = [
  {
    label: "IG deliverable",
    explanation:
      "Spring drop hero — generated from your moodboard + Nike DNA.",
    confidence: 91,
    source: "brand-match",
  },
  {
    label: "IG caption draft",
    explanation: '"Move different. Spring drop lands Friday." — 3 variants.',
    confidence: 72,
    source: "brand voice",
  },
  {
    label: "Shot list v2",
    explanation: "12 looks across 3 setups; adds 2 motion shots.",
    confidence: 91,
    source: "Spring brief",
  },
] as const;

/** DC Command Center populated approvals when API returns no pending drafts. */
export function commandCenterApprovalFallbacks(
  brandId: string,
): IntelligenceApprovalItem[] {
  return FALLBACK_DEFS.map((item, index) => ({
    id: `fallback-approval-${brandId}-${index}`,
    kind: "brand_draft" as const,
    label: item.label,
    href: `/app/brand/${brandId}`,
    thumbnailUrl: panelApprovalThumb(brandId, index),
    confidence: item.confidence,
    explanation: item.explanation,
    source: item.source,
  }));
}

export function isPanelApprovalFallback(id: string): boolean {
  return id.startsWith("fallback-approval-");
}
