import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

// runWrangler() shells out to the local wrangler binary. Stub the syscall so
// main() can be exercised without a real OpenNext build.
const spawnSyncMock = vi.hoisted(() => vi.fn());
vi.mock("node:child_process", () => ({ spawnSync: spawnSyncMock }));

import {
  DELTA_WARN_KIB,
  FAIL_MIB,
  WARN_MIB,
  buildWorkerBundleReport,
  evaluateGzipDelta,
  hashFileSha256,
  loadBaseGzipKiB,
  main,
  parseGzipKiB,
  readInstalledVersion,
  readPackageVersions,
} from "../../scripts/check-worker-bundle-size.mjs";

/** Fake a `wrangler deploy --dry-run` whose gzip total is `gzipKiB`. */
function stubDryRun(gzipKiB: number, uploadKiB = gzipKiB * 5) {
  spawnSyncMock.mockReturnValue({
    status: 0,
    stdout: `Total Upload: ${uploadKiB.toFixed(2)} KiB / gzip: ${gzipKiB.toFixed(2)} KiB\n`,
    stderr: "",
    error: undefined,
  });
}

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

describe("main() report/delta ordering (IPI-706 Phase 1A)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    spawnSyncMock.mockReset();
  });

  /**
   * Regression guard for the ordering comment in main():
   *   "Load base BEFORE writing the current report — same-path reuse would
   *    otherwise overwrite the base JSON and silently report +0.00 KiB."
   *
   * Every helper around that line is unit-tested; the ordering that makes them
   * correct was not. Moving writeFileSync above loadBaseGzipKiB produces a
   * permanently silent +0.00 KiB delta that fails nothing — this test is the
   * only thing that would catch it.
   */
  it("reads the base report before overwriting it when both paths are the same file", () => {
    const dir = mkdtempSync(join(tmpdir(), "bundle-main-samepath-"));
    const sharedPath = join(dir, "worker-bundle-report.json");
    writeFileSync(
      sharedPath,
      JSON.stringify({ schemaVersion: 1, gzipKiB: 8000, gitSha: "baseeee" }),
      "utf8",
    );

    stubDryRun(8100);
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});

    main([`--base-report=${sharedPath}`, `--report-path=${sharedPath}`]);

    const logged = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    // +100.00 KiB, not +0.00 — proves the base was read pre-write.
    expect(logged).toMatch(/Delta vs base .*\+100\.00 KiB gzip \(base 8000\.00 → 8100\.00\)/);
    expect(logged).not.toMatch(/\+0\.00 KiB gzip/);

    // The shared file now holds the *current* run, so a rerun would compare 8100→8100.
    // That is expected: the guard is about read-then-write order within one run.
    expect(JSON.parse(readFileSync(sharedPath, "utf8")).gzipKiB).toBe(8100);
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it("warns past the delta threshold and still exits 0 (delta never hard-fails)", () => {
    const dir = mkdtempSync(join(tmpdir(), "bundle-main-delta-"));
    const basePath = join(dir, "base.json");
    const outPath = join(dir, "out.json");
    writeFileSync(basePath, JSON.stringify({ schemaVersion: 1, gzipKiB: 8000 }), "utf8");

    stubDryRun(8000 + DELTA_WARN_KIB + 1);
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    vi.spyOn(console, "log").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    main([`--base-report=${basePath}`, `--report-path=${outPath}`]);

    expect(warnSpy.mock.calls.map((c) => String(c[0])).join("\n")).toMatch(
      /WARN \(delta\): gzip grew 26\.00 KiB > 25 KiB provisional threshold/,
    );
    // Growth is a WARNING only — absolute gates are the sole exit-1 path.
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it("hard-fails on the absolute gate regardless of a healthy delta", () => {
    const dir = mkdtempSync(join(tmpdir(), "bundle-main-fail-"));
    const basePath = join(dir, "base.json");
    const failKiB = FAIL_MIB * 1024 + 10;
    writeFileSync(basePath, JSON.stringify({ schemaVersion: 1, gzipKiB: failKiB - 1 }), "utf8");

    stubDryRun(failKiB);
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    vi.spyOn(console, "log").mockImplementation(() => {});
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    main([`--base-report=${basePath}`, `--report-path=${join(dir, "out.json")}`]);

    expect(errSpy.mock.calls.map((c) => String(c[0])).join("\n")).toMatch(
      /FAIL: gzip 9\.0\d+ MiB ≥ 9 MiB/,
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(WARN_MIB).toBe(8.5);
  });
});
