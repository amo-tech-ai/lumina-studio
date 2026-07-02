import { enrichApprovalItem } from "./enrich-approval-item";
import {
  commandCenterApprovalFallbacks,
  DC_PANEL_APPROVAL_COUNT,
} from "./panel-approval-fallbacks";
import type { IntelligencePanelData } from "./panel-contract";

export function resolvePanelApprovals(
  approvals: IntelligencePanelData["approvals"],
  brandId: string | null,
  padForCommandCenter: boolean,
): IntelligencePanelData["approvals"] {
  const effectiveBrandId =
    brandId ?? (padForCommandCenter ? "command-center-hero" : null);
  if (!effectiveBrandId) return approvals;

  const enriched = approvals.items.map((item, index) =>
    enrichApprovalItem(item, index, effectiveBrandId),
  );

  if (!padForCommandCenter) {
    return {
      pendingCount: Math.max(approvals.pendingCount, enriched.length),
      items: enriched,
    };
  }

  if (enriched.length >= DC_PANEL_APPROVAL_COUNT) {
    return {
      pendingCount: Math.max(approvals.pendingCount, enriched.length),
      items: enriched.slice(0, DC_PANEL_APPROVAL_COUNT),
    };
  }

  const merged = [...enriched];
  for (const tile of commandCenterApprovalFallbacks(effectiveBrandId)) {
    if (merged.length >= DC_PANEL_APPROVAL_COUNT) break;
    if (merged.some((row) => row.id === tile.id)) continue;
    merged.push(tile);
  }

  const count = Math.max(approvals.pendingCount, merged.length, DC_PANEL_APPROVAL_COUNT);

  return {
    pendingCount: count,
    items: merged.slice(0, DC_PANEL_APPROVAL_COUNT),
  };
}
