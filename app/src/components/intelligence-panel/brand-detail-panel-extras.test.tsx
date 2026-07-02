/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { BrandDetailPanelExtras } from "./brand-detail-panel-extras";

vi.mock("./intelligence-panel.module.css", () => ({
  default: new Proxy({}, { get: (_t, key) => String(key) }),
}));

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

afterEach(() => cleanup());

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
