import { describe, expect, it } from "vitest";

import {
  commandCenterApprovalFallbacks,
  isPanelApprovalFallback,
} from "./panel-approval-fallbacks";
import { resolvePanelApprovals } from "./resolve-panel-approvals";

describe("panel-approval-fallbacks", () => {
  it("returns three DC-aligned placeholder approval cards", () => {
    const items = commandCenterApprovalFallbacks("brand-1");
    expect(items).toHaveLength(3);
    expect(items[0].label).toBe("IG deliverable");
    expect(items[0].thumbnailUrl).toBeTruthy();
    expect(items[0].source).toBe("brand-match");
    expect(isPanelApprovalFallback(items[0].id)).toBe(true);
  });

  it("pads empty approvals on command center populated overview", () => {
    const result = resolvePanelApprovals(
      { pendingCount: 0, items: [] },
      "brand-1",
      true,
    );
    expect(result.items).toHaveLength(3);
    expect(result.pendingCount).toBe(3);
  });

  it("enriches live API rows with thumbs without inventing confidence", () => {
    const result = resolvePanelApprovals(
      {
        pendingCount: 1,
        items: [
          {
            id: "live-1",
            kind: "brand_draft",
            label: "Acme — draft ready for review",
            href: "/app/brand/live-1",
          },
        ],
      },
      "brand-1",
      true,
    );
    expect(result.items[0].thumbnailUrl).toBeTruthy();
    expect(result.items[0].confidence).toBeUndefined();
    expect(result.items[0].label).toBe("Acme");
    expect(result.items.length).toBe(3);
    expect(result.items[1].confidence).toBe(91);
  });
});
