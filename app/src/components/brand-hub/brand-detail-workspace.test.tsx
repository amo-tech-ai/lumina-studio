// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

vi.mock("./brand-detail.module.css", () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock("next/image", () => ({ default: () => null }));
vi.mock("@/components/intelligence-panel/evidence-dialog", () => ({
  EvidenceDialog: ({ triggerLabel }: { triggerLabel: string }) => (
    <button type="button">{triggerLabel}</button>
  ),
}));
vi.mock("@/components/brand-hub/analysis-progress-banner", () => ({
  AnalysisProgressBanner: () => null,
}));
vi.mock("@/components/brand-hub/brand-detail-draft-card", () => ({
  BrandDetailDraftCard: () => null,
}));
vi.mock("@/app/(operator)/app/brand/[id]/actions", () => ({
  reanalyzeBrand: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));
const mockUseAgentContext = vi.fn();
vi.mock("@copilotkit/react-core/v2", () => ({
  useAgentContext: (...args: unknown[]) => mockUseAgentContext(...args),
}));

import { BrandDetailWorkspace } from "./brand-detail-workspace";

afterEach(() => cleanup());

describe("BrandDetailWorkspace", () => {
  it("renders DC hero, breadcrumb, and greeting for populated brand", () => {
    render(
      <BrandDetailWorkspace
        brandId="nike-id"
        brandName="Nike"
        brandUrl="https://nike.com"
        intakeStatus="ready"
        dnaScore={87}
        profile={{ tagline: "Just do it" }}
        draftProfile={null}
        baseScores={[
          { score_type: "visual", score: 72, source: "ai", score_version: 1 },
          { score_type: "audience", score: 94, source: "ai", score_version: 1 },
        ]}
        isAuthenticated
      />,
    );

    expect(screen.getByTestId("brand-detail-workspace")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Brands" })).toBeTruthy();
    expect(screen.getByText(/Nike DNA: 87/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: /Plan a Shoot/i })).toBeTruthy();
    expect(screen.getByText(/Assets \(\d+\)/)).toBeTruthy();
  });
});
