// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { AnalysisProgressBanner } from "./analysis-progress-banner";

const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

type RealtimeCallback = (payload: { new: Record<string, unknown> | null }) => void;
type StatusCallback = (status: string) => void;
const capturedCallbacks: RealtimeCallback[] = [];
let statusCallback: StatusCallback | null = null;

const mockRemoveChannel = vi.fn();
const mockSubscribe = vi.fn((cb?: StatusCallback) => {
  statusCallback = cb ?? null;
  return { unsubscribe: vi.fn() };
});
const mockChannel = {
  on: (_event: string, _filter: unknown, cb: RealtimeCallback) => {
    capturedCallbacks.push(cb);
    return mockChannel;
  },
  subscribe: mockSubscribe,
};
vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({
    channel: () => mockChannel,
    removeChannel: mockRemoveChannel,
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  capturedCallbacks.length = 0;
  statusCallback = null;
});

afterEach(() => {
  cleanup();
});

describe("AnalysisProgressBanner", () => {
  // quietGapMs: 0 — no still-working timers holding the vitest worker open
  const props = { brandId: "test-brand-id", quietGapMs: 0 };

  it("returns null for ready status", () => {
    const { container } = render(
      <AnalysisProgressBanner {...props} initialStatus="ready" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("returns null for draft_ready status", () => {
    const { container } = render(
      <AnalysisProgressBanner {...props} initialStatus="draft_ready" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows spinner and message for brand_created", () => {
    render(<AnalysisProgressBanner {...props} initialStatus="brand_created" />);
    expect(screen.getByText(/Brand created/)).toBeTruthy();
    expect(screen.getByRole("status")).toBeTruthy();
  });

  it("shows crawling message for crawl_running", () => {
    render(<AnalysisProgressBanner {...props} initialStatus="crawl_running" />);
    expect(screen.getByText(/Crawling website/)).toBeTruthy();
  });

  it("shows page counts when crawl_running with pages", () => {
    render(
      <AnalysisProgressBanner
        {...props}
        initialStatus="crawl_running"
        initialCrawlPages={{ pages_crawled: 5, pages_found: 20 }}
      />,
    );
    expect(screen.getByText(/5 \/ 20 pages/)).toBeTruthy();
  });

  it("shows analysis message for analysis_running", () => {
    render(<AnalysisProgressBanner {...props} initialStatus="analysis_running" />);
    expect(screen.getByText(/Gemini is analysing/)).toBeTruthy();
  });

  it("shows crawl_complete message", () => {
    render(<AnalysisProgressBanner {...props} initialStatus="crawl_complete" />);
    expect(screen.getByText(/Crawl complete/)).toBeTruthy();
  });

  it("keeps scores_complete visible (not terminal success)", () => {
    render(<AnalysisProgressBanner {...props} initialStatus="scores_complete" />);
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByText(/Scores ready/)).toBeTruthy();
  });

  it("shows error alert for failed status", () => {
    render(<AnalysisProgressBanner {...props} initialStatus="failed" />);
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText("Analysis failed")).toBeTruthy();
    expect(screen.getByText(/If this persists/)).toBeTruthy();
  });

  it("subscribes to realtime on mount", () => {
    render(<AnalysisProgressBanner {...props} initialStatus="crawl_running" />);
    expect(mockSubscribe).toHaveBeenCalled();
  });

  it("shows errorMessage in failed state", () => {
    render(
      <AnalysisProgressBanner
        {...props}
        initialStatus="failed"
        errorMessage="Gemini timeout — API quota exceeded"
      />,
    );
    expect(screen.getByText("Gemini timeout — API quota exceeded")).toBeTruthy();
  });

  it("falls back to default failure text when errorMessage is absent", () => {
    render(<AnalysisProgressBanner {...props} initialStatus="failed" />);
    expect(screen.getByRole("alert").textContent).toContain(
      "If this persists, contact support",
    );
  });

  it("refreshes layout on scores_complete but keeps progress copy (not success)", () => {
    render(<AnalysisProgressBanner {...props} initialStatus="crawl_running" />);
    expect(capturedCallbacks).toHaveLength(2);
    act(() => {
      capturedCallbacks[0]({ new: { intake_status: "scores_complete" } });
    });
    expect(mockRefresh).toHaveBeenCalled();
    expect(screen.getByText(/Scores ready/)).toBeTruthy();
  });

  it("calls router.refresh() when Realtime fires ready", () => {
    render(<AnalysisProgressBanner {...props} initialStatus="analysis_running" />);
    expect(capturedCallbacks).toHaveLength(2);
    act(() => {
      capturedCallbacks[0]({ new: { intake_status: "ready" } });
    });
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("updates crawl page counts when brand_crawls Realtime event fires", () => {
    render(
      <AnalysisProgressBanner
        {...props}
        initialStatus="crawl_running"
        initialCrawlPages={{ pages_crawled: 2, pages_found: 10 }}
      />,
    );
    expect(screen.getByText(/2 \/ 10 pages/)).toBeTruthy();
    expect(capturedCallbacks).toHaveLength(2);
    act(() => {
      capturedCallbacks[1]({ new: { pages_crawled: 7, pages_found: 10 } });
    });
    expect(screen.getByText(/7 \/ 10 pages/)).toBeTruthy();
  });

  it("shows connection-lost UI on CHANNEL_ERROR (not failed)", () => {
    render(<AnalysisProgressBanner {...props} initialStatus="analysis_running" />);
    expect(statusCallback).toBeTruthy();
    act(() => {
      statusCallback!("CHANNEL_ERROR");
    });
    expect(screen.getByText(/Connection lost/)).toBeTruthy();
    expect(screen.queryByText("Analysis failed")).toBeNull();
    expect(screen.getByRole("button", { name: /Reconnect/i })).toBeTruthy();
  });

  it("shows connection-lost UI on CLOSED", () => {
    render(<AnalysisProgressBanner {...props} initialStatus="crawl_running" />);
    act(() => {
      statusCallback!("CLOSED");
    });
    expect(screen.getByText(/Connection lost/)).toBeTruthy();
  });

  // IPI-918 — recovery control is owner/editor only.
  it("offers Restart analysis on failed when the operator may restart", () => {
    render(
      <AnalysisProgressBanner {...props} initialStatus="failed" canRestart />,
    );
    expect(screen.getByRole("button", { name: /Restart analysis/i })).toBeTruthy();
    expect(screen.getByText(/don't need to redo onboarding/i)).toBeTruthy();
  });

  it("hides Restart analysis from viewers on failed", () => {
    render(<AnalysisProgressBanner {...props} initialStatus="failed" />);
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Restart analysis/i })).toBeNull();
  });

  it("does not offer Restart analysis while analysis is still running", () => {
    render(
      <AnalysisProgressBanner {...props} initialStatus="analysis_running" canRestart />,
    );
    expect(screen.queryByRole("button", { name: /Restart analysis/i })).toBeNull();
  });
});
