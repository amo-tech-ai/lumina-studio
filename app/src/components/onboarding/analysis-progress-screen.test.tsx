// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EMPTY_ANSWERS } from "@/lib/onboarding/navigation";

const mockKickoff = vi.fn();
const mockStartBi = vi.fn();
const mockReconnect = vi.fn();

let mockProgress = {
  intakeStatus: "crawl_running",
  crawl: { pages_crawled: 3, pages_found: 10 } as {
    pages_crawled: number | null;
    pages_found: number | null;
  } | null,
  phase: "live" as string,
  reconnect: mockReconnect,
};

vi.mock("@/lib/onboarding/kickoff-onboarding-analysis", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/onboarding/kickoff-onboarding-analysis")>();
  return {
    ...actual,
    kickoffOnboardingCrawl: (...args: unknown[]) => mockKickoff(...args),
    startOnboardingBrandIntelligence: (...args: unknown[]) => mockStartBi(...args),
  };
});

vi.mock("@/lib/brand-hub/use-brand-analysis-progress", () => ({
  useBrandAnalysisProgress: () => mockProgress,
}));

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({ mocked: true }),
}));

vi.mock("@/components/brand-hub/restart-analysis-button", () => ({
  RestartAnalysisButton: ({ brandId }: { brandId: string }) => (
    <button type="button" data-testid="restart-analysis-button" data-brand-id={brandId}>
      Restart analysis
    </button>
  ),
}));

import { AnalysisProgressScreen } from "./analysis-progress-screen";

const answers = {
  ...EMPTY_ANSWERS,
  brandName: "Maison",
  websiteUrl: "https://maison.example",
};

describe("AnalysisProgressScreen — IPI-835 · C", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockKickoff.mockResolvedValue({
      kind: "crawl_started",
      crawlId: "crawl-1",
      reused: false,
      startBiNow: false,
    });
    mockStartBi.mockResolvedValue(undefined);
    mockProgress = {
      intakeStatus: "crawl_running",
      crawl: { pages_crawled: 3, pages_found: 10 },
      phase: "live",
      reconnect: mockReconnect,
    };
  });

  afterEach(() => {
    cleanup();
  });

  it("shows missing-brand alert without a brandId (no timer success)", () => {
    const onComplete = vi.fn();
    render(
      <AnalysisProgressScreen brandId={null} answers={answers} onComplete={onComplete} />,
    );
    expect(screen.getByTestId("analysis-status").textContent).toMatch(/not ready/i);
    expect(onComplete).not.toHaveBeenCalled();
    expect(mockKickoff).not.toHaveBeenCalled();
  });

  it("kicks off crawl once and shows crawl page counts from the shared formatter", async () => {
    render(
      <AnalysisProgressScreen
        brandId="brand-1"
        answers={answers}
        onComplete={vi.fn()}
        quietGapMs={0}
      />,
    );

    expect(await screen.findByText(/Crawling your website/i)).toBeTruthy();
    expect(screen.getByTestId("analysis-status").textContent).toMatch(
      /3 of 10 pages crawled/,
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(mockKickoff).toHaveBeenCalledTimes(1);
    expect(mockKickoff.mock.calls[0][1]).toBe("brand-1");
    expect(mockKickoff.mock.calls[0][2]).toBe("https://maison.example");
  });

  it("calls onComplete when server status is reviewable (no client timer)", async () => {
    mockProgress = {
      intakeStatus: "scores_complete",
      crawl: null,
      phase: "live",
      reconnect: mockReconnect,
    };
    mockKickoff.mockResolvedValue({
      kind: "already_done",
      intakeStatus: "scores_complete",
    });
    const onComplete = vi.fn();
    render(
      <AnalysisProgressScreen
        brandId="brand-1"
        answers={answers}
        onComplete={onComplete}
        quietGapMs={0}
      />,
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("starts BI when kickoff reports startBiNow", async () => {
    mockKickoff.mockResolvedValue({
      kind: "crawl_started",
      crawlId: "crawl-9",
      reused: true,
      startBiNow: true,
    });
    mockProgress = {
      intakeStatus: "crawl_complete",
      crawl: null,
      phase: "live",
      reconnect: mockReconnect,
    };

    render(
      <AnalysisProgressScreen
        brandId="brand-1"
        answers={answers}
        onComplete={vi.fn()}
        quietGapMs={0}
      />,
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mockStartBi).toHaveBeenCalled();
  });

  it("shows crawl warning and starts BI when kickoff returns crawl_failed", async () => {
    mockKickoff.mockResolvedValue({
      kind: "crawl_failed",
      error: "firecrawl down",
      startBiNow: true,
    });
    mockProgress = {
      intakeStatus: "brand_created",
      crawl: null,
      phase: "live",
      reconnect: mockReconnect,
    };

    render(
      <AnalysisProgressScreen
        brandId="brand-1"
        answers={answers}
        onComplete={vi.fn()}
        quietGapMs={0}
      />,
    );

    expect(await screen.findByText(/Crawl warning: firecrawl down/i)).toBeTruthy();
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mockStartBi).toHaveBeenCalledTimes(1);
  });

  it("waits for kickoff to settle before deferred BI, attaching crawlResultId", async () => {
    let resolveKickoff!: (value: unknown) => void;
    mockKickoff.mockReturnValue(
      new Promise((resolve) => {
        resolveKickoff = resolve;
      }),
    );
    mockProgress = {
      intakeStatus: "crawl_complete",
      crawl: null,
      phase: "live",
      reconnect: mockReconnect,
    };

    render(
      <AnalysisProgressScreen
        brandId="brand-1"
        answers={answers}
        onComplete={vi.fn()}
        quietGapMs={0}
      />,
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(mockStartBi).not.toHaveBeenCalled();

    await act(async () => {
      resolveKickoff({
        kind: "crawl_started",
        crawlId: "crawl-deferred",
        reused: false,
        startBiNow: false,
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockStartBi).toHaveBeenCalledTimes(1);
    expect(mockStartBi.mock.calls[0][3]).toEqual({ crawlResultId: "crawl-deferred" });
  });

  it("proceeds with crawl when website URL is present (blank URL blocked at screen 4)", async () => {
    render(
      <AnalysisProgressScreen
        brandId="brand-1"
        answers={{ ...answers, websiteUrl: "https://maison.example.com" }}
        onComplete={vi.fn()}
        quietGapMs={0}
      />,
    );

    // No needs_website dead-end — the contract is enforced at screen 4.
    expect(screen.queryByText(/Website needed/i)).toBeNull();

    expect(mockKickoff).toHaveBeenCalledTimes(1);
    expect(mockStartBi).not.toHaveBeenCalled();
  });

  it("shows fatal error if needs_website reaches analysis (pre-enforcement resume guard)", async () => {
    mockKickoff.mockResolvedValue({ kind: "needs_website" });

    render(
      <AnalysisProgressScreen
        brandId="brand-1"
        answers={{ ...answers, websiteUrl: "" }}
        onComplete={vi.fn()}
        quietGapMs={0}
      />,
    );

    // Defensive guard: website is enforced at screen 4, but a resumed session
    // from before the fix should surface an error, not a dead-end button.
    expect(await screen.findByText(/Website URL is required.*Brand DNA/i)).toBeTruthy();
    expect(mockKickoff).toHaveBeenCalledTimes(1);
    expect(mockStartBi).not.toHaveBeenCalled();
  });

  it("shows fatal failure with Retry that re-runs kickoff", async () => {
    mockKickoff
      .mockRejectedValueOnce(new Error("brands read failed"))
      .mockResolvedValueOnce({
        kind: "crawl_started",
        crawlId: "crawl-retry",
        reused: false,
        startBiNow: false,
      });

    render(
      <AnalysisProgressScreen
        brandId="brand-1"
        answers={answers}
        onComplete={vi.fn()}
        quietGapMs={0}
      />,
    );

    expect(await screen.findByText(/Analysis failed/i)).toBeTruthy();
    expect(screen.getByTestId("analysis-status").textContent).toMatch(/brands read failed/i);

    fireEvent.click(screen.getByRole("button", { name: /Retry/i }));

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mockKickoff).toHaveBeenCalledTimes(2);
    expect(await screen.findByText(/Crawling your website/i)).toBeTruthy();
  });

  it("offers Restart analysis button when server intake_status is failed", async () => {
    mockKickoff.mockResolvedValue({
      kind: "listen_only",
      intakeStatus: "failed",
    });
    mockProgress = {
      intakeStatus: "failed",
      crawl: null,
      phase: "failed",
      reconnect: mockReconnect,
    };

    render(
      <AnalysisProgressScreen
        brandId="brand-1"
        answers={answers}
        onComplete={vi.fn()}
        quietGapMs={0}
      />,
    );

    expect(await screen.findByText(/Analysis failed/i)).toBeTruthy();
    expect(screen.getByTestId("analysis-status").textContent).toMatch(/Restart analysis to pick up/i);
    expect(screen.getByTestId("restart-analysis-button")).toBeTruthy();
    expect(screen.getByTestId("restart-analysis-button").getAttribute("data-brand-id")).toBe(
      "brand-1",
    );
  });

  it("transitions from failed to running when server status updates after restart", async () => {
    mockKickoff.mockResolvedValue({
      kind: "listen_only",
      intakeStatus: "failed",
    });
    mockProgress = {
      intakeStatus: "failed",
      crawl: null,
      phase: "failed",
      reconnect: mockReconnect,
    };

    const { rerender } = render(
      <AnalysisProgressScreen
        brandId="brand-1"
        answers={answers}
        onComplete={vi.fn()}
        quietGapMs={0}
      />,
    );

    expect(await screen.findByText(/Analysis failed/i)).toBeTruthy();

    // Simulate Realtime updating intake_status after restart succeeds.
    mockProgress = {
      intakeStatus: "crawl_running",
      crawl: { pages_crawled: 3, pages_found: 10 },
      phase: "live",
      reconnect: mockReconnect,
    };
    rerender(
      <AnalysisProgressScreen
        brandId="brand-1"
        answers={answers}
        onComplete={vi.fn()}
        quietGapMs={0}
      />,
    );

    expect(await screen.findByText(/Crawling your website/i)).toBeTruthy();
    expect(screen.queryByText(/Analysis failed/i)).toBeNull();
    expect(screen.queryByTestId("restart-analysis-button")).toBeNull();
  });

  it("advances to payoff screen when draft_ready is received after restart", async () => {
    mockKickoff.mockResolvedValue({
      kind: "listen_only",
      intakeStatus: "failed",
    });
    mockProgress = {
      intakeStatus: "failed",
      crawl: null,
      phase: "failed",
      reconnect: mockReconnect,
    };

    const onComplete = vi.fn();
    const { rerender } = render(
      <AnalysisProgressScreen
        brandId="brand-1"
        answers={answers}
        onComplete={onComplete}
        quietGapMs={0}
      />,
    );

    expect(await screen.findByText(/Analysis failed/i)).toBeTruthy();

    // Simulate the restart flow reaching draft_ready.
    mockProgress = {
      intakeStatus: "draft_ready",
      crawl: null,
      phase: "idle",
      reconnect: mockReconnect,
    };
    rerender(
      <AnalysisProgressScreen
        brandId="brand-1"
        answers={answers}
        onComplete={onComplete}
        quietGapMs={0}
      />,
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
