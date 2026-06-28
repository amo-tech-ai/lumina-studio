// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { AnalysisProgressBanner } from "./analysis-progress-banner";

const mockRefresh = vi.fn();

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

// Capture registered Realtime callbacks so tests can fire them
type RealtimeCallback = (payload: { new: Record<string, unknown> | null }) => void;
const capturedCallbacks: RealtimeCallback[] = [];

const mockRemoveChannel = vi.fn();
const mockSubscribe = vi.fn().mockReturnValue({ unsubscribe: vi.fn() });
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
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  capturedCallbacks.length = 0;
});

afterEach(() => {
  cleanup();
});

describe("AnalysisProgressBanner", () => {
  const brandId = "test-brand-id";

  it("returns null for ready status", () => {
    const { container } = render(
      <AnalysisProgressBanner brandId={brandId} initialStatus="ready" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("returns null for draft_ready status", () => {
    const { container } = render(
      <AnalysisProgressBanner brandId={brandId} initialStatus="draft_ready" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows spinner and message for brand_created", () => {
    render(<AnalysisProgressBanner brandId={brandId} initialStatus="brand_created" />);
    expect(screen.getByText(/Brand created/)).toBeTruthy();
    expect(screen.getByRole("status")).toBeTruthy();
  });

  it("shows crawling message for crawl_running", () => {
    render(<AnalysisProgressBanner brandId={brandId} initialStatus="crawl_running" />);
    expect(screen.getByText(/Crawling website/)).toBeTruthy();
  });

  it("shows page counts when crawl_running with pages", () => {
    render(
      <AnalysisProgressBanner
        brandId={brandId}
        initialStatus="crawl_running"
        initialCrawlPages={{ pages_crawled: 5, pages_found: 20 }}
      />,
    );
    expect(screen.getByText(/5 \/ 20 pages/)).toBeTruthy();
  });

  it("shows analysis message for analysis_running", () => {
    render(<AnalysisProgressBanner brandId={brandId} initialStatus="analysis_running" />);
    expect(screen.getByText(/Gemini is analysing/)).toBeTruthy();
  });

  it("shows crawl_complete message", () => {
    render(<AnalysisProgressBanner brandId={brandId} initialStatus="crawl_complete" />);
    expect(screen.getByText(/Crawl complete/)).toBeTruthy();
  });

  it("shows error alert for failed status", () => {
    render(<AnalysisProgressBanner brandId={brandId} initialStatus="failed" />);
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText("Analysis failed")).toBeTruthy();
    expect(screen.getByText(/Re-analyze/)).toBeTruthy();
  });

  it("hides banner when scores_complete (terminal state)", () => {
    const { container } = render(<AnalysisProgressBanner brandId={brandId} initialStatus="scores_complete" />);
    expect(container.firstChild).toBeNull();
  });

  it("subscribes to realtime on mount", () => {
    render(<AnalysisProgressBanner brandId={brandId} initialStatus="crawl_running" />);
    expect(mockSubscribe).toHaveBeenCalled();
  });

  it("shows errorMessage in failed state", () => {
    render(
      <AnalysisProgressBanner
        brandId={brandId}
        initialStatus="failed"
        errorMessage="Gemini timeout — API quota exceeded"
      />,
    );
    expect(screen.getByText("Gemini timeout — API quota exceeded")).toBeTruthy();
  });

  it("falls back to default retry text when errorMessage is absent", () => {
    render(<AnalysisProgressBanner brandId={brandId} initialStatus="failed" />);
    expect(screen.getByRole("alert").textContent).toContain("Use Re-analyze to retry");
  });


  it("calls router.refresh() when Realtime fires scores_complete", () => {
    render(<AnalysisProgressBanner brandId={brandId} initialStatus="crawl_running" />);
    // First callback is the brands UPDATE listener
    act(() => {
      capturedCallbacks[0]?.({ new: { intake_status: "scores_complete" } });
    });
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("calls router.refresh() when Realtime fires ready", () => {
    render(<AnalysisProgressBanner brandId={brandId} initialStatus="analysis_running" />);
    act(() => {
      capturedCallbacks[0]?.({ new: { intake_status: "ready" } });
    });
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("updates crawl page counts when brand_crawls Realtime event fires", () => {
    render(
      <AnalysisProgressBanner
        brandId={brandId}
        initialStatus="crawl_running"
        initialCrawlPages={{ pages_crawled: 2, pages_found: 10 }}
      />,
    );
    expect(screen.getByText(/2 \/ 10 pages/)).toBeTruthy();
    // Second callback is the brand_crawls listener
    act(() => {
      capturedCallbacks[1]?.({ new: { pages_crawled: 7, pages_found: 10 } });
    });
    expect(screen.getByText(/7 \/ 10 pages/)).toBeTruthy();
  });
});
