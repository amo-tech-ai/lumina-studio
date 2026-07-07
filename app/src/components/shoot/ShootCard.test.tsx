// @vitest-environment jsdom
import { describe, expect, it, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

vi.mock("./shoots-list.module.css", () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
// Capture the resolved image src so we can assert cover-vs-fallback.
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} data-testid="cover-img" />
  ),
}));

import { ShootCard, type ShootRow } from "./ShootCard";
import { shootListCoverForShoot } from "@/lib/command-center/sample-images";

const BASE: ShootRow = {
  id: "shoot-1",
  name: "Spring Campaign",
  type: "Lookbook",
  status: "active",
  dna_score: 87,
  target_channels: ["instagram"],
  estimated_budget: 12000,
  updated_at: "2026-05-01T00:00:00.000Z",
  cover_url: null,
};

const coverImg = () => screen.getByTestId("cover-img");
const coverSrc = () => coverImg().getAttribute("src");
// Cover is decorative (shoot name + details live in the card body / sr-only text),
// so alt is intentionally empty on both the real-cover and fallback paths.
const coverAlt = () => coverImg().getAttribute("alt");

afterEach(() => cleanup());

describe("ShootCard cover rendering", () => {
  it("renders the real cover_url when it is a deliverable Cloudinary URL", () => {
    const cover =
      "https://res.cloudinary.com/dzqy2ixl0/image/upload/c_fill,w_640,h_480/5-fashionos_wc2p1c";
    render(<ShootCard shoot={{ ...BASE, cover_url: cover }} />);
    expect(coverSrc()).toBe(cover);
    expect(coverAlt()).toBe("");
  });

  it("renders the decorative fallback when cover_url is null", () => {
    render(<ShootCard shoot={{ ...BASE, cover_url: null }} />);
    expect(coverSrc()).toBe(shootListCoverForShoot(BASE.id));
    expect(coverAlt()).toBe("");
  });

  it("renders the fallback (not a broken image) when cover_url is an off-cloud host", () => {
    render(<ShootCard shoot={{ ...BASE, cover_url: "https://evil.example.com/x.jpg" }} />);
    expect(coverSrc()).toBe(shootListCoverForShoot(BASE.id));
  });

  it("renders the fallback when cover_url is an empty string (falsy/invalid guard)", () => {
    render(<ShootCard shoot={{ ...BASE, cover_url: "" }} />);
    expect(coverSrc()).toBe(shootListCoverForShoot(BASE.id));
  });
});
