import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const spawnSyncMock = vi.hoisted(() => vi.fn());
vi.mock("node:child_process", () => ({ spawnSync: spawnSyncMock }));

import {
  BANNED_METAFILE_SUBSTRINGS,
  WARN_METAFILE_SUBSTRINGS,
  buildWorkerBundleReport,
  encodedMetafileNeedle,
  main,
  packageKeyFromInputPath,
  pathMatchesMetafileNeedle,
  scanMetafileInputs,
  summarizeTopPackages,
  validateMetafileForScan,
} from "../../scripts/check-worker-bundle-size.mjs";

function stubDryRun(gzipKiB: number, uploadKiB = gzipKiB * 5) {
  spawnSyncMock.mockReturnValue({
    status: 0,
    stdout: `Total Upload: ${uploadKiB.toFixed(2)} KiB / gzip: ${gzipKiB.toFixed(2)} KiB\n`,
    stderr: "",
    error: undefined,
  });
}

describe("metafile composition helpers (IPI-848 · CF-BUNDLE-223)", () => {
  it("hard-bans mermaid, katex, cytoscape, and real web-inspector under node_modules", () => {
    expect(BANNED_METAFILE_SUBSTRINGS).toEqual([
      "node_modules/mermaid",
      "node_modules/katex",
      "node_modules/cytoscape",
      "node_modules/@copilotkit/web-inspector",
    ]);
    expect(WARN_METAFILE_SUBSTRINGS).toEqual([]);
    // Bare web-inspector would false-fail the CF stub path.
    expect(BANNED_METAFILE_SUBSTRINGS.some((s) => s === "web-inspector")).toBe(false);
  });

  it("encodes slash ban needles the OpenNext chunk way", () => {
    expect(encodedMetafileNeedle("node_modules/@copilotkit/web-inspector")).toBe(
      "node_modules_@copilotkit_web-inspector",
    );
    expect(
      pathMatchesMetafileNeedle(
        ".next/server/chunks/ssr/node_modules_@copilotkit_web-inspector_dist_index_mjs_150addu._.js",
        "node_modules/@copilotkit/web-inspector",
      ),
    ).toBe(true);
    expect(
      pathMatchesMetafileNeedle(
        "scripts_cf-web-inspector-stub_mjs_0c6u9j5._.js",
        "node_modules/@copilotkit/web-inspector",
      ),
    ).toBe(false);
  });

  it("scanMetafileInputs hard-fails slash + OpenNext-encoded paths; ignores stubs", () => {
    const metafile = {
      inputs: {
        "node_modules/mermaid/dist/mermaid.core.mjs": { bytes: 1000 },
        ".next/server/chunks/ssr/node_modules_katex_dist_katex_mjs_xxxx._.js": { bytes: 500 },
        ".next/server/chunks/ssr/node_modules_cytoscape_dist_cytoscape_esm_mjs_yy._.js": {
          bytes: 800,
        },
        // Recorded OpenNext shape from 2026-07-29 audit (pre-stub regression).
        ".next/server/chunks/ssr/node_modules_@copilotkit_web-inspector_dist_index_mjs_150addu._.js": {
          bytes: 900,
        },
        "scripts_cf-web-inspector-stub_mjs_0c6u9j5._.js": { bytes: 200 },
        "node_modules/zod/lib/index.js": { bytes: 50 },
      },
    };

    const { hardHits, warnHits } = scanMetafileInputs(metafile);
    expect(warnHits).toEqual([]);
    expect(hardHits.map((h) => h.ban).sort()).toEqual([
      "node_modules/@copilotkit/web-inspector",
      "node_modules/cytoscape",
      "node_modules/katex",
      "node_modules/mermaid",
    ]);
    expect(hardHits.some((h) => h.path.includes("scripts_cf-web-inspector-stub"))).toBe(false);
  });

  it("scanMetafileInputs passes a clean stubbed tree", () => {
    const metafile = {
      inputs: {
        "scripts_cf-mermaid-stub_mjs-AAA.js": { bytes: 100 },
        "scripts_cf-katex-stub_mjs-BBB.js": { bytes: 100 },
        "scripts_cf-web-inspector-stub_mjs-CCC.js": { bytes: 100 },
        "node_modules/@mastra/core/dist/index.js": { bytes: 5000 },
        ".next/server/chunks/ssr/node_modules_next_dist_0alesp5._.js": { bytes: 2000 },
      },
    };
    expect(scanMetafileInputs(metafile)).toEqual({ hardHits: [], warnHits: [] });
  });

  it("validateMetafileForScan fails closed on missing/malformed/empty inputs", () => {
    expect(validateMetafileForScan(null).ok).toBe(false);
    expect(validateMetafileForScan({}).ok).toBe(false);
    expect(validateMetafileForScan({ inputs: null }).ok).toBe(false);
    expect(validateMetafileForScan({ inputs: [] }).ok).toBe(false);
    expect(validateMetafileForScan({ inputs: {} }).ok).toBe(false);
    expect(validateMetafileForScan({ inputs: { "a.js": { bytes: 1 } } }).ok).toBe(true);
  });

  it("summarizeTopPackages orders by bytes desc and respects limit", () => {
    const metafile = {
      inputs: {
        "node_modules/@mastra/core/a.js": { bytes: 3000 },
        "node_modules/@mastra/core/b.js": { bytes: 2000 },
        "node_modules/zod/index.js": { bytes: 1000 },
        "node_modules/next/dist/x.js": { bytes: 4000 },
        "opaque-chunk.js": { bytes: 50 },
      },
    };
    const top = summarizeTopPackages(metafile, { limit: 3 });
    expect(top.map((r) => r.name)).toEqual(["@mastra/core", "next", "zod"]);
    expect(top[0].bytes).toBe(5000);
    expect(top[0].kib).toBeCloseTo(4.88, 1);
    expect(packageKeyFromInputPath("node_modules/@scope/pkg/x.js")).toBe("@scope/pkg");
    expect(packageKeyFromInputPath("scripts_cf-stub.js")).toBe("(other)");
  });

  it("buildWorkerBundleReport schemaVersion 2 includes topPackages + composition", () => {
    const report = buildWorkerBundleReport({
      sizes: { uploadKiB: 100, gzipKiB: 50 },
      metafileHash: "abc",
      versions: { opennext: "1", wrangler: "1", next: "1" },
      topPackages: [{ name: "next", bytes: 100, kib: 0.1 }],
      composition: {
        hardHits: [{ path: "node_modules/mermaid/x.js", ban: "node_modules/mermaid" }],
        warnHits: [],
      },
      gitSha: "deadbeef",
      createdAt: "2026-08-01T00:00:00.000Z",
    });
    expect(report.schemaVersion).toBe(2);
    expect(report.topPackages).toHaveLength(1);
    expect(report.composition.hardHitCount).toBe(1);
    expect(report.metafileSha256).toBe("abc");
    expect(report.gitSha).toBe("deadbeef");
  });
});

describe("main() composition hard-fail (IPI-848)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    spawnSyncMock.mockReset();
    delete process.env.WORKER_BUNDLE_METAFILE;
  });

  it("exits 1 when metafile contains OpenNext-encoded banned packages under size OK", () => {
    const dir = mkdtempSync(join(tmpdir(), "bundle-meta-ban-"));
    const metaPath = join(dir, "handler.mjs.meta.json");
    writeFileSync(
      metaPath,
      JSON.stringify({
        inputs: {
          ".next/server/chunks/ssr/node_modules_@copilotkit_web-inspector_dist_index_mjs_150addu._.js":
            { bytes: 999 },
        },
      }),
      "utf8",
    );
    process.env.WORKER_BUNDLE_METAFILE = metaPath;

    stubDryRun(7000);
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    vi.spyOn(console, "log").mockImplementation(() => {});
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    main([`--report-path=${join(dir, "out.json")}`]);

    expect(errSpy.mock.calls.map((c) => String(c[0])).join("\n")).toMatch(
      /FAIL \(composition\): 1 banned metafile path hit/,
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("exits 0 on clean metafile with web-inspector stub path only", () => {
    const dir = mkdtempSync(join(tmpdir(), "bundle-meta-clean-"));
    const metaPath = join(dir, "handler.mjs.meta.json");
    writeFileSync(
      metaPath,
      JSON.stringify({
        inputs: {
          "scripts_cf-web-inspector-stub_mjs-XYZ.js": { bytes: 120 },
          "node_modules/@mastra/core/dist/index.js": { bytes: 4000 },
        },
      }),
      "utf8",
    );
    process.env.WORKER_BUNDLE_METAFILE = metaPath;

    stubDryRun(7000);
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});

    main([`--report-path=${join(dir, "out.json")}`]);

    const logged = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(logged).toMatch(/OK \(composition\): no banned paths/);
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it("exits 1 when metafile is missing (fail closed)", () => {
    const dir = mkdtempSync(join(tmpdir(), "bundle-meta-missing-"));
    process.env.WORKER_BUNDLE_METAFILE = join(dir, "no-such-meta.json");

    stubDryRun(7000);
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    vi.spyOn(console, "log").mockImplementation(() => {});
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    main([`--report-path=${join(dir, "out.json")}`]);

    expect(errSpy.mock.calls.map((c) => String(c[0])).join("\n")).toMatch(
      /FAIL \(composition\): metafile not scannable/,
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
