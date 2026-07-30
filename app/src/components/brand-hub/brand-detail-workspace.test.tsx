// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";

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
  BrandDetailDraftCard: () => <div data-testid="workflow-draft-card" />,
}));
vi.mock("@/components/brand-hub/draft-banner", () => ({
  DraftBanner: () => <div data-testid="draft-banner-fallback">Draft banner</div>,
}));
const mockReanalyzeBrand = vi.fn();
vi.mock("@/app/(operator)/app/brand/[id]/actions", () => ({
  reanalyzeBrand: (...args: unknown[]) => mockReanalyzeBrand(...args),
}));
const mockRouterRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRouterRefresh, push: vi.fn() }),
}));
const mockToastError = vi.fn();
vi.mock("sonner", () => ({
  toast: { error: (...args: unknown[]) => mockToastError(...args) },
}));
const mockUseAgentContext = vi.fn();
vi.mock("@copilotkit/react-core/v2", () => ({
  useAgentContext: (...args: unknown[]) => mockUseAgentContext(...args),
}));

import { BrandDetailWorkspace } from "./brand-detail-workspace";

afterEach(() => {
  cleanup();
  mockReanalyzeBrand.mockReset();
  mockRouterRefresh.mockReset();
  mockToastError.mockReset();
});

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

  it("renders DraftBanner when draft_ready but workflowRunId is missing", () => {
    render(
      <BrandDetailWorkspace
        brandId="acme-id"
        brandName="Acme"
        brandUrl="https://acme.test"
        intakeStatus="draft_ready"
        dnaScore={0}
        profile={{}}
        draftProfile={{ tagline: "Draft tagline" }}
        workflowRunId={null}
        baseScores={[]}
        isAuthenticated
      />,
    );

    expect(screen.getByTestId("draft-banner-fallback")).toBeTruthy();
    expect(screen.queryByTestId("workflow-draft-card")).toBeNull();
  });

  // IPI-722 — startAnalysis previously discarded a failed result silently;
  // the button appeared to do nothing even though the server returned a
  // real, specific error (e.g. "Brand has no website URL to analyze").
  it("surfaces a toast error when Start analysis fails, without refreshing", async () => {
    mockReanalyzeBrand.mockResolvedValue({
      ok: false,
      error: "Brand has no website URL to analyze",
    });

    render(
      <BrandDetailWorkspace
        brandId="nike-id"
        brandName="Nike"
        brandUrl={null}
        intakeStatus="brand_created"
        dnaScore={0}
        profile={{}}
        draftProfile={null}
        baseScores={[]}
        isAuthenticated
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Start analysis" }));

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith("Brand has no website URL to analyze"));
    expect(mockRouterRefresh).not.toHaveBeenCalled();
  });

  it("refreshes without a toast when Start analysis succeeds", async () => {
    mockReanalyzeBrand.mockResolvedValue({ ok: true, hasDraft: true });

    render(
      <BrandDetailWorkspace
        brandId="nike-id"
        brandName="Nike"
        brandUrl="https://nike.com"
        intakeStatus="brand_created"
        dnaScore={0}
        profile={{}}
        draftProfile={null}
        baseScores={[]}
        isAuthenticated
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Start analysis" }));

    await waitFor(() => expect(mockRouterRefresh).toHaveBeenCalled());
    expect(mockToastError).not.toHaveBeenCalled();
  });
});
