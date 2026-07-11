// @vitest-environment jsdom
import { describe, expect, it, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

vi.mock("./assets-workspace.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/status-chip.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/empty-state.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/error-state.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("next/image", () => ({ default: (props: { alt: string }) => <img alt={props.alt} /> }));

const { useSearchParamsMock } = vi.hoisted(() => ({
  useSearchParamsMock: vi.fn(() => new URLSearchParams("")),
}));
vi.mock("next/navigation", () => ({ useSearchParams: useSearchParamsMock }));

import { AssetsWorkspace } from "./assets-workspace";
import type { AssetRow } from "@/lib/assets/get-assets";

afterEach(() => {
  cleanup();
  useSearchParamsMock.mockReturnValue(new URLSearchParams(""));
});

function asset(overrides: Partial<AssetRow> = {}): AssetRow {
  return {
    id: "a1",
    brand_id: "b1",
    brand: { name: "Test Brand" },
    asset_type: "image",
    url: "https://res.cloudinary.com/dzqy2ixl0/image/upload/v1/a1.jpg",
    thumbnail_url: null,
    cloudinary_public_id: "a1",
    displayUrl: null,
    status: "ready",
    dna_score: null,
    dna_pillars: {},
    dna_status: null,
    tags: null,
    width: 800,
    height: 1000,
    mime_type: "image/jpeg",
    file_size: 12345,
    shoot_id: null,
    created_at: "2026-04-10T00:00:00.000Z",
    updated_at: "2026-04-10T00:00:00.000Z",
    amazon_exported: null,
    facebook_published: null,
    instagram_published: null,
    shopify_exported: null,
    media_size_spec_id: null,
    size_compliance: null,
    metadata: null,
    ...overrides,
  };
}

describe("AssetsWorkspace", () => {
  it("shows a sign-in prompt when unauthenticated — no query attempted", () => {
    render(<AssetsWorkspace assets={[]} isAuthenticated={false} />);
    expect(screen.getByText(/Sign in to view your asset library/)).toBeDefined();
  });

  it("shows a retryable error state instead of the grid when the fetch failed", () => {
    render(<AssetsWorkspace assets={[]} isAuthenticated fetchError="Unable to load assets." />);
    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.getByText("Unable to load assets.")).toBeDefined();
  });

  it("shows an honest empty state when there are no assets", () => {
    render(<AssetsWorkspace assets={[]} isAuthenticated />);
    expect(screen.getByText("No assets yet")).toBeDefined();
  });

  it("renders one card per asset with a real count", () => {
    render(<AssetsWorkspace assets={[asset({ id: "a1" }), asset({ id: "a2" })]} isAuthenticated />);
    expect(screen.getByText("2 assets")).toBeDefined();
    expect(screen.getAllByTestId("asset-card")).toHaveLength(2);
  });

  it("shows the real avg DNA match in the header when at least one asset has a score", () => {
    render(
      <AssetsWorkspace
        assets={[asset({ id: "a1", dna_score: 80 }), asset({ id: "a2", dna_score: 60 })]}
        isAuthenticated
      />,
    );
    expect(screen.getByText("2 assets · avg DNA match 70%")).toBeDefined();
  });

  it("omits the avg DNA match segment entirely when no asset has a score — never shows a fake 0%", () => {
    render(<AssetsWorkspace assets={[asset({ id: "a1", dna_score: null })]} isAuthenticated />);
    expect(screen.getByText("1 asset")).toBeDefined();
    expect(screen.queryByText(/avg DNA match/)).toBeNull();
  });

  it("sorts by real dna_score (desc, nulls last) when the DNA match sort is toggled on", () => {
    render(
      <AssetsWorkspace
        assets={[
          asset({ id: "a1", dna_score: 40 }),
          asset({ id: "a2", dna_score: 95 }),
          asset({ id: "a3", dna_score: null }),
        ]}
        isAuthenticated
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "DNA match" }));
    const cards = screen.getAllByTestId("asset-card");
    expect(cards[0].textContent).toContain("95%");
    expect(cards[1].textContent).toContain("40%");
  });

  it("clearing filters also turns off the DNA match sort toggle", () => {
    render(
      <AssetsWorkspace
        assets={[asset({ id: "a1", asset_type: "image" }), asset({ id: "a2", asset_type: "video" })]}
        isAuthenticated
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "DNA match" }));
    fireEvent.click(screen.getByRole("button", { name: "Document" }));
    expect(screen.getByRole("button", { name: "DNA match" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByTestId("assets-no-match")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByRole("button", { name: "DNA match" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("filters the grid client-side by asset_type", () => {
    render(
      <AssetsWorkspace
        assets={[asset({ id: "a1", asset_type: "image" }), asset({ id: "a2", asset_type: "video" })]}
        isAuthenticated
      />,
    );
    expect(screen.getAllByTestId("asset-card")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Video" }));
    expect(screen.getAllByTestId("asset-card")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "All" }));
    expect(screen.getAllByTestId("asset-card")).toHaveLength(2);
  });

  it("shows a no-match state instead of a fake grid when a filter matches nothing, with a working clear button", () => {
    render(<AssetsWorkspace assets={[asset({ asset_type: "image" })]} isAuthenticated />);
    fireEvent.click(screen.getByRole("button", { name: "Video" }));
    expect(screen.getByTestId("assets-no-match")).toBeDefined();
    expect(screen.queryByTestId("assets-grid")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByTestId("assets-grid")).toBeDefined();
  });

  it("filters by real dna_score < 70 for the Low match chip — never a fabricated match tier", () => {
    render(
      <AssetsWorkspace
        assets={[
          asset({ id: "a1", dna_score: 92 }),
          asset({ id: "a2", dna_score: 40 }),
          asset({ id: "a3", dna_score: null }),
        ]}
        isAuthenticated
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Low match" }));
    expect(screen.getAllByTestId("asset-card")).toHaveLength(1);
  });

  it("only renders the brand filter when a real brand is present on at least one asset", () => {
    render(<AssetsWorkspace assets={[asset({ brand_id: null, brand: null })]} isAuthenticated />);
    expect(screen.queryByText("Filter by brand")).toBeNull();
  });

  it("initializes the brand filter from a ?brand= deep link (Brand Detail / command-center quick action)", () => {
    useSearchParamsMock.mockReturnValue(new URLSearchParams("brand=b2"));
    render(
      <AssetsWorkspace
        assets={[
          asset({ id: "a1", brand_id: "b1", brand: { name: "Acme" } }),
          asset({ id: "a2", brand_id: "b2", brand: { name: "Zeta" } }),
        ]}
        isAuthenticated
      />,
    );
    expect(screen.getAllByTestId("asset-card")).toHaveLength(1);
    expect(screen.getByLabelText("Filter by brand")).toHaveProperty("value", "b2");
  });

  it("filters client-side by brand_id when brands are present", () => {
    render(
      <AssetsWorkspace
        assets={[
          asset({ id: "a1", brand_id: "b1", brand: { name: "Acme" } }),
          asset({ id: "a2", brand_id: "b2", brand: { name: "Zeta" } }),
        ]}
        isAuthenticated
      />,
    );
    fireEvent.change(screen.getByLabelText("Filter by brand"), { target: { value: "b2" } });
    expect(screen.getAllByTestId("asset-card")).toHaveLength(1);
  });
});
