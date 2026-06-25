import { describe, it, expect } from "vitest";
import sample from "./fixtures/firecrawl-sample-raw_data.json";

describe("firecrawl sample fixture (IPI-25)", () => {
  it("has pages with markdown for crawl-aware prompts", () => {
    expect(Array.isArray(sample.pages)).toBe(true);
    expect(sample.pages.length).toBeGreaterThanOrEqual(2);
    expect(sample.pages[0]?.markdown).toContain("Everlane");
    expect(sample.pages[0]?.metadata?.url).toMatch(/^https:\/\//);
  });
});
