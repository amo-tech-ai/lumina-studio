// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mockUseAgentContext = vi.fn();

vi.mock("@copilotkit/react-core/v2", () => ({
  useAgentContext: (...args: unknown[]) => mockUseAgentContext(...args),
}));
vi.mock("@/context/active-brand-context", () => ({
  useActiveBrand: () => ({ activeBrandId: "brand-123", setActiveBrandId: vi.fn() }),
}));

import { useCampaignsContext } from "./campaigns-context";

describe("useCampaignsContext", () => {
  it("injects campaigns route and active brand into agent context", () => {
    renderHook(() => useCampaignsContext());

    expect(mockUseAgentContext).toHaveBeenCalledWith(
      expect.objectContaining({
        value: {
          route: "/app/campaigns",
          active_brand_id: "brand-123",
        },
      }),
    );
  });
});
