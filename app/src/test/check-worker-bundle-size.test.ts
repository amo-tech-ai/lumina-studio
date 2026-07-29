import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  DELTA_WARN_KIB,
  FAIL_MIB,
  WARN_MIB,
  buildWorkerBundleReport,
  evaluateGzipDelta,
  hashFileSha256,
  loadBaseGzipKiB,
  parseGzipKiB,
  readInstalledVersion,
  readPackageVersions,
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
      versions: { opennext: "1.20.2", wrangler: "4.113.0", next: "16.2.11" },
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

  it("hashFileSha256 returns null for missing files and the digest for existing files", () => {
    expect(hashFileSha256(join(tmpdir(), "no-such-worker-bundle-metafile.json"))).toBeNull();

    const dir = mkdtempSync(join(tmpdir(), "bundle-hash-"));
    const filePath = join(dir, "metafile.json");
    const contents = '{"inputs":{},"outputs":{}}';
    writeFileSync(filePath, contents, "utf8");
    expect(hashFileSha256(filePath)).toBe(
      createHash("sha256").update(contents).digest("hex"),
    );
  });

  it("loadBaseGzipKiB covers no-path, missing, invalid JSON, bad gzipKiB, valid", () => {
    expect(loadBaseGzipKiB(null)).toBeNull();
    expect(loadBaseGzipKiB("")).toBeNull();
    expect(loadBaseGzipKiB(join(tmpdir(), "no-such-worker-bundle-report.json"))).toBeNull();

    const dir = mkdtempSync(join(tmpdir(), "bundle-base-"));
    const badJson = join(dir, "bad.json");
    writeFileSync(badJson, "{not-json", "utf8");
    expect(loadBaseGzipKiB(badJson)).toBeNull();

    const missingField = join(dir, "missing.json");
    writeFileSync(missingField, JSON.stringify({ gitSha: "abc" }), "utf8");
    expect(loadBaseGzipKiB(missingField)).toBeNull();

    const badType = join(dir, "bad-type.json");
    writeFileSync(badType, JSON.stringify({ gzipKiB: "9213" }), "utf8");
    expect(loadBaseGzipKiB(badType)).toBeNull();

    const valid = join(dir, "valid.json");
    writeFileSync(valid, JSON.stringify({ gzipKiB: 9213.13, gitSha: "deadbeef" }), "utf8");
    expect(loadBaseGzipKiB(valid)).toEqual({
      gzipKiB: 9213.13,
      gitSha: "deadbeef",
      path: valid,
    });
  });

  it("readPackageVersions prefers installed versions over package.json ranges", () => {
    const root = mkdtempSync(join(tmpdir(), "bundle-versions-"));
    writeFileSync(
      join(root, "package.json"),
      JSON.stringify({
        dependencies: { next: "16.2.11", "@opennextjs/cloudflare": "1.20.2" },
        devDependencies: { wrangler: "^4.107.1" },
      }),
      "utf8",
    );
    mkdirSync(join(root, "node_modules", "wrangler"), { recursive: true });
    writeFileSync(
      join(root, "node_modules", "wrangler", "package.json"),
      JSON.stringify({ name: "wrangler", version: "4.113.0" }),
      "utf8",
    );

    expect(readInstalledVersion("wrangler", root)).toBe("4.113.0");
    expect(readInstalledVersion("next", root)).toBeNull();

    const versions = readPackageVersions(root);
    expect(versions.wrangler).toBe("4.113.0");
    expect(versions.next).toBe("16.2.11");
    expect(versions.opennext).toBe("1.20.2");
  });

  it("readPackageVersions falls back to dependencies then devDependencies", () => {
    const root = mkdtempSync(join(tmpdir(), "bundle-manifest-"));
    writeFileSync(
      join(root, "package.json"),
      JSON.stringify({
        dependencies: { next: "16.0.0" },
        devDependencies: { wrangler: "^4.107.1", "@opennextjs/cloudflare": "1.20.2" },
      }),
      "utf8",
    );

    const versions = readPackageVersions(root);
    expect(versions.next).toBe("16.0.0");
    expect(versions.wrangler).toBe("^4.107.1");
    expect(versions.opennext).toBe("1.20.2");
  });
});
