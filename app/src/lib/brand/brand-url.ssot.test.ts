import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { normalizeBrandUrl, sameBrandWebsite } from "./brand-url.ssot";
import { normalizeAnalysisUrl, pickBestCrawlForUrl } from "./restart-stage";

/**
 * IPI-920 · ONB2-INT-001g — proves the app and brand-intelligence recognise the
 * same website. The Edge copy is canonical; this file fails if the generated
 * mirror drifts or if the shared fixture matrix disagrees with the app runtime.
 * The same matrix is asserted on the Deno side in
 * supabase/functions/_shared/brand-url.test.ts.
 */
const edgeSharedDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../supabase/functions/_shared",
);

type Fixtures = {
  accepts: { raw: string; origin: string; why: string }[];
  rejects: { raw: string; why: string }[];
  sameWebsite: { a: string; b: string; same: boolean }[];
};

const fixtures = JSON.parse(
  readFileSync(join(edgeSharedDir, "brand-url.fixtures.json"), "utf8"),
) as Fixtures;

describe("brand URL identity SSOT", () => {
  it("app mirror is byte-identical to the canonical Edge module", () => {
    const canonical = readFileSync(join(edgeSharedDir, "brand-url.ts"), "utf8");
    const mirror = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "brand-url.ssot.ts"),
      "utf8",
    );
    expect(mirror).toBe(canonical);
  });

  it("restart identity is the shared rule, not a second implementation", () => {
    expect(normalizeAnalysisUrl).toBe(normalizeBrandUrl);
  });
});

describe("brand URL identity — shared matrix (must match Edge)", () => {
  it.each(fixtures.accepts)("accepts $raw → $origin ($why)", ({ raw, origin }) => {
    expect(normalizeBrandUrl(raw)).toBe(origin);
  });

  it.each(fixtures.rejects)("rejects $raw ($why)", ({ raw }) => {
    expect(normalizeBrandUrl(raw)).toBeNull();
  });

  it.each(fixtures.sameWebsite)(
    "sameBrandWebsite($a, $b) === $same",
    ({ a, b, same }) => {
      expect(sameBrandWebsite(a, b)).toBe(same);
    },
  );

  it("two unusable URLs are never the same website", () => {
    expect(sameBrandWebsite(null, null)).toBe(false);
    expect(sameBrandWebsite("http://localhost", "http://localhost")).toBe(false);
  });
});

describe("crawl reuse stays origin-based", () => {
  const crawls = [
    { id: "c-new", job_status: "failed", source_url: "https://Brand.com/shop?utm=1" },
    { id: "c-done", job_status: "complete", source_url: "https://brand.com/lookbook" },
    { id: "c-other", job_status: "complete", source_url: "https://other.com" },
  ];

  it("matches a crawl stored with a different path/case on the same origin", () => {
    expect(pickBestCrawlForUrl(crawls, normalizeBrandUrl("https://brand.com/")!))
      .toEqual({ id: "c-done", job_status: "complete" });
  });

  it("never matches a crawl whose source_url is itself unusable", () => {
    expect(
      pickBestCrawlForUrl(
        [{ id: "c-bad", job_status: "complete", source_url: "not-a-url" }],
        normalizeBrandUrl("https://brand.com")!,
      ),
    ).toBeNull();
  });
});
