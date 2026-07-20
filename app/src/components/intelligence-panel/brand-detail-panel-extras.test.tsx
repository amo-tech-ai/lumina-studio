/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { BrandDetailNoDnaBlock, BrandDetailPanelExtras } from "./brand-detail-panel-extras";

vi.mock("./intelligence-panel.module.css", () => ({
  default: new Proxy({}, { get: (_t, key) => String(key) }),
}));

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

const mockReanalyzeBrand = vi.fn();
vi.mock("@/app/(operator)/app/brand/[id]/actions", () => ({
  reanalyzeBrand: (...args: unknown[]) => mockReanalyzeBrand(...args),
}));
const mockRouterRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRouterRefresh }),
}));
const mockToastError = vi.fn();
vi.mock("sonner", () => ({
  toast: { error: (...args: unknown[]) => mockToastError(...args) },
}));

afterEach(() => {
  cleanup();
  mockReanalyzeBrand.mockReset();
  mockRouterRefresh.mockReset();
  mockToastError.mockReset();
});

describe("BrandDetailPanelExtras", () => {
  it("renders visual identity without DNA history", () => {
    render(
      <BrandDetailPanelExtras
        extras={{
          profileSnippet: "Acme profile",
          dnaHistory: undefined,
          visualIdentity: {
            visualScore: 72,
            palette: ["#111111", "#E87C4D"],
            sampleUrls: ["https://example.com/a.jpg", "https://example.com/b.jpg"],
          },
          assetPreview: {
            count: 2,
            urls: ["https://example.com/a.jpg"],
            href: "/app/assets?brand=x",
          },
        }}
        onReviewApprovals={() => {}}
        pendingCount={0}
      />,
    );

    expect(screen.queryByText("DNA history")).toBeNull();
    expect(screen.getByText("Visual identity")).toBeTruthy();
    expect(screen.getByText("72")).toBeTruthy();
  });

  it("renders DNA history when API provides it", () => {
    render(
      <BrandDetailPanelExtras
        extras={{
          profileSnippet: "Acme profile",
          dnaHistory: [
            { date: "Jan 5", score: 80, note: "Baseline crawl", barHeight: "80%" },
          ],
          visualIdentity: null,
          assetPreview: null,
        }}
        onReviewApprovals={() => {}}
        pendingCount={0}
      />,
    );

    expect(screen.getByText("DNA history")).toBeTruthy();
    expect(screen.getByText("Baseline crawl")).toBeTruthy();
  });
});

// IPI-722 — this button previously had no onClick at all (a genuinely dead
// button, distinct from BrandDetailWorkspace's swallowed-error bug).
describe("BrandDetailNoDnaBlock", () => {
  it("calls reanalyzeBrand and refreshes on success", async () => {
    mockReanalyzeBrand.mockResolvedValue({ ok: true, hasDraft: true });

    render(<BrandDetailNoDnaBlock brandId="nike-id" brandName="Nike" />);
    fireEvent.click(screen.getByRole("button", { name: "Analyse brand" }));

    await waitFor(() => expect(mockReanalyzeBrand).toHaveBeenCalledWith("nike-id"));
    await waitFor(() => expect(mockRouterRefresh).toHaveBeenCalled());
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it("shows a toast error and does not refresh on failure", async () => {
    mockReanalyzeBrand.mockResolvedValue({
      ok: false,
      error: "Brand has no website URL to analyze",
    });

    render(<BrandDetailNoDnaBlock brandId="nike-id" brandName="Nike" />);
    fireEvent.click(screen.getByRole("button", { name: "Analyse brand" }));

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith("Brand has no website URL to analyze"));
    expect(mockRouterRefresh).not.toHaveBeenCalled();
  });

  it("disables the button when there is no active brand id", () => {
    render(<BrandDetailNoDnaBlock brandId={null} brandName="Nike" />);
    const button = screen.getByRole("button", { name: "Analyse brand" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});
