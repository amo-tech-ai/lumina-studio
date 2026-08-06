// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("./brand-detail.module.css", () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock("next/image", () => ({ default: () => null }));
vi.mock("@/components/intelligence-panel/evidence-dialog", () => ({
  EvidenceDialog: ({ triggerLabel }: { triggerLabel: string }) => (
    <button type="button">{triggerLabel}</button>
  ),
}));
vi.mock("@/components/brand-hub/analysis-progress-banner", async () => {
  const { RestartAnalysisButton } = await import(
    "@/components/brand-hub/restart-analysis-button"
  );
  return {
    AnalysisProgressBanner: ({
      brandId,
      canRestart,
    }: {
      brandId: string;
      canRestart?: boolean;
    }) => (canRestart ? <RestartAnalysisButton brandId={brandId} /> : null),
  };
});
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("@/components/brand-hub/brand-detail-draft-card", () => ({
  BrandDetailDraftCard: () => <div data-testid="workflow-draft-card" />,
}));
vi.mock("@/components/brand-hub/draft-banner", () => ({
  DraftBanner: () => <div data-testid="draft-banner-fallback">Draft banner</div>,
}));
const mockUseAgentContext = vi.fn();
vi.mock("@copilotkit/react-core/v2", () => ({
  useAgentContext: (...args: unknown[]) => mockUseAgentContext(...args),
}));

import { BrandDetailWorkspace } from "./brand-detail-workspace";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
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

  it("recovers failed analysis via Restart analysis → restart-analysis API (IPI-919)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, mode: "crawl_restarted" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <BrandDetailWorkspace
        brandId="nike-id"
        brandName="Nike"
        brandUrl="https://nike.com"
        intakeStatus="failed"
        dnaScore={0}
        profile={{ _error: "crawl timed out" }}
        draftProfile={null}
        baseScores={[]}
        canRestartAnalysis
        isAuthenticated
      />,
    );

    const restart = screen.getByRole("button", { name: /Restart analysis/i });
    expect(restart).toBeTruthy();
    expect(screen.queryByText("Start analysis", { exact: true })).toBeNull();

    fireEvent.click(restart);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/brands/nike-id/restart-analysis",
        expect.objectContaining({
          method: "POST",
          credentials: "same-origin",
        }),
      );
    });
  });
});
