// @vitest-environment jsdom
import { describe, expect, it, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

vi.mock("../shoot-detail.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../../ui/empty-state.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("next/image", () => ({ default: (props: { alt: string }) => <img alt={props.alt} /> }));

import { AssetsTab } from "./assets-tab";
import type { ShootDetailAsset } from "@/lib/shoot/get-shoot-detail";

afterEach(() => cleanup());

function asset(overrides: Partial<ShootDetailAsset> = {}): ShootDetailAsset {
  return {
    id: "a1",
    url: "https://res.cloudinary.com/demo/image/upload/v1/shoot/a1.jpg",
    cloudinary_id: "shoot/a1",
    format: "jpg",
    resource_type: "image",
    width: 800,
    height: 600,
    dna_score: null,
    status: "approved",
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("AssetsTab", () => {
  it("shows a real EmptyState with zero assets", () => {
    render(<AssetsTab assets={[]} />);
    expect(screen.getByText("No captured assets yet")).toBeDefined();
  });

  it("renders an image for resource_type: image, regardless of extension-based format", () => {
    // alt="" is deliberate (decorative thumbnail) — that gives it an implicit
    // "presentation" role, not "img", so query the element directly.
    const { container } = render(<AssetsTab assets={[asset({ resource_type: "image", format: "webp" })]} />);
    expect(container.querySelector("img")).not.toBeNull();
  });

  it("renders the neutral video placeholder for resource_type: video — the real signal, not the format heuristic", () => {
    // A video whose format alone wouldn't have matched the old extension list
    // (e.g. an unusual container) — this only works via resource_type now.
    const { container } = render(
      <AssetsTab assets={[asset({ resource_type: "video", format: "unusual-container" })]} />,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("treats a null resource_type as non-video (image path), not a crash or a false video", () => {
    const { container } = render(<AssetsTab assets={[asset({ resource_type: null, format: "jpg" })]} />);
    expect(container.querySelector("img")).not.toBeNull();
  });

  it("renders one card per asset", () => {
    render(
      <AssetsTab
        assets={[asset({ id: "a1" }), asset({ id: "a2", resource_type: "video" }), asset({ id: "a3" })]}
      />,
    );
    expect(screen.getByText(/Captured assets/)).toBeDefined();
    expect(screen.getByText("· 3")).toBeDefined();
  });
});
