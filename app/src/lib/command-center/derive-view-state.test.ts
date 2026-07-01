import { describe, expect, it } from "vitest";

import {
  deriveWorkspaceView,
  showApprovalBlock,
  showPortfolioHero,
  showRecentWorkRow,
} from "./derive-view-state";
import { EMPTY_COMMAND_CENTER_DATA, type CommandCenterData } from "./types";

const baseBrand = {
  id: "b1",
  name: "Nike",
  brandUrl: "https://nike.com",
  intakeStatus: "ready",
  dnaScore: 87,
};

function data(overrides: Partial<CommandCenterData> = {}): CommandCenterData {
  return { ...EMPTY_COMMAND_CENTER_DATA, ...overrides };
}

describe("deriveWorkspaceView", () => {
  it("returns loading when loading flag set", () => {
    expect(deriveWorkspaceView(data(), { loading: true })).toBe("loading");
  });

  it("returns populated for dev preview", () => {
    expect(deriveWorkspaceView(data(), { devPreview: true })).toBe("populated");
  });

  it("returns approval for dev preview approval fixture", () => {
    expect(deriveWorkspaceView(data(), { devPreviewApproval: true })).toBe("approval");
  });

  it("returns error when fetchError set", () => {
    expect(deriveWorkspaceView(data({ fetchError: "boom" }))).toBe("error");
  });

  it("returns empty when brandCount is zero", () => {
    expect(deriveWorkspaceView(data({ brandCount: 0 }))).toBe("empty");
  });

  it("returns approval when pending approvals exist", () => {
    expect(
      deriveWorkspaceView(
        data({ brandCount: 2, heroBrand: baseBrand, pendingApprovalCount: 3 }),
      ),
    ).toBe("approval");
  });

  it("returns populated when recent shoots exist and no pending approvals", () => {
    expect(
      deriveWorkspaceView(
        data({
          brandCount: 1,
          heroBrand: baseBrand,
          recentShoots: [
            {
              id: "s1",
              name: "Spring",
              status: "planning",
              dnaScore: 90,
              updatedAt: "2026-06-01T00:00:00Z",
            },
          ],
        }),
      ),
    ).toBe("populated");
  });

  it("returns normal when brand exists without shoots or approvals", () => {
    expect(
      deriveWorkspaceView(data({ brandCount: 1, heroBrand: baseBrand })),
    ).toBe("normal");
  });
});

describe("section visibility helpers", () => {
  it("shows recent row only when shoots exist and view allows content", () => {
    const populated = data({
      brandCount: 1,
      heroBrand: baseBrand,
      recentShoots: [
        {
          id: "s1",
          name: "Spring",
          status: "planning",
          dnaScore: null,
          updatedAt: "2026-06-01T00:00:00Z",
        },
      ],
    });
    expect(showRecentWorkRow("populated", populated)).toBe(true);
    expect(showRecentWorkRow("normal", data({ brandCount: 1, heroBrand: baseBrand }))).toBe(
      false,
    );
    expect(showRecentWorkRow("loading", populated)).toBe(false);
  });

  it("shows hero for normal, populated, approval, and error", () => {
    expect(showPortfolioHero("normal")).toBe(true);
    expect(showPortfolioHero("populated")).toBe(true);
    expect(showPortfolioHero("approval")).toBe(true);
    expect(showPortfolioHero("error")).toBe(true);
    expect(showPortfolioHero("empty")).toBe(false);
    expect(showPortfolioHero("loading")).toBe(false);
  });

  it("shows approval block only in approval view with pending count", () => {
    const d = data({ pendingApprovalCount: 2 });
    expect(showApprovalBlock("approval", d)).toBe(true);
    expect(showApprovalBlock("populated", d)).toBe(false);
    expect(showApprovalBlock("approval", data({ pendingApprovalCount: 0 }))).toBe(false);
  });
});
