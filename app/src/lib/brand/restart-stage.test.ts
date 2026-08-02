import { describe, expect, it } from "vitest";
import {
  buildRestartAttemptKey,
  detectRestartStage,
  normalizeAnalysisUrl,
  pickBestCrawlForUrl,
  urlFingerprint,
} from "./restart-stage";

describe("normalizeAnalysisUrl", () => {
  it.each([
    ["https://Example.COM/Path/", "https://example.com/Path"],
    ["https://example.com/", "https://example.com/"],
    ["https://example.com/a#frag", "https://example.com/a"],
    ["  https://ok.com  ", "https://ok.com/"],
  ])("normalizes %s", (raw, expected) => {
    expect(normalizeAnalysisUrl(raw)).toBe(expected);
  });

  it.each([
    "",
    "   ",
    "ftp://bad.com",
    "not-a-url",
    "https://exa mple.com",
    "http://localhost/",
    "https://127.0.0.1/",
    "https://10.0.0.1/",
    "https://192.168.1.1/",
    "https://app.internal/",
    "https://user:pass@example.com/",
  ])("rejects %s", (raw) => {
    expect(normalizeAnalysisUrl(raw)).toBeNull();
  });
});

describe("buildRestartAttemptKey", () => {
  it("includes brandId and URL fingerprint (not brandId alone)", () => {
    const url = "https://aureliajewelry.com/";
    const key = buildRestartAttemptKey("brand-1", url);
    expect(key).toBe(`restart-brand-1-${urlFingerprint(url)}`);
    expect(key).not.toBe("restart-brand-1");
    expect(key).not.toMatch(/^reanalyze-/);
  });

  it("changes identity when the URL changes", () => {
    const a = buildRestartAttemptKey("brand-1", "https://a.com/");
    const b = buildRestartAttemptKey("brand-1", "https://b.com/");
    expect(a).not.toBe(b);
  });
});

describe("detectRestartStage — stage table", () => {
  it.each([
    {
      name: "active queued crawl → crawl_reused",
      intake: "failed",
      crawl: { id: "c1", job_status: "queued" },
      expect: { mode: "crawl_reused", crawlId: "c1" },
    },
    {
      name: "active running crawl → crawl_reused",
      intake: "failed",
      crawl: { id: "c2", job_status: "running" },
      expect: { mode: "crawl_reused", crawlId: "c2" },
    },
    {
      name: "complete crawl + failed → bi_restarted",
      intake: "failed",
      crawl: { id: "c3", job_status: "complete" },
      expect: { mode: "bi_restarted", crawlId: "c3" },
    },
    {
      name: "failed crawl → crawl_restarted",
      intake: "failed",
      crawl: { id: "c4", job_status: "failed" },
      expect: { mode: "crawl_restarted" },
    },
    {
      name: "cancelled crawl → crawl_restarted",
      intake: "failed",
      crawl: { id: "c5", job_status: "cancelled" },
      expect: { mode: "crawl_restarted" },
    },
    {
      name: "no crawl → crawl_restarted",
      intake: "failed",
      crawl: null,
      expect: { mode: "crawl_restarted" },
    },
    {
      name: "ready → invalid_state",
      intake: "ready",
      crawl: { id: "c6", job_status: "complete" },
      expect: { mode: "invalid_state" },
    },
    {
      name: "scores_complete → invalid_state",
      intake: "scores_complete",
      crawl: null,
      expect: { mode: "invalid_state" },
    },
    {
      name: "crawl_running → already_running",
      intake: "crawl_running",
      crawl: { id: "c7", job_status: "running" },
      expect: { mode: "already_running" },
    },
    {
      name: "analysis_running → already_running",
      intake: "analysis_running",
      crawl: null,
      expect: { mode: "already_running" },
    },
    {
      name: "draft_ready → already_running",
      intake: "draft_ready",
      crawl: null,
      expect: { mode: "already_running" },
    },
  ] as const)("$name", ({ intake, crawl, expect: expected }) => {
    expect(detectRestartStage({ intakeStatus: intake, latestCrawl: crawl })).toEqual(expected);
  });
});

describe("pickBestCrawlForUrl", () => {
  it("prefers an older active crawl over a newer failed match", () => {
    const crawls = [
      { id: "new-fail", job_status: "failed", source_url: "https://aureliajewelry.com/" },
      { id: "old-active", job_status: "running", source_url: "https://aureliajewelry.com/" },
      { id: "other", job_status: "complete", source_url: "https://other.com/" },
    ];
    expect(pickBestCrawlForUrl(crawls, "https://aureliajewelry.com/")).toEqual({
      id: "old-active",
      job_status: "running",
    });
  });

  it("prefers complete over failed when no active crawl", () => {
    const crawls = [
      { id: "new-fail", job_status: "failed", source_url: "https://aureliajewelry.com/shop" },
      { id: "old-done", job_status: "complete", source_url: "https://AURELIAJEWELRY.COM/shop/" },
    ];
    expect(pickBestCrawlForUrl(crawls, "https://aureliajewelry.com/shop")).toEqual({
      id: "old-done",
      job_status: "complete",
    });
  });

  it("returns null when no crawl matches the restart URL", () => {
    expect(
      pickBestCrawlForUrl(
        [{ id: "x", job_status: "complete", source_url: "https://other.com/" }],
        "https://aureliajewelry.com/",
      ),
    ).toBeNull();
  });
});
