// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnalysisProgressBanner } from "./AnalysisProgressBanner";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

// Mock Supabase browser client
const mockRemoveChannel = vi.fn();
const mockSubscribe = vi.fn().mockReturnValue({ unsubscribe: vi.fn() });
const mockOn = vi.fn();
const mockChannel = {
  on: (...args: unknown[]) => { mockOn(...args); return mockChannel; },
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

  it("shows scores_complete message", () => {
    render(<AnalysisProgressBanner brandId={brandId} initialStatus="scores_complete" />);
    expect(screen.getByText(/Scores ready/)).toBeTruthy();
  });

  it("subscribes to realtime on mount", () => {
    render(<AnalysisProgressBanner brandId={brandId} initialStatus="crawl_running" />);
    expect(mockSubscribe).toHaveBeenCalled();
  });
});
