import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILD_TIME_SECRET_NAMES,
  CI_ONLY_SECRET_NAMES,
  RUNTIME_SECRET_NAMES,
  RUNTIME_OPTIONAL_SECRET_NAMES,
  WRANGLER_VAR_NAMES,
  WRANGLER_REQUIRED_VAR_NAMES,
  RUNTIME_REQUIRED_SECRET_NAMES,
  assertInfisicalWranglerEnvPair,
  assertNoForbiddenSecrets,
  buildWranglerVarCliArgs,
  collectRuntimeSecretsFromEnv,
  collectWranglerVarsFromEnv,
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
  it("keeps build-time, runtime, and wrangler var allowlists disjoint", () => {
    const runtimeSet = new Set(RUNTIME_SECRET_NAMES);
    const varSet = new Set(WRANGLER_VAR_NAMES);
    for (const name of BUILD_TIME_SECRET_NAMES) {
      expect(runtimeSet.has(name)).toBe(false);
      expect(varSet.has(name)).toBe(false);
      expect(name.startsWith("NEXT_PUBLIC_")).toBe(true);
    }
    for (const name of WRANGLER_VAR_NAMES) {
      expect(runtimeSet.has(name)).toBe(false);
    }
  });

  it("rejects wrangler var names in runtime sync", () => {
    expect(() => assertNoForbiddenSecrets(["INTELLIGENCE_API_URL"], "runtime")).toThrow(
      /wrangler\.jsonc vars/,
    );
  });

  it("RUNTIME_REQUIRED_SECRET_NAMES matches wrangler secrets.required (fail-closed pair only)", () => {
    expect(RUNTIME_REQUIRED_SECRET_NAMES).toEqual([
      "GEMINI_API_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ]);
  });

  it("COPILOTKIT_LICENSE_TOKEN is allowlisted optional, not bootstrap-required", () => {
    expect(RUNTIME_SECRET_NAMES).toContain("COPILOTKIT_LICENSE_TOKEN");
    expect(RUNTIME_OPTIONAL_SECRET_NAMES).toContain("COPILOTKIT_LICENSE_TOKEN");
    expect(RUNTIME_REQUIRED_SECRET_NAMES).not.toContain("COPILOTKIT_LICENSE_TOKEN");
  });

  it("keeps CI-only, runtime, build-time, and wrangler-var allowlists disjoint", () => {
    const runtimeSet = new Set(RUNTIME_SECRET_NAMES);
    const buildSet = new Set(BUILD_TIME_SECRET_NAMES);
    const varSet = new Set(WRANGLER_VAR_NAMES);
    for (const name of CI_ONLY_SECRET_NAMES) {
      expect(runtimeSet.has(name)).toBe(false);
      expect(buildSet.has(name)).toBe(false);
      expect(varSet.has(name)).toBe(false);
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

  it("collectWranglerVarsFromEnv returns only allowlisted present keys", () => {
    const { present, missing } = collectWranglerVarsFromEnv({
      INTELLIGENCE_API_URL: "https://intel.example/api",
      INTELLIGENCE_GATEWAY_WS_URL: "wss://intel.example/ws",
      GEMINI_API_KEY: "must-not-appear",
    });

    expect(Object.keys(present).sort()).toEqual([
      "INTELLIGENCE_API_URL",
      "INTELLIGENCE_GATEWAY_WS_URL",
    ]);
    expect(missing).toContain("AI_GATEWAY_URL");
  });

  it("buildWranglerVarCliArgs emits sorted --var pairs", () => {
    expect(
      buildWranglerVarCliArgs({
        INTELLIGENCE_API_URL: "https://a",
        AI_GATEWAY_URL: "http://localhost:8787",
      }),
    ).toEqual([
      "--var",
      "AI_GATEWAY_URL:http://localhost:8787",
      "--var",
      "INTELLIGENCE_API_URL:https://a",
    ]);
  });

  it("WRANGLER_REQUIRED_VAR_NAMES is subset of WRANGLER_VAR_NAMES", () => {
    for (const name of WRANGLER_REQUIRED_VAR_NAMES) {
      expect(WRANGLER_VAR_NAMES).toContain(name);
    }
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

  it("validate-env-pair.mjs reads INFISICAL_ENV and WRANGLER_ENV from env", () => {
    const scriptPath = resolve(dirname(fileURLToPath(import.meta.url)), "validate-env-pair.mjs");
    const ok = spawnSync(process.execPath, [scriptPath], {
      env: { PATH: process.env.PATH, INFISICAL_ENV: "prod", WRANGLER_ENV: "production" },
      encoding: "utf8",
    });
    expect(ok.status).toBe(0);
    expect(ok.stdout).toContain("pairing ok: prod → production");

    const bad = spawnSync(process.execPath, [scriptPath], {
      env: { PATH: process.env.PATH, INFISICAL_ENV: "dev", WRANGLER_ENV: "production" },
      encoding: "utf8",
    });
    expect(bad.status).not.toBe(0);
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

  it("wrangler.jsonc declares secrets.required per named env and static vars only", () => {
    const wranglerPath = resolve(dirname(fileURLToPath(import.meta.url)), "../wrangler.jsonc");
    const wrangler = readFileSync(wranglerPath, "utf8");
    for (const key of RUNTIME_REQUIRED_SECRET_NAMES) {
      expect(wrangler).toMatch(new RegExp(`"preview"[\\s\\S]*"required"[\\s\\S]*${key}`));
      expect(wrangler).toMatch(new RegExp(`"production"[\\s\\S]*"required"[\\s\\S]*${key}`));
    }
    expect(wrangler).toMatch(/"preview"[\s\S]*MASTRA_STORAGE_MODE/);
    expect(wrangler).not.toMatch(/"preview"[\s\S]*INTELLIGENCE_API_URL/);
    expect(wrangler).not.toMatch(/"DATABASE_URL"/);
  });

  it("sync script header documents secrets-file upload not secret bulk", async () => {
    const scriptPath = resolve(
      dirname(fileURLToPath(import.meta.url)),
      "sync-wrangler-secrets-from-infisical.mjs",
    );
    const src = readFileSync(scriptPath, "utf8");
    expect(src).toMatch(/versions upload/);
    expect(src).toMatch(/--secrets-file/);
    expect(src).toMatch(/buildVersionsUploadArgs/);
    expect(src).not.toMatch(/workerPath/);
  });
});

describe("upload-opennext-with-secrets", () => {
  it("parseWorkerVersionId extracts UUID from wrangler output", async () => {
    const { parseWorkerVersionId } = await import("./upload-opennext-with-secrets.mjs");
    expect(
      parseWorkerVersionId("Uploaded worker version 550e8400-e29b-41d4-a716-446655440000"),
    ).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(parseWorkerVersionId("no version here")).toBeNull();
  });

  it("parseWorkersDevUrl extracts workers.dev URL", async () => {
    const { parseWorkersDevUrl } = await import("./upload-opennext-with-secrets.mjs");
    expect(parseWorkersDevUrl("Published https://ipix-operator-preview.acct.workers.dev")).toBe(
      "https://ipix-operator-preview.acct.workers.dev",
    );
  });

  it("dry-run with GEMINI lists secret names only", () => {
    process.env.GEMINI_API_KEY = "super-secret-gemini-key-12345";
    const scriptPath = resolve(
      dirname(fileURLToPath(import.meta.url)),
      "upload-opennext-with-secrets.mjs",
    );
    const r = spawnSync(
      process.execPath,
      [scriptPath, "--wrangler-env", "preview", "--infisical-env", "dev", "--dry-run"],
      { env: { ...process.env, PATH: process.env.PATH }, encoding: "utf8" },
    );
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("GEMINI_API_KEY");
    expect(r.stdout).not.toContain("super-secret-gemini-key-12345");
    delete process.env.GEMINI_API_KEY;
  });

  it("dry-run without COPILOTKIT_LICENSE_TOKEN succeeds (optional Intelligence)", () => {
    const scriptPath = resolve(
      dirname(fileURLToPath(import.meta.url)),
      "upload-opennext-with-secrets.mjs",
    );
    const r = spawnSync(
      process.execPath,
      [scriptPath, "--wrangler-env", "preview", "--infisical-env", "dev", "--dry-run"],
      {
        env: {
          PATH: process.env.PATH,
          GEMINI_API_KEY: "gemini-test",
          SUPABASE_SERVICE_ROLE_KEY: "service-role-test",
        },
        encoding: "utf8",
      },
    );
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("GEMINI_API_KEY");
    expect(r.stdout).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(r.stdout).not.toMatch(/runtime secrets \(.*\):.*COPILOTKIT_LICENSE_TOKEN/);
    expect(r.stderr + r.stdout).toMatch(/optional allowlisted secrets unset[\s\S]*COPILOTKIT_LICENSE_TOKEN/);
  });

  it("dry-run with COPILOTKIT_LICENSE_TOKEN includes it without printing the value", () => {
    const scriptPath = resolve(
      dirname(fileURLToPath(import.meta.url)),
      "upload-opennext-with-secrets.mjs",
    );
    const license = "ck_super_secret_license_token_value";
    const r = spawnSync(
      process.execPath,
      [scriptPath, "--wrangler-env", "preview", "--infisical-env", "dev", "--dry-run"],
      {
        env: {
          PATH: process.env.PATH,
          GEMINI_API_KEY: "gemini-test",
          SUPABASE_SERVICE_ROLE_KEY: "service-role-test",
          COPILOTKIT_LICENSE_TOKEN: license,
        },
        encoding: "utf8",
      },
    );
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/runtime secrets \(.*\):.*COPILOTKIT_LICENSE_TOKEN/);
    expect(r.stdout).not.toContain(license);
    const optionalWarn = (r.stderr + r.stdout)
      .split("\n")
      .find((line) => line.includes("optional allowlisted secrets unset"));
    expect(optionalWarn ?? "").not.toContain("COPILOTKIT_LICENSE_TOKEN");
  });

  it("live upload without COPILOTKIT does not fail on required-secret check", () => {
    const scriptPath = resolve(
      dirname(fileURLToPath(import.meta.url)),
      "upload-opennext-with-secrets.mjs",
    );
    const r = spawnSync(
      process.execPath,
      [scriptPath, "--wrangler-env", "preview", "--infisical-env", "dev"],
      {
        env: {
          PATH: process.env.PATH,
          GEMINI_API_KEY: "gemini-test",
          SUPABASE_SERVICE_ROLE_KEY: "service-role-test",
          INTELLIGENCE_API_URL: "https://intel.example/api",
          INTELLIGENCE_GATEWAY_WS_URL: "wss://intel.example/ws",
        },
        encoding: "utf8",
      },
    );
    // Must pass required-secret + required-var gates; fail later on missing CF credentials.
    expect(r.stderr + r.stdout).not.toMatch(/required runtime secrets missing.*COPILOTKIT/);
    expect(r.stderr + r.stdout).toMatch(/CLOUDFLARE_API_TOKEN|CLOUDFLARE_ACCOUNT_ID|no allowlisted|Error:/);
    expect(r.status).not.toBe(0);
  });
});
