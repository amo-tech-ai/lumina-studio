import { describe, expect, it } from "vitest";
import {
  formatCrawlProgressLabel,
  formatCrawlProgressShort,
} from "./format-crawl-progress";

describe("formatCrawlProgress", () => {
  it("shows denominator when pages_found is positive", () => {
    expect(formatCrawlProgressLabel(50, 100)).toBe("50 of 100 pages crawled");
    expect(formatCrawlProgressShort(50, 100)).toBe("50 / 100 pages");
  });

  it("omits misleading denominator when pages_found is zero or null", () => {
    expect(formatCrawlProgressLabel(50, 0)).toBe("50 pages crawled");
    expect(formatCrawlProgressLabel(50, null)).toBe("50 pages crawled");
    expect(formatCrawlProgressShort(50, 0)).toBe("50 pages");
  });
});
