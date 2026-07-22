// @vitest-environment jsdom
import { describe, expect, it, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

vi.mock("./assets-workspace.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/status-chip.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string }) => <img alt={props.alt} src={props.src} />,
}));

import { AssetCard } from "./asset-card";
import type { AssetRow } from "@/lib/assets/get-assets";

afterEach(cleanup);

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

describe("AssetCard", () => {
  it("renders the real asset type and date — never a fabricated name", () => {
    render(<AssetCard asset={asset()} />);
    expect(screen.getByTestId("asset-card").getAttribute("data-asset-id")).toBe("a1");
    expect(screen.getByText("Image")).toBeDefined();
    expect(screen.getByText("Apr 10")).toBeDefined();
  });

  it("shows no DNA score when dna_score is null", () => {
    render(<AssetCard asset={asset({ dna_score: null })} />);
    expect(screen.queryByText(/%/)).toBeNull();
  });

  it("shows the real DNA score when present", () => {
    render(<AssetCard asset={asset({ dna_score: 92 })} />);
    expect(screen.getByText("92%")).toBeDefined();
  });

  it("shows no DNA status badge when dna_status is null", () => {
    render(<AssetCard asset={asset({ dna_status: null })} />);
    expect(screen.queryByText("Approved")).toBeNull();
    expect(screen.queryByText("Review")).toBeNull();
    expect(screen.queryByText("Blocked")).toBeNull();
  });

  it("shows the real DNA status badge when present", () => {
    render(<AssetCard asset={asset({ dna_status: "approved" })} />);
    expect(screen.getByText("Approved")).toBeDefined();
  });

  it("renders the pre-resolved displayUrl as-is — get-assets.ts owns URL resolution (signed vs public), not this component", () => {
    const { container } = render(
      <AssetCard
        asset={asset({
          displayUrl: "https://res.cloudinary.com/dzqy2ixl0/image/authenticated/s--abc123--/c_limit,w_600,f_auto,q_auto/real-upload-01",
        })}
      />,
    );
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "https://res.cloudinary.com/dzqy2ixl0/image/authenticated/s--abc123--/c_limit,w_600,f_auto,q_auto/real-upload-01",
    );
  });

  it("swaps to the icon fallback when an authenticated thumb fails to load (IPI-757 A2)", () => {
    const { container } = render(
      <AssetCard
        asset={asset({
          displayUrl:
            "https://res.cloudinary.com/dzqy2ixl0/image/authenticated/s--abc123--/c_limit,w_600,f_auto,q_auto/missing-upload",
        })}
      />,
    );
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    fireEvent.error(img!);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector(".iconFallback")).not.toBeNull();
  });

  it("retries the thumb when displayUrl changes after a prior load failure (same asset.id)", () => {
    const broken =
      "https://res.cloudinary.com/dzqy2ixl0/image/authenticated/s--abc123--/c_limit,w_600,f_auto,q_auto/missing-upload";
    const recovered =
      "https://res.cloudinary.com/dzqy2ixl0/image/authenticated/s--abc123--/c_limit,w_600,f_auto,q_auto/recovered-upload";
    const { container, rerender } = render(<AssetCard asset={asset({ displayUrl: broken })} />);
    fireEvent.error(container.querySelector("img")!);
    expect(container.querySelector("img")).toBeNull();

    rerender(<AssetCard asset={asset({ displayUrl: recovered })} />);
    expect(container.querySelector("img")?.getAttribute("src")).toBe(recovered);
  });

  it("falls back to a file icon (never a broken <img>) when displayUrl is null", () => {
    const { container } = render(<AssetCard asset={asset({ displayUrl: null })} />);
    expect(container.querySelector("img")).toBeNull();
  });

  it("falls back to a file icon when displayUrl is an empty string (never src=\"\")", () => {
    const { container } = render(<AssetCard asset={asset({ displayUrl: "" })} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector(".iconFallback")).not.toBeNull();
  });

  it("renders a video icon fallback instead of an image for video assets", () => {
    const { container } = render(<AssetCard asset={asset({ asset_type: "video" })} />);
    expect(screen.getByText("Video")).toBeDefined();
    expect(container.querySelector("img")).toBeNull();
  });

  it("renders a document icon fallback instead of an image for document assets", () => {
    const { container } = render(<AssetCard asset={asset({ asset_type: "document" })} />);
    expect(screen.getByText("Document")).toBeDefined();
    expect(container.querySelector("img")).toBeNull();
  });
});
