import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import {
  RELEASE_RECORD_SCHEMA_VERSION,
  REQUIRED_RELEASE_FIELDS,
  assertNoSecretsInRecord,
  assertReleaseRecord,
  buildReleaseRecord,
  buildReleaseRecordFromNdjson,
  parseCliArgs,
  parseWranglerNdjson,
  sanitizeForReleaseRecord,
} from "./build-cloudflare-release-record.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(__dirname, "build-cloudflare-release-record.mjs");

const VERSION_A = "095f00a7-23a7-43b7-a227-e4c97cab5f22";
const VERSION_B = "1a88955c-2fbd-4a72-9d9b-3ba1e59842f2";
const DEPLOY_ID = "dpl_abc123def456";
const GIT_SHA = "a99938e6b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6";

function sampleNdjson(overrides = {}) {
  const session = {
    type: "wrangler-session",
    version: 1,
    wrangler_version: "4.50.0",
    command_line_args: ["versions", "upload"],
    timestamp: "2026-08-04T12:00:00.000Z",
  };
  const upload = {
    type: "version-upload",
    version: 1,
    worker_name: "ipix-operator",
    version_id: VERSION_A,
    targets: ["https://ipix-operator.example.workers.dev"],
    wrangler_environment: "production",
    timestamp: "2026-08-04T12:00:05.000Z",
    ...overrides.upload,
  };
  return `${JSON.stringify(session)}\n${JSON.stringify(upload)}\n`;
}

describe("parseWranglerNdjson", () => {
  it("parses session + version-upload", () => {
    const { session, latest } = parseWranglerNdjson(sampleNdjson());
    expect(session?.wrangler_version).toBe("4.50.0");
    expect(latest?.type).toBe("version-upload");
    expect(latest?.version_id).toBe(VERSION_A);
  });

  it("fails closed on empty input", () => {
    expect(() => parseWranglerNdjson("")).toThrow(/empty or missing/);
    expect(() => parseWranglerNdjson("   \n")).toThrow(/empty or missing/);
  });

  it("fails closed on invalid JSON line", () => {
    expect(() => parseWranglerNdjson("{not-json}\n")).toThrow(/not valid JSON/);
  });

  it("fails closed when provenance entry missing", () => {
    const onlySession = `${JSON.stringify({
      type: "wrangler-session",
      wrangler_version: "4.50.0",
      timestamp: "2026-08-04T12:00:00.000Z",
    })}\n`;
    expect(() => parseWranglerNdjson(onlySession)).toThrow(/missing version-upload/);
  });

  it("fails closed on command-failed entry", () => {
    const nd =
      sampleNdjson() +
      `${JSON.stringify({
        type: "command-failed",
        error_code: 1,
        message: "upload blew up",
        timestamp: "2026-08-04T12:00:06.000Z",
      })}\n`;
    expect(() => parseWranglerNdjson(nd)).toThrow(/command-failed/);
  });
});

describe("sanitizeForReleaseRecord + secrets", () => {
  it("redacts secret-shaped keys and values", () => {
    const dirty = {
      worker: "ipix-operator",
      api_token: "cfut_abcdefghijklmnopqrstuvwxyz",
      note: "Bearer eyJhbGciOiJIUzI1NiJ9.payload.sig",
      nested: { DATABASE_URL: "postgresql://user:pass@host/db" },
      safe: "preview",
    };
    const clean = sanitizeForReleaseRecord(dirty);
    expect(clean.api_token).toBe("[REDACTED]");
    expect(clean.note).toBe("[REDACTED]");
    expect(clean.nested.DATABASE_URL).toBe("[REDACTED]");
    expect(clean.safe).toBe("preview");
    expect(clean.worker).toBe("ipix-operator");
  });

  it("assertNoSecretsInRecord throws on leaked token", () => {
    expect(() =>
      assertNoSecretsInRecord({
        worker: "x",
        leak: "sk-abcdefghijklmnopqrstuvwxyz012345",
      }),
    ).toThrow(/secret-shaped/);
  });
});

describe("buildReleaseRecord schema", () => {
  it("emits all required fields with 0% traffic for version-upload", () => {
    const { session, latest } = parseWranglerNdjson(sampleNdjson());
    const record = buildReleaseRecord({
      wranglerLatest: latest,
      wranglerSession: session,
      environment: "production",
      gitSha: GIT_SHA,
      bundleGzipBytes: 8_650_000,
      artifactHash: "abc123hash",
      openNextVersion: "1.6.0",
    });

    for (const key of REQUIRED_RELEASE_FIELDS) {
      expect(record).toHaveProperty(key);
    }
    expect(record.schemaVersion).toBe(RELEASE_RECORD_SCHEMA_VERSION);
    expect(record.worker).toBe("ipix-operator");
    expect(record.environment).toBe("production");
    expect(record.versionId).toBe(VERSION_A);
    expect(record.deploymentId).toBeNull();
    expect(record.gitSha).toBe(GIT_SHA);
    expect(record.traffic).toEqual({ percentage: 0 });
    expect(record.bundleGzipBytes).toBe(8_650_000);
    expect(record.wranglerVersion).toBe("4.50.0");
    expect(record.openNextVersion).toBe("1.6.0");
    expect(record.source).toBe("version-upload");
    assertReleaseRecord(record);
    assertNoSecretsInRecord(record);
  });

  it("defaults traffic to 0 for new uploads even when percentage omitted", () => {
    const record = buildReleaseRecordFromNdjson({
      ndjsonText: sampleNdjson(),
      environment: "preview",
      gitSha: "deadbeef",
    });
    expect(record.traffic).toEqual({ percentage: 0 });
  });

  it("requires deploymentId when traffic > 0", () => {
    const { session, latest } = parseWranglerNdjson(sampleNdjson());
    expect(() =>
      buildReleaseRecord({
        wranglerLatest: latest,
        wranglerSession: session,
        environment: "production",
        gitSha: GIT_SHA,
        trafficPercent: 10,
        deploymentId: null,
      }),
    ).toThrow(/deploymentId is required when traffic/);
  });

  it("accepts version in active deployment at 0%", () => {
    const ndjson = [
      JSON.stringify({
        type: "wrangler-session",
        wrangler_version: "4.50.0",
        timestamp: "2026-08-04T12:00:00.000Z",
      }),
      JSON.stringify({
        type: "version-deploy",
        worker_name: "ipix-operator",
        version_id: VERSION_B,
        deployment_id: DEPLOY_ID,
        percentage: 0,
        timestamp: "2026-08-04T12:01:00.000Z",
      }),
    ].join("\n");

    const record = buildReleaseRecordFromNdjson({
      ndjsonText: ndjson,
      environment: "production",
      gitSha: GIT_SHA,
      trafficPercent: 0,
      deploymentId: DEPLOY_ID,
    });
    expect(record.versionId).toBe(VERSION_B);
    expect(record.deploymentId).toBe(DEPLOY_ID);
    expect(record.traffic).toEqual({ percentage: 0 });
  });

  it("fails closed on missing versionId", () => {
    expect(() =>
      buildReleaseRecord({
        wranglerLatest: { type: "version-upload", worker_name: "ipix-operator" },
        environment: "production",
        gitSha: GIT_SHA,
      }),
    ).toThrow(/versionId is required/);
  });

  it("fails closed on bad environment", () => {
    expect(() =>
      buildReleaseRecord({
        wranglerLatest: {
          type: "version-upload",
          worker_name: "ipix-operator",
          version_id: VERSION_A,
        },
        environment: "staging",
        gitSha: GIT_SHA,
      }),
    ).toThrow(/preview\|production/);
  });

  it("fails closed on short gitSha", () => {
    expect(() =>
      buildReleaseRecord({
        wranglerLatest: {
          type: "version-upload",
          worker_name: "ipix-operator",
          version_id: VERSION_A,
        },
        environment: "preview",
        gitSha: "abc",
      }),
    ).toThrow(/gitSha/);
  });

  it("strips secrets if they sneak into optional fields", () => {
    const { session, latest } = parseWranglerNdjson(sampleNdjson());
    const poisoned = {
      ...latest,
      api_token: "cfut_should_never_appear_in_output_xx",
    };
    const record = buildReleaseRecord({
      wranglerLatest: poisoned,
      wranglerSession: session,
      environment: "production",
      gitSha: GIT_SHA,
    });
    const json = JSON.stringify(record);
    expect(json).not.toMatch(/cfut_/);
    expect(json).not.toMatch(/api_token/);
  });
});

describe("CLI", () => {
  it("parseCliArgs reads flags", () => {
    const opts = parseCliArgs([
      "--wrangler-output",
      "/tmp/out.ndjson",
      "--environment=production",
      "--git-sha",
      GIT_SHA,
      "--traffic-percent=0",
    ]);
    expect(opts.wranglerOutput).toBe("/tmp/out.ndjson");
    expect(opts.environment).toBe("production");
    expect(opts.gitSha).toBe(GIT_SHA);
    expect(opts.trafficPercent).toBe("0");
  });

  it("writes sanitized JSON and exits 0", () => {
    const dir = mkdtempSync(join(tmpdir(), "ipi-705-"));
    try {
      const ndjsonPath = join(dir, "wrangler.ndjson");
      const outPath = join(dir, "release-record.json");
      writeFileSync(ndjsonPath, sampleNdjson());
      const r = spawnSync(
        process.execPath,
        [
          SCRIPT,
          "--wrangler-output",
          ndjsonPath,
          "--environment",
          "production",
          "--git-sha",
          GIT_SHA,
          "--out",
          outPath,
          "--traffic-percent",
          "0",
        ],
        { encoding: "utf8" },
      );
      expect(r.status).toBe(0);
      expect(r.stdout).toMatch(/release_record_version_id=/);
      const record = JSON.parse(readFileSync(outPath, "utf8"));
      assertReleaseRecord(record);
      assertNoSecretsInRecord(record);
      expect(record.traffic.percentage).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("exits non-zero when Wrangler file missing", () => {
    const r = spawnSync(
      process.execPath,
      [
        SCRIPT,
        "--wrangler-output",
        "/tmp/ipi-705-does-not-exist.ndjson",
        "--environment",
        "preview",
        "--git-sha",
        GIT_SHA,
      ],
      { encoding: "utf8" },
    );
    expect(r.status).not.toBe(0);
    expect(r.stderr).toMatch(/not found/);
  });

  it("exits non-zero on invalid NDJSON", () => {
    const dir = mkdtempSync(join(tmpdir(), "ipi-705-bad-"));
    try {
      const ndjsonPath = join(dir, "bad.ndjson");
      writeFileSync(ndjsonPath, "not-json\n");
      const r = spawnSync(
        process.execPath,
        [
          SCRIPT,
          "--wrangler-output",
          ndjsonPath,
          "--environment",
          "preview",
          "--git-sha",
          GIT_SHA,
          "--out",
          join(dir, "out.json"),
        ],
        { encoding: "utf8" },
      );
      expect(r.status).not.toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
