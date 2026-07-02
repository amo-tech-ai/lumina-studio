import type { IntelligenceApprovalItem } from "./panel-contract";
import { panelApprovalThumb } from "./panel-approval-fallbacks";

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
    thumbnailUrl: item.thumbnailUrl ?? panelApprovalThumb(brandId, index),
    explanation:
      item.explanation ??
      (dashIdx >= 0
        ? item.label.slice(dashIdx + 3).trim()
        : "AI draft ready for your review."),
  };
}
