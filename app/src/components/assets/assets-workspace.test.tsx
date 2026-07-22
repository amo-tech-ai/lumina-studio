// @vitest-environment jsdom
import { describe, expect, it, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

vi.mock("./assets-workspace.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/status-chip.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/empty-state.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/error-state.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("next/image", () => ({ default: (props: { alt: string }) => <img alt={props.alt} /> }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const refresh = vi.fn();
const push = vi.fn();
vi.mock("next-cloudinary", () => ({
  CldUploadWidget: ({ children }: { children: (args: { open: () => void }) => React.ReactNode }) =>
    children({ open: vi.fn() }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push }),
}));

import { AssetsWorkspace } from "./assets-workspace";
import type { AssetRow } from "@/lib/assets/get-assets";
import {
  parseAssetsLibraryParams,
  type AssetsLibraryFilters,
} from "@/lib/assets/list-assets-params";

afterEach(() => {
  cleanup();
  refresh.mockClear();
  push.mockClear();
});

function filters(overrides: Record<string, string | string[] | undefined> = {}): AssetsLibraryFilters {
  const parsed = parseAssetsLibraryParams(overrides);
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.data;
}

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

const defaultProps = {
  filters: filters(),
  nextCursor: null as string | null,
  brands: [] as { id: string; name: string }[],
};

describe("AssetsWorkspace", () => {
  it("shows a sign-in prompt when unauthenticated — no query attempted", () => {
    render(<AssetsWorkspace {...defaultProps} assets={[]} isAuthenticated={false} />);
    expect(screen.getByText(/Sign in to view your asset library/)).toBeDefined();
  });

  it("shows a retryable error state instead of the grid when the fetch failed", () => {
    render(
      <AssetsWorkspace {...defaultProps} assets={[]} isAuthenticated fetchError="Unable to load assets." />,
    );
    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.getByText("Unable to load assets.")).toBeDefined();
  });

  it("keeps the upload panel available when the asset list fetch failed", () => {
    render(
      <AssetsWorkspace
        {...defaultProps}
        assets={[]}
        brands={[{ id: "b1", name: "Acme" }]}
        isAuthenticated
        fetchError="Unable to load assets."
      />,
    );
    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.getByLabelText("Upload to brand")).toBeDefined();
  });

  it("retry re-runs the server fetch via router.refresh(), not a no-op link", () => {
    render(
      <AssetsWorkspace {...defaultProps} assets={[]} isAuthenticated fetchError="Unable to load assets." />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("navigates with a brand URL when the brand select changes (server-side filter)", () => {
    render(
      <AssetsWorkspace
        {...defaultProps}
        assets={[asset({ id: "a1", brand_id: "b1", brand: { name: "Acme" } })]}
        brands={[
          { id: "11111111-1111-4111-8111-111111111111", name: "Acme" },
          { id: "22222222-2222-4222-8222-222222222222", name: "Zeta" },
        ]}
        isAuthenticated
      />,
    );
    fireEvent.change(screen.getByTestId("assets-brand-filter"), {
      target: { value: "22222222-2222-4222-8222-222222222222" },
    });
    expect(push).toHaveBeenCalledWith(
      "/app/assets?brand=22222222-2222-4222-8222-222222222222",
    );
  });

  it("shows an honest empty state when there are no assets", () => {
    render(<AssetsWorkspace {...defaultProps} assets={[]} isAuthenticated />);
    expect(screen.getByText("No assets yet")).toBeDefined();
  });

  it("renders one card per asset with a real count", () => {
    render(
      <AssetsWorkspace
        {...defaultProps}
        assets={[asset({ id: "a1" }), asset({ id: "a2" })]}
        isAuthenticated
      />,
    );
    expect(screen.getByText("2 assets")).toBeDefined();
    expect(screen.getAllByTestId("asset-card")).toHaveLength(2);
  });

  it("shows the real avg DNA match in the header when at least one asset has a score", () => {
    render(
      <AssetsWorkspace
        {...defaultProps}
        assets={[asset({ id: "a1", dna_score: 80 }), asset({ id: "a2", dna_score: 60 })]}
        isAuthenticated
      />,
    );
    expect(screen.getByText("2 assets · avg DNA match 70%")).toBeDefined();
  });

  it("omits the avg DNA match segment entirely when no asset has a score — never shows a fake 0%", () => {
    render(
      <AssetsWorkspace {...defaultProps} assets={[asset({ id: "a1", dna_score: null })]} isAuthenticated />,
    );
    expect(screen.getByText("1 asset")).toBeDefined();
    expect(screen.queryByText(/avg DNA match/)).toBeNull();
  });

  it("sorts by real dna_score (desc, nulls last) when the DNA match sort is toggled on", () => {
    render(
      <AssetsWorkspace
        {...defaultProps}
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

  it("clearing filters also turns off the DNA match sort toggle and resets the URL", () => {
    render(
      <AssetsWorkspace
        {...defaultProps}
        assets={[asset({ id: "a1", asset_type: "image" }), asset({ id: "a2", asset_type: "video" })]}
        isAuthenticated
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "DNA match" }));
    fireEvent.click(screen.getByRole("button", { name: "Document" }));
    expect(screen.getByRole("button", { name: "DNA match" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByTestId("assets-no-match")).toBeDefined();

    fireEvent.click(screen.getAllByRole("button", { name: "Clear filters" })[0]);
    expect(screen.getByRole("button", { name: "DNA match" }).getAttribute("aria-pressed")).toBe("false");
    expect(push).toHaveBeenCalledWith("/app/assets");
  });

  it("filters the grid client-side by asset_type", () => {
    render(
      <AssetsWorkspace
        {...defaultProps}
        assets={[asset({ id: "a1", asset_type: "image" }), asset({ id: "a2", asset_type: "video" })]}
        isAuthenticated
      />,
    );
    expect(screen.getAllByTestId("asset-card")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Video" }));
    expect(screen.getAllByTestId("asset-card")).toHaveLength(1);
    // Subtitle must track the visible grid, not the full server page.
    expect(screen.getByText("1 asset")).toBeDefined();
    expect(screen.queryByText("2 assets")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "All" }));
    expect(screen.getAllByTestId("asset-card")).toHaveLength(2);
    expect(screen.getByText("2 assets")).toBeDefined();
  });

  it("does not seed upload with a URL brand id the caller cannot access", () => {
    render(
      <AssetsWorkspace
        {...defaultProps}
        filters={filters({ brand: "99999999-9999-4999-8999-999999999999" })}
        assets={[]}
        brands={[{ id: "11111111-1111-4111-8111-111111111111", name: "Acme" }]}
        isAuthenticated
        fetchError="Unable to load assets."
      />,
    );
    const select = screen.getByLabelText("Upload to brand") as HTMLSelectElement;
    expect(select.value).toBe("11111111-1111-4111-8111-111111111111");
  });

  it("shows a no-match state instead of a fake grid when a filter matches nothing, with a working clear button", () => {
    render(
      <AssetsWorkspace {...defaultProps} assets={[asset({ asset_type: "image" })]} isAuthenticated />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Video" }));
    expect(screen.getByTestId("assets-no-match")).toBeDefined();
    expect(screen.queryByTestId("assets-grid")).toBeNull();

    fireEvent.click(screen.getAllByRole("button", { name: "Clear filters" })[0]);
    expect(screen.getByTestId("assets-grid")).toBeDefined();
  });

  it("filters by real dna_score < 70 for the Low match chip — never a fabricated match tier", () => {
    render(
      <AssetsWorkspace
        {...defaultProps}
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

  it("shows the brand filter from brands prop even when the current page has no brand rows", () => {
    render(
      <AssetsWorkspace
        {...defaultProps}
        assets={[asset({ brand_id: null, brand: null })]}
        brands={[{ id: "11111111-1111-4111-8111-111111111111", name: "Acme" }]}
        isAuthenticated
      />,
    );
    expect(screen.getByTestId("assets-brand-filter")).toBeDefined();
  });

  it("honors server filters.brandId in the brand select (deep link)", () => {
    render(
      <AssetsWorkspace
        {...defaultProps}
        filters={filters({ brand: "22222222-2222-4222-8222-222222222222" })}
        assets={[asset({ id: "a2", brand_id: "22222222-2222-4222-8222-222222222222", brand: { name: "Zeta" } })]}
        brands={[
          { id: "11111111-1111-4111-8111-111111111111", name: "Acme" },
          { id: "22222222-2222-4222-8222-222222222222", name: "Zeta" },
        ]}
        isAuthenticated
      />,
    );
    expect(screen.getByTestId("assets-brand-filter")).toHaveProperty(
      "value",
      "22222222-2222-4222-8222-222222222222",
    );
  });

  it("submits search + tags into the shareable URL", () => {
    render(<AssetsWorkspace {...defaultProps} assets={[asset()]} isAuthenticated />);
    fireEvent.change(screen.getByTestId("assets-search-input"), { target: { value: "runway" } });
    fireEvent.change(screen.getByTestId("assets-tags-input"), { target: { value: "Editorial, Approved" } });
    fireEvent.submit(screen.getByRole("search"));
    expect(push).toHaveBeenCalledWith("/app/assets?q=runway&tags=editorial%2Capproved");
  });

  it("renders Next page when nextCursor is present", () => {
    render(
      <AssetsWorkspace
        {...defaultProps}
        assets={[asset()]}
        nextCursor="abc"
        isAuthenticated
      />,
    );
    expect(screen.getByRole("link", { name: "Next page" })).toHaveProperty(
      "href",
      expect.stringContaining("cursor=abc"),
    );
  });
});
