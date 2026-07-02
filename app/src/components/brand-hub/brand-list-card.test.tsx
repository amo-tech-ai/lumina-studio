// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

vi.mock("./brand-list.module.css", () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock("next/image", () => ({
  default: () => null,
}));

import { BrandListCard } from "./brand-list-card";

afterEach(() => cleanup());

describe("BrandListCard", () => {
  it("renders has-data card with DNA and pillar labels", () => {
    render(
      <BrandListCard
        id="aaa-bbb"
        name="Maaji"
        brandUrl="https://maaji.co"
        intakeStatus="ready"
        dnaScore={91.25}
        pillars={[
          { score_type: "visual", score: 88 },
          { score_type: "audience", score: 72 },
          { score_type: "consistency", score: 94 },
          { score_type: "commerce_readiness", score: 79 },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Maaji" })).toBeTruthy();
    expect(screen.getByText("91.25")).toBeTruthy();
    expect(screen.getByText("Visual")).toBeTruthy();
    expect(screen.getByText("Commerce Readiness")).toBeTruthy();
    expect(screen.getByRole("link", { name: "View" })).toBeTruthy();
  });

  it("renders no-DNA state with analyse CTA", () => {
    render(
      <BrandListCard
        id="ccc-ddd"
        name="Zara"
        brandUrl={null}
        intakeStatus="brand_created"
        dnaScore={0}
        pillars={[]}
      />,
    );

    expect(screen.getByText(/No DNA profile yet/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Analyse brand" })).toBeTruthy();
  });

  it("renders analysing state with crawl copy and actions", () => {
    render(
      <BrandListCard
        id="eee-fff"
        name="Nike"
        brandUrl="https://nike.com"
        intakeStatus="crawl_running"
        dnaScore={0}
        pillars={[]}
      />,
    );

    expect(screen.getByText(/Crawling nike\.com/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: "View" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Analyse" })).toBeTruthy();
  });
});
