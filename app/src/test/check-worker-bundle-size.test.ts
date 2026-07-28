import { describe, expect, it } from "vitest";
import {
  DELTA_WARN_KIB,
  FAIL_MIB,
  WARN_MIB,
  buildWorkerBundleReport,
  evaluateGzipDelta,
  parseGzipKiB,
} from "../../scripts/check-worker-bundle-size.mjs";

describe("check-worker-bundle-size helpers (IPI-706 Phase 1A)", () => {
  it("parses wrangler dry-run Total Upload / gzip line", () => {
    const sizes = parseGzipKiB(
      "Total Upload: 46384.44 KiB / gzip: 9213.13 KiB\nOther noise",
    );
    expect(sizes).toEqual({ uploadKiB: 46384.44, gzipKiB: 9213.13 });
  });

  it("keeps absolute warn/fail thresholds", () => {
    expect(WARN_MIB).toBe(8.5);
    expect(FAIL_MIB).toBe(9.0);
  });

  it("warns on provisional delta growth without implying hard fail", () => {
    expect(DELTA_WARN_KIB).toBe(25);
    const under = evaluateGzipDelta({ gzipKiB: 9213.13, baseGzipKiB: 9200 });
    expect(under.warn).toBe(false);
    expect(under.deltaKiB).toBeCloseTo(13.13, 2);
    const over = evaluateGzipDelta({ gzipKiB: 9230, baseGzipKiB: 9200 });
    expect(over).toEqual({ deltaKiB: 30, warn: true });
  });

  it("builds a machine-readable report with schemaVersion 1", () => {
    const report = buildWorkerBundleReport({
      sizes: { uploadKiB: 46384.44, gzipKiB: 9213.13 },
      metafileHash: "abc123",
      versions: { opennext: "1.20.2", wrangler: "^4.107.1", next: "16.2.11" },
      gitSha: "deadbeef",
      createdAt: "2026-07-28T00:00:00.000Z",
    });
    expect(report.schemaVersion).toBe(1);
    expect(report.gzipKiB).toBe(9213.13);
    expect(report.gzipMiB).toBeCloseTo(8.997, 3);
    expect(report.gates).toEqual({
      warnMiB: 8.5,
      failMiB: 9.0,
      deltaWarnKiB: 25,
    });
    expect(report.metafileSha256).toBe("abc123");
    expect(report.gitSha).toBe("deadbeef");
  });
});
