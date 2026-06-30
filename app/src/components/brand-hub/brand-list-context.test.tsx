// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

const mockUseAgentContext = vi.fn();
vi.mock("@copilotkit/react-core/v2", () => ({
  useAgentContext: (...args: unknown[]) => mockUseAgentContext(...args),
}));

import { BrandListContext } from "./brand-list-context";

beforeEach(() => mockUseAgentContext.mockClear());

describe("BrandListContext — IPI-260 brand list agent wiring", () => {
  it("injects brand list summary with brandId per row", () => {
    render(
      <BrandListContext
        brands={[
          { id: "aaa", name: "Lumina", dnaScore: 75, intakeStatus: "ready" },
          { id: "bbb", name: "Everlane", dnaScore: 62, intakeStatus: "draft_ready" },
        ]}
      />,
    );

    expect(mockUseAgentContext).toHaveBeenCalledTimes(1);
    expect(mockUseAgentContext.mock.calls[0][0].value).toMatchObject({
      view: "brand_list",
      count: 2,
      brands: [
        { brandId: "aaa", name: "Lumina", dna_score: 75, intake_status: "ready" },
        { brandId: "bbb", name: "Everlane", dna_score: 62, intake_status: "draft_ready" },
      ],
    });
  });
});
