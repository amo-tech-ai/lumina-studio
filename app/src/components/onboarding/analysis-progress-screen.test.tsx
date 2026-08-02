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

  it("does not treat connection_lost as failed", () => {
    mockProgress = {
      ...mockProgress,
      phase: "connection_lost",
      intakeStatus: "crawl_running",
    };
    render(
      <AnalysisProgressScreen
        brandId="brand-1"
        answers={answers}
        onComplete={vi.fn()}
        quietGapMs={0}
      />,
    );
    expect(screen.getByRole("heading", { name: /connection lost/i })).toBeTruthy();
    expect(screen.getByTestId("analysis-status").textContent).toMatch(/not failed/i);
    fireEvent.click(screen.getByRole("button", { name: /reconnect/i }));
    expect(mockReconnect).toHaveBeenCalled();
  });

  it("shows failed only for server failed phase", () => {
    mockProgress = {
      ...mockProgress,
      phase: "failed",
      intakeStatus: "failed",
      crawl: null,
    };
    render(
      <AnalysisProgressScreen
        brandId="brand-1"
        answers={answers}
        onComplete={vi.fn()}
        quietGapMs={0}
      />,
    );
    expect(screen.getByRole("heading", { name: /analysis failed/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /reconnect/i })).toBeNull();
  });

  it("calls onComplete when intake becomes scores_complete (no client timer)", async () => {
    const onComplete = vi.fn();
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

  it("starts BI once when crawl_complete arrives after deferred kickoff", async () => {
    mockKickoff.mockResolvedValue({
      kind: "crawl_started",
      crawlId: "crawl-deferred",
      reused: false,
      startBiNow: false,
    });
    mockProgress = {
      intakeStatus: "crawl_running",
      crawl: { pages_crawled: 1, pages_found: 5 },
      phase: "live",
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

    await act(async () => {
      await Promise.resolve();
    });
    expect(mockStartBi).not.toHaveBeenCalled();

    mockProgress = {
      intakeStatus: "crawl_complete",
      crawl: null,
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

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mockStartBi).toHaveBeenCalledTimes(1);
    expect(mockStartBi.mock.calls[0][3]).toEqual({ crawlResultId: "crawl-deferred" });
  });

  it("skips crawl and starts BI when website URL is blank", async () => {
    render(
      <AnalysisProgressScreen
        brandId="brand-1"
        answers={{ ...answers, websiteUrl: "   " }}
        onComplete={vi.fn()}
        quietGapMs={0}
      />,
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mockKickoff).not.toHaveBeenCalled();
    expect(mockStartBi).toHaveBeenCalledTimes(1);
  });
});
