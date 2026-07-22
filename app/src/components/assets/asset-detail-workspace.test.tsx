// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("./asset-detail-workspace.module.css", () => ({
  default: new Proxy({}, { get: (_, k) => String(k) }),
}));
vi.mock("../ui/status-chip.module.css", () => ({
  default: new Proxy({}, { get: (_, k) => String(k) }),
}));
vi.mock("../ui/error-state.module.css", () => ({
  default: new Proxy({}, { get: (_, k) => String(k) }),
}));
vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string }) => <img alt={props.alt} src={props.src} />,
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

import { AssetDetailWorkspace } from "./asset-detail-workspace";
import type { AssetDetail } from "@/lib/assets/get-assets";

afterEach(cleanup);

function detail(overrides: Partial<AssetDetail> = {}): AssetDetail {
  return {
    id: "a1",
    brand_id: "b1",
    brand: { name: "Acme" },
    asset_type: "image",
    url: "https://example.com/x.jpg",
    thumbnail_url: null,
    cloudinary_public_id: "brand/look-01",
    displayUrl:
      "https://res.cloudinary.com/dzqy2ixl0/image/authenticated/s--abc--/c_limit,w_1600,f_auto,q_auto/brand/look-01",
    status: "ready",
    dna_score: 88,
    dna_pillars: {},
    dna_status: "approved",
    tags: ["runway"],
    width: 10,
    height: 10,
    mime_type: "image/png",
    file_size: 70,
    shoot_id: "shoot-1",
    created_at: "2026-07-01T00:00:00.000Z",
    updated_at: "2026-07-01T00:00:00.000Z",
    amazon_exported: null,
    facebook_published: null,
    instagram_published: null,
    shopify_exported: null,
    media_size_spec_id: null,
    size_compliance: null,
    metadata: null,
    mirror: {
      public_id: "brand/look-01",
      cloudinary_asset_id: null,
      version: null,
      delivery_type: "authenticated",
      width: 1,
      height: 1,
      bytes: 70,
      format: "png",
      resource_type: "image",
      folder: "brand",
    },
    whereUsed: [
      { kind: "shoot", id: "shoot-1", label: "Shoot · shoot-1", href: "/app/shoots/shoot-1" },
    ],
    consoleUrl: "https://console.cloudinary.com/example",
    ...overrides,
  };
}

describe("AssetDetailWorkspace", () => {
  it("renders Identity / Metadata / Tags / Where Used / Actions sections", () => {
    render(<AssetDetailWorkspace data={detail()} fetchError={null} />);
    expect(screen.getByTestId("asset-detail")).toBeDefined();
    expect(screen.getByText("Identity")).toBeDefined();
    expect(screen.getByText("Metadata")).toBeDefined();
    expect(screen.getByText("Tags")).toBeDefined();
    expect(screen.getByText("Where Used")).toBeDefined();
    expect(screen.getByText("Actions")).toBeDefined();
    expect(screen.getByText("runway")).toBeDefined();
    expect(screen.getByText("authenticated")).toBeDefined();
    expect(screen.getByRole("link", { name: "Shoot · shoot-1" }).getAttribute("href")).toBe(
      "/app/shoots/shoot-1",
    );
  });

  it("omits null cloudinary_asset_id and version instead of inventing values", () => {
    render(<AssetDetailWorkspace data={detail()} fetchError={null} />);
    expect(screen.queryByText("cloudinary_asset_id")).toBeNull();
    expect(screen.queryByText("version")).toBeNull();
    expect(screen.getByText("public_id")).toBeDefined();
  });

  it("still renders when there is no Cloudinary mirror", () => {
    render(
      <AssetDetailWorkspace
        data={detail({
          mirror: null,
          cloudinary_public_id: null,
          consoleUrl: null,
          displayUrl: null,
          tags: null,
          whereUsed: [],
        })}
        fetchError={null}
      />,
    );
    expect(screen.getByText("Metadata")).toBeDefined();
    expect(screen.queryByText("Identity")).toBeNull();
    expect(screen.getByText("No tags.")).toBeDefined();
    expect(screen.getByText("Not linked to a shoot, event, or product yet.")).toBeDefined();
  });

  it("shows an error state when fetchError is set", () => {
    render(<AssetDetailWorkspace data={null} fetchError="Sign in to view this asset." />);
    expect(screen.getByText("Couldn't load asset")).toBeDefined();
    expect(screen.getByText("Sign in to view this asset.")).toBeDefined();
  });
});
