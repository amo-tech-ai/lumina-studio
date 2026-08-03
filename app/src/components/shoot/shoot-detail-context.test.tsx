// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";

const mockUseAgentContext = vi.fn();
vi.mock("@copilotkit/react-core/v2", () => ({
  useAgentContext: (...args: unknown[]) => mockUseAgentContext(...args),
}));

import { useShootDetailContext } from "./shoot-detail-context";
import { renderHook } from "@testing-library/react";

describe("useShootDetailContext", () => {
  beforeEach(() => {
    mockUseAgentContext.mockClear();
  });

  it("injects shootId and brandId for the open shoot", () => {
    renderHook(() =>
      useShootDetailContext({
        shootId: "shoot-1",
        shootName: "Spring Campaign",
        shootStatus: "active",
        brandId: "brand-1",
        brandName: "Acme",
        channels: ["instagram"],
        shotCount: 3,
        deliverableCount: 2,
        dnaScore: 87,
        hasBrief: true,
      }),
    );

    expect(mockUseAgentContext).toHaveBeenCalledTimes(1);
    const arg = mockUseAgentContext.mock.calls[0][0] as {
      description: string;
      value: Record<string, unknown>;
    };
    expect(arg.description).toContain("Spring Campaign");
    expect(arg.description).toContain("Acme");
    expect(arg.description).toMatch(/never ask/i);
    expect(arg.value).toMatchObject({
      surface: "shoot-detail",
      shoot_id: "shoot-1",
      brand_id: "brand-1",
      brand_name: "Acme",
      shot_count: 3,
    });
  });

  it("suggests shot-list help when the shoot has no shots", () => {
    renderHook(() =>
      useShootDetailContext({
        shootId: "shoot-1",
        shootName: "Empty Shoot",
        shootStatus: "draft",
        brandId: "brand-1",
        brandName: "Acme",
        channels: [],
        shotCount: 0,
        deliverableCount: 0,
        dnaScore: null,
        hasBrief: false,
      }),
    );

    const arg = mockUseAgentContext.mock.calls[0][0] as {
      description: string;
      value: { suggested_next_actions: string[] };
    };
    expect(arg.description).toMatch(/Shot list is empty/i);
    expect(arg.value.suggested_next_actions.some((a) => /shot list/i.test(a))).toBe(true);
  });
});
