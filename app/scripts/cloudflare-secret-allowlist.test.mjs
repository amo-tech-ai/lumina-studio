import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILD_TIME_SECRET_NAMES,
  RUNTIME_SECRET_NAMES,
  assertInfisicalWranglerEnvPair,
  assertNoForbiddenSecrets,
  collectRuntimeSecretsFromEnv,
  diffSecretNames,
  runtimeSecretNamesForWranglerEnv,
  wranglerCliEnvArgs,
} from "./cloudflare-secret-allowlist.mjs";
import {
  buildVersionsUploadArgs,
  parseArgs,
  redactValues,
  writeSecureSecretsFile,
} from "./sync-wrangler-secrets-from-infisical.mjs";

describe("cloudflare-secret-allowlist", () => {
  it("keeps build-time and runtime allowlists disjoint", () => {
    const runtimeSet = new Set(RUNTIME_SECRET_NAMES);
    for (const name of BUILD_TIME_SECRET_NAMES) {
      expect(runtimeSet.has(name)).toBe(false);
      expect(name.startsWith("NEXT_PUBLIC_")).toBe(true);
    }
  });

  it("rejects NEXT_PUBLIC_* in runtime sync", () => {
    expect(() => assertNoForbiddenSecrets(["NEXT_PUBLIC_SUPABASE_URL"], "runtime")).toThrow(
      /NEXT_PUBLIC/,
    );
  });

  it("rejects non-public names in build export", () => {
    expect(() => assertNoForbiddenSecrets(["GEMINI_API_KEY"], "build")).toThrow(/NEXT_PUBLIC/);
  });

  it("rejects SERVICE_ROLE in build export", () => {
    expect(() =>
      assertNoForbiddenSecrets(["NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY"], "build"),
    ).toThrow(/SERVICE_ROLE/);
  });

  it("collectRuntimeSecretsFromEnv returns only allowlisted present keys", () => {
    const { present, missing } = collectRuntimeSecretsFromEnv(
      {
        GEMINI_API_KEY: "secret-value-should-not-appear-in-test-output",
        GROQ_API_KEY: "another-secret",
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        UNLISTED_SECRET: "ignored",
      },
      "preview",
    );

    expect(Object.keys(present).sort()).toEqual(["GEMINI_API_KEY", "GROQ_API_KEY"].sort());
    expect(present.GEMINI_API_KEY).toBe("secret-value-should-not-appear-in-test-output");
    expect(missing.length).toBeGreaterThan(0);
    expect(missing).not.toContain("GEMINI_API_KEY");
  });

  it("diffSecretNames reports extra and missing by name only", () => {
    const allowlist = runtimeSecretNamesForWranglerEnv("production");
    const deployed = allowlist.filter((n) => n !== "FIRECRAWL_API_KEY");
    deployed.push("LEGACY_ORPHAN_SECRET");

    const { extra, missing } = diffSecretNames(deployed, "production");
    expect(missing).toContain("FIRECRAWL_API_KEY");
    expect(extra).toContain("LEGACY_ORPHAN_SECRET");
  });

  it("assertInfisicalWranglerEnvPair rejects dev → production", () => {
    expect(() => assertInfisicalWranglerEnvPair("dev", "production")).toThrow(/maps to wrangler "preview"/);
    expect(() => assertInfisicalWranglerEnvPair("prod", "production")).not.toThrow();
  });

  it("wranglerCliEnvArgs targets top-level production Worker via --env=\"\"", () => {
    expect(wranglerCliEnvArgs("production")).toEqual(["--env", ""]);
    expect(wranglerCliEnvArgs("preview")).toEqual(["--env", "preview"]);
  });
});

describe("sync-wrangler-secrets-from-infisical", () => {
  let logSpy;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parseArgs recognizes dry-run mode", () => {
    expect(parseArgs(["--infisical-env", "dev", "--wrangler-env", "preview", "--dry-run"])).toEqual({
      infisicalEnv: "dev",
      wranglerEnv: "preview",
      dryRun: true,
      help: false,
    });
  });

  it("buildVersionsUploadArgs uses wrangler.jsonc main (no positional worker path)", () => {
    expect(buildVersionsUploadArgs("preview", "/tmp/secrets.json")).toEqual([
      "versions",
      "upload",
      "--env",
      "preview",
      "--secrets-file",
      "/tmp/secrets.json",
    ]);
    expect(buildVersionsUploadArgs("production", "/tmp/secrets.json")).toEqual([
      "versions",
      "upload",
      "--env",
      "",
      "--secrets-file",
      "/tmp/secrets.json",
    ]);
  });

  it("dry-run path logs secret names only, never values", () => {
    const fakeGemini = "super-secret-gemini-key-12345";
    const fakeGroq = "gsk_super_secret_groq";
    process.env.GEMINI_API_KEY = fakeGemini;
    process.env.GROQ_API_KEY = fakeGroq;

    const { present } = collectRuntimeSecretsFromEnv(process.env, "preview");
    const names = Object.keys(present).sort();
    console.log(`secrets to sync (${names.length}): ${names.join(", ")}`);
    console.log("dry-run: no wrangler calls made; secret values not printed");

    const allLogArgs = logSpy.mock.calls.flat().join("\n");
    expect(allLogArgs).toContain("GEMINI_API_KEY");
    expect(allLogArgs).not.toContain(fakeGemini);
    expect(allLogArgs).not.toContain(fakeGroq);

    delete process.env.GEMINI_API_KEY;
    delete process.env.GROQ_API_KEY;
  });

  it("redactValues strips secret values but preserves secret names in wrangler output", () => {
    const raw = 'Uploaded secret GEMINI_API_KEY with value "AIzaSyRealSecretValue"';
    const redacted = redactValues(raw);
    expect(redacted).not.toContain("AIzaSyRealSecretValue");
    expect(redacted).toContain("GEMINI_API_KEY");
    expect(redacted).toContain('with value "[REDACTED]"');
    // Unrelated quoted strings (not wrangler value lines) stay intact
    expect(redactValues('note: binding "ASSETS" configured')).toBe(
      'note: binding "ASSETS" configured',
    );
  });

  it("dry-run with zero secrets exits 0 and reports empty sync set", () => {
    const scriptPath = resolve(
      dirname(fileURLToPath(import.meta.url)),
      "sync-wrangler-secrets-from-infisical.mjs",
    );
    const r = spawnSync(
      process.execPath,
      [scriptPath, "--wrangler-env", "preview", "--infisical-env", "dev", "--dry-run"],
      {
        env: { PATH: process.env.PATH },
        encoding: "utf8",
      },
    );
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/secrets to sync \(0\)/);
    expect(r.stdout).toContain("dry-run: no wrangler calls made");
  });

  it("writeSecureSecretsFile creates chmod-600 temp JSON and cleans up", () => {
    const fakeGemini = "super-secret-gemini-key-12345";
    const { filePath, cleanup } = writeSecureSecretsFile({ GEMINI_API_KEY: fakeGemini });
    expect(filePath).toMatch(/secrets\.json$/);

    const mode = statSync(filePath).mode & 0o777;
    expect(mode).toBe(0o600);

    const parsed = JSON.parse(readFileSync(filePath, "utf8"));
    expect(parsed.GEMINI_API_KEY).toBe(fakeGemini);

    cleanup();
    expect(() => statSync(filePath)).toThrow();
  });

  it("sync script header documents secrets-file upload not secret bulk", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolve, dirname } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const scriptPath = resolve(dirname(fileURLToPath(import.meta.url)), "sync-wrangler-secrets-from-infisical.mjs");
    const src = readFileSync(scriptPath, "utf8");
    expect(src).toMatch(/versions upload/);
    expect(src).toMatch(/--secrets-file/);
    expect(src).toMatch(/buildVersionsUploadArgs/);
    expect(src).not.toMatch(/workerPath/);
  });
});
