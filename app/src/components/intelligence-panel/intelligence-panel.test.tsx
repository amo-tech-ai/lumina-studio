/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { IntelligencePanel } from "./intelligence-panel";
import { DEV_INTELLIGENCE_PANEL_DATA } from "@/lib/intelligence/dev-panel-fixture";

vi.mock("./intelligence-panel.module.css", () => ({
  default: new Proxy({}, { get: (_t, key) => String(key) }),
}));

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
  toast: { success: vi.fn(), message: vi.fn() },
}));

vi.mock("@/lib/intelligence/use-intelligence-panel", () => ({
  useIntelligencePanel: vi.fn(),
}));

vi.mock("./evidence-dialog", () => ({
  EvidenceDialog: ({ triggerLabel }: { triggerLabel: string }) => (
    <button type="button">{triggerLabel}</button>
  ),
}));

const { useIntelligencePanel } = await import("@/lib/intelligence/use-intelligence-panel");

const BRAND_ID = "11111111-1111-1111-1111-111111111111";

afterEach(() => {
  cleanup();
});

describe("IntelligencePanel", () => {
  it("renders six overview sections from fixture-shaped API data", () => {
    vi.mocked(useIntelligencePanel).mockReturnValue({
      data: DEV_INTELLIGENCE_PANEL_DATA,
      loading: false,
      error: null,
      reload: vi.fn(),
    });

    render(
      <IntelligencePanel
        pathname="/app"
        activeBrandId={BRAND_ID}
        brandName="Nike"
      />,
    );

    expect(useIntelligencePanel).toHaveBeenCalledWith(BRAND_ID);
    expect(screen.getByText("Nike")).toBeTruthy();
    expect(screen.getByText("active")).toBeTruthy();
    expect(screen.getByText(/DNA 87/)).toBeTruthy();
    expect(screen.getByLabelText("Brand health scores")).toBeTruthy();
    expect(screen.getByLabelText("AI insights")).toBeTruthy();
    expect(screen.getByLabelText("Approval queue")).toBeTruthy();
    expect(screen.getByLabelText("Recommended actions")).toBeTruthy();
    expect(screen.getByLabelText("Recent activity")).toBeTruthy();
    expect(screen.getByText("Brand profile draft")).toBeTruthy();
    expect(screen.getByText("Review approvals")).toBeTruthy();
    expect(screen.getByText("Yesterday")).toBeTruthy();
  });

  it("switches tabs and shows approvals badge count", () => {
    vi.mocked(useIntelligencePanel).mockReturnValue({
      data: DEV_INTELLIGENCE_PANEL_DATA,
      loading: false,
      error: null,
      reload: vi.fn(),
    });

    render(
      <IntelligencePanel pathname="/app" activeBrandId={BRAND_ID} brandName="Nike" />,
    );

    const approvalsTab = screen.getByRole("tab", { name: /Approvals/i });
    expect(approvalsTab.getAttribute("aria-selected")).toBe("false");
    expect(approvalsTab.textContent).toContain("3");

    fireEvent.click(screen.getByRole("tab", { name: /Activity/i }));
    expect(screen.getByRole("tab", { name: /Activity/i }).getAttribute("aria-selected")).toBe(
      "true",
    );
    expect(screen.getByLabelText("Recent activity")).toBeTruthy();
  });

  it("renders Explain DNA when fixture provides dnaEvidence", () => {
    vi.mocked(useIntelligencePanel).mockReturnValue({
      data: DEV_INTELLIGENCE_PANEL_DATA,
      loading: false,
      error: null,
      reload: vi.fn(),
    });

    render(
      <IntelligencePanel pathname="/app" activeBrandId={BRAND_ID} brandName="Nike" />,
    );

    expect(screen.getByRole("button", { name: "Explain DNA" })).toBeTruthy();
  });

  it("renders pending approval drafts from live API shape", () => {
    vi.mocked(useIntelligencePanel).mockReturnValue({
      data: {
        brand: null,
        scores: null,
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

    render(
      <IntelligencePanel pathname="/app/portfolio" activeBrandId={null} brandName={null} />,
    );

    expect(screen.getByText(/Beta Brand/i)).toBeTruthy();
  });

  it("shows loading copy while fetching", () => {
    vi.mocked(useIntelligencePanel).mockReturnValue({
      data: null,
      loading: true,
      error: null,
      reload: vi.fn(),
    });

    render(
      <IntelligencePanel pathname="/app/brand" activeBrandId={BRAND_ID} brandName="Acme" />,
    );

    expect(screen.getByText(/Loading intelligence/i)).toBeTruthy();
  });
});
