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

  it("shows website recovery UI when URL is blank (no crawl or BI)", async () => {
    const onEditWebsite = vi.fn();
    render(
      <AnalysisProgressScreen
        brandId="brand-1"
        answers={{ ...answers, websiteUrl: "   " }}
        onComplete={vi.fn()}
        onEditWebsite={onEditWebsite}
        quietGapMs={0}
      />,
    );

    expect(await screen.findByText(/Website needed/i)).toBeTruthy();
    expect(screen.getByTestId("analysis-status").textContent).toMatch(/website url/i);
    expect(mockKickoff).not.toHaveBeenCalled();
    expect(mockStartBi).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /Add website/i }));
    expect(onEditWebsite).toHaveBeenCalledTimes(1);
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

  it("does not offer Retry when server intake_status is failed", async () => {
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
    expect(screen.getByTestId("analysis-status").textContent).toMatch(/Brand Hub/i);
    expect(screen.queryByRole("button", { name: /Retry/i })).toBeNull();
  });
});
