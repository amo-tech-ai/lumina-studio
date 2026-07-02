import type { IntelligenceApprovalItem } from "./panel-contract";
import { cloudinaryImageUrl, SAMPLE_IMAGE_POOL } from "@/lib/command-center/sample-images";

const DEFAULT_CONFIDENCES = [91, 72, 91] as const;
const DEFAULT_SOURCES = ["brand-match", "brand voice", "Spring brief"] as const;

function hashIndex(id: string, mod: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash % mod;
}

function approvalThumb(brandId: string, index: number): string {
  const poolIdx = hashIndex(`${brandId}-approval-${index}`, SAMPLE_IMAGE_POOL.length);
  return cloudinaryImageUrl(SAMPLE_IMAGE_POOL[poolIdx], { w: 92, h: 92 });
}

/** Fill display-only fields for live API rows (no API changes). */
export function enrichApprovalItem(
  item: IntelligenceApprovalItem,
  index: number,
  brandId: string,
): IntelligenceApprovalItem {
  const dashIdx = item.label.indexOf(" — ");
  const title =
    dashIdx >= 0 ? item.label.slice(0, dashIdx).trim() : item.label;

  return {
    ...item,
    label: title,
    thumbnailUrl: item.thumbnailUrl ?? approvalThumb(brandId, index),
    confidence: item.confidence ?? DEFAULT_CONFIDENCES[index % DEFAULT_CONFIDENCES.length],
    explanation:
      item.explanation ??
      (dashIdx >= 0
        ? item.label.slice(dashIdx + 3).trim()
        : "AI draft ready for your review."),
    source: item.source ?? DEFAULT_SOURCES[index % DEFAULT_SOURCES.length],
  };
}
