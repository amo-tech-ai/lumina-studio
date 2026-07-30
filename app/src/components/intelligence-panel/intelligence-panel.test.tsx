/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { IntelligencePanel } from "./intelligence-panel";
import { IntelligenceDetailProvider } from "@/context/intelligence-detail-context";
import { DEV_INTELLIGENCE_PANEL_DATA, DEV_PORTFOLIO_PANEL_DATA } from "@/lib/intelligence/dev-panel-fixture";

vi.mock("./intelligence-panel.module.css", () => ({
  default: new Proxy({}, { get: (_t, key) => String(key) }),
}));

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/app"),
  useRouter: vi.fn(() => ({ refresh: vi.fn() })),
}));

const { usePathname } = await import("next/navigation");

vi.mock("next/image", () => ({
  default: ({ alt, ...props }: { alt: string }) => <img alt={alt} {...props} />,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: unknown;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), message: vi.fn(), error: vi.fn() },
}));

vi.mock("@/app/(operator)/app/brand/[id]/actions", () => ({
  applyDraft: vi.fn(),
  reanalyzeBrand: vi.fn(),
}));

vi.mock("@/lib/intelligence/use-intelligence-panel", () => ({
  useIntelligencePanel: vi.fn(),
}));

const { useIntelligencePanel } = await import("@/lib/intelligence/use-intelligence-panel");

const BRAND_ID = "11111111-1111-1111-1111-111111111111";

function renderPanel(ui: ReactElement) {
  return render(<IntelligenceDetailProvider>{ui}</IntelligenceDetailProvider>);
}

afterEach(() => {
  cleanup();
});

describe("IntelligencePanel", () => {
  it("renders DC overview sections from fixture-shaped API data", () => {
    vi.mocked(useIntelligencePanel).mockReturnValue({
      data: DEV_INTELLIGENCE_PANEL_DATA,
      loading: false,
      error: null,
      reload: vi.fn(),
    });

    renderPanel(<IntelligencePanel activeBrandId={BRAND_ID} brandName="Nike" />);

    expect(useIntelligencePanel).toHaveBeenCalledWith(BRAND_ID, "single");
    expect(screen.getByText("Nike")).toBeTruthy();
    expect(screen.getByText("active")).toBeTruthy();
    expect(screen.queryByText(/not production-wired/i)).toBeNull();
    expect(screen.getByLabelText("Brand health scores")).toBeTruthy();
    expect(screen.getByLabelText("Brand health scores").textContent).toContain("87");
    expect(screen.getByLabelText("Approval queue")).toBeTruthy();
    expect(screen.getByText("Brand profile draft")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Approve" }).length).toBeGreaterThan(0);
    expect(screen.queryByLabelText("AI insights")).toBeNull();
  });

  it("switches tabs and shows approvals badge count", () => {
    vi.mocked(useIntelligencePanel).mockReturnValue({
      data: DEV_INTELLIGENCE_PANEL_DATA,
      loading: false,
      error: null,
      reload: vi.fn(),
    });

    renderPanel(<IntelligencePanel activeBrandId={BRAND_ID} brandName="Nike" />);

    const approvalsTab = screen.getByRole("tab", { name: /Approvals/i });
    expect(approvalsTab.getAttribute("aria-selected")).toBe("false");
    expect(approvalsTab.textContent).toContain("3");
  });

  it("tab badge uses pendingCount when it exceeds loaded items", () => {
    vi.mocked(useIntelligencePanel).mockReturnValue({
      data: {
        ...DEV_INTELLIGENCE_PANEL_DATA,
        approvals: {
          pendingCount: 7,
          items: DEV_INTELLIGENCE_PANEL_DATA.approvals.items.slice(0, 2),
        },
      },
      loading: false,
      error: null,
      reload: vi.fn(),
    });

    renderPanel(<IntelligencePanel activeBrandId={BRAND_ID} brandName="Nike" />);

    expect(screen.getByRole("tab", { name: /Approvals/i }).textContent).toContain("7");
  });

  it("switches to activity tab", () => {
    vi.mocked(useIntelligencePanel).mockReturnValue({
      data: DEV_INTELLIGENCE_PANEL_DATA,
      loading: false,
      error: null,
      reload: vi.fn(),
    });

    renderPanel(<IntelligencePanel activeBrandId={BRAND_ID} brandName="Nike" />);

    fireEvent.click(screen.getByRole("tab", { name: /Activity/i }));
    expect(screen.getByRole("tab", { name: /Activity/i }).getAttribute("aria-selected")).toBe(
      "true",
    );
    expect(screen.getByLabelText("Recent activity")).toBeTruthy();
  });

  it("renders enriched approval cards from live API shape on command center", () => {
    vi.mocked(useIntelligencePanel).mockReturnValue({
      data: {
        brand: {
          id: "22222222-2222-2222-2222-222222222222",
          name: "Beta Brand",
          status: "draft_ready",
        },
        scores: {
          dna: 82,
          pillars: { visual: 70, audience: 85, consistency: 88, commerce_readiness: 75 },
        },
        approvals: {
          pendingCount: 1,
          items: [
            {
              id: "22222222-2222-2222-2222-222222222222",
              kind: "brand_draft",
              label: "Beta Brand — draft ready",
              href: "/app/brand/22222222-2222-2222-2222-222222222222",
            },
          ],
        },
      },
      loading: false,
      error: null,
      reload: vi.fn(),
    });

    renderPanel(
      <IntelligencePanel
        activeBrandId="22222222-2222-2222-2222-222222222222"
        brandName="Beta Brand"
      />,
    );

    expect(screen.getAllByText(/Beta Brand/i).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Approve" }).length).toBeGreaterThan(0);
    expect(screen.queryByText(/No pending brand drafts/i)).toBeNull();
  });

  it("shows select-brand copy when no brand is selected and panel data is null", () => {
    vi.mocked(useIntelligencePanel).mockReturnValue({
      data: null,
      loading: false,
      error: null,
      reload: vi.fn(),
    });

    renderPanel(<IntelligencePanel activeBrandId={null} brandName={null} />);

    expect(screen.getByText(/Select a brand to view intelligence/i)).toBeTruthy();
  });

  it("shows loading copy while fetching", () => {
    vi.mocked(useIntelligencePanel).mockReturnValue({
      data: null,
      loading: true,
      error: null,
      reload: vi.fn(),
    });

    renderPanel(<IntelligencePanel activeBrandId={BRAND_ID} brandName="Acme" />);

    expect(screen.getByText(/Loading intelligence/i)).toBeTruthy();
  });

  it("shows brand detail no-DNA block when scores are missing", () => {
    vi.mocked(usePathname).mockReturnValue(`/app/brand/${BRAND_ID}`);
    vi.mocked(useIntelligencePanel).mockReturnValue({
      data: {
        brand: { id: BRAND_ID, name: "Acme Co", status: "analyzing" },
        scores: null,
        approvals: { pendingCount: 0, items: [] },
      },
      loading: false,
      error: null,
      reload: vi.fn(),
    });

    renderPanel(<IntelligencePanel activeBrandId={BRAND_ID} brandName="Acme Co" />);

    expect(screen.getByRole("button", { name: "Analyse brand" })).toBeTruthy();
    expect(screen.getByText(/Run Brand Intelligence to build Acme Co/i)).toBeTruthy();
    expect(screen.queryByLabelText("Brand health scores")).toBeNull();
  });

  it("does not show fake DNA scores on command center when brand is not analyzed", () => {
    vi.mocked(usePathname).mockReturnValue("/app");
    vi.mocked(useIntelligencePanel).mockReturnValue({
      data: {
        brand: { id: BRAND_ID, name: "New Brand", status: "brand_created" },
        scores: null,
        approvals: { pendingCount: 0, items: [] },
      },
      loading: false,
      error: null,
      reload: vi.fn(),
    });

    renderPanel(<IntelligencePanel activeBrandId={BRAND_ID} brandName="New Brand" />);

    expect(screen.queryByLabelText("Brand health scores")).toBeNull();
    expect(screen.queryByText("active")).toBeNull();
  });

  it("renders portfolio panel on brand list route", () => {
    vi.mocked(usePathname).mockReturnValue("/app/brand");
    vi.mocked(useIntelligencePanel).mockReturnValue({
      data: DEV_PORTFOLIO_PANEL_DATA,
      loading: false,
      error: null,
      reload: vi.fn(),
    });

    renderPanel(<IntelligencePanel activeBrandId={BRAND_ID} brandName="Nike" />);

    expect(useIntelligencePanel).toHaveBeenCalledWith(null, "portfolio");
    expect(screen.getByLabelText("Portfolio intelligence")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Portfolio" })).toBeTruthy();
    expect(screen.getByText("Avg DNA")).toBeTruthy();
    expect(screen.getByText("89")).toBeTruthy();
    expect(screen.getByText("Needs attention")).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Portfolio/i })).toBeTruthy();
    expect(screen.queryByText("active")).toBeNull();
  });

  it("renders the Campaign coming-soon placeholder instead of brand health content (IPI-286)", () => {
    vi.mocked(usePathname).mockReturnValue("/app/campaigns");
    vi.mocked(useIntelligencePanel).mockReturnValue({
      data: DEV_INTELLIGENCE_PANEL_DATA,
      loading: false,
      error: null,
      reload: vi.fn(),
    });

    renderPanel(<IntelligencePanel activeBrandId={BRAND_ID} brandName="Nike" />);

    expect(screen.getByText("Campaign health")).toBeTruthy();
    expect(screen.getByText("Deliverables")).toBeTruthy();
    expect(screen.getByText("Creative approvals")).toBeTruthy();
    expect(screen.getAllByTitle("Coming soon").length).toBe(3);
    // Regression guard: the same brand-shaped fixture that renders full
    // health/approvals content on Brand routes must not leak through here.
    expect(screen.queryByLabelText("Brand health scores")).toBeNull();
    expect(screen.queryByLabelText("Approval queue")).toBeNull();
  });

  it("updates from Brand to Campaign content on route change with no stale flash (IPI-286)", () => {
    vi.mocked(usePathname).mockReturnValue(`/app/brand/${BRAND_ID}`);
    vi.mocked(useIntelligencePanel).mockReturnValue({
      data: DEV_INTELLIGENCE_PANEL_DATA,
      loading: false,
      error: null,
      reload: vi.fn(),
    });

    const { rerender } = renderPanel(
      <IntelligencePanel activeBrandId={BRAND_ID} brandName="Nike" />,
    );

    expect(screen.getByLabelText("Brand health scores")).toBeTruthy();
    expect(screen.queryByText("Campaign health")).toBeNull();

    vi.mocked(usePathname).mockReturnValue("/app/campaigns");
    rerender(
      <IntelligenceDetailProvider>
        <IntelligencePanel activeBrandId={BRAND_ID} brandName="Nike" />
      </IntelligenceDetailProvider>,
    );

    // Direct derivation from pathname means the new route's sections render
    // immediately — no leftover Brand Hub content from the prior route.
    expect(screen.queryByLabelText("Brand health scores")).toBeNull();
    expect(screen.getByText("Campaign health")).toBeTruthy();
  });
});
