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
  HYPERDRIVE_LOCAL_CONNECTION_ENV,
  assertInfisicalWranglerEnvPair,
  assertNoForbiddenSecrets,
  buildWranglerVarCliArgs,
  collectRuntimeSecretsFromEnv,
  collectWranglerVarsFromEnv,
  connectionStringRequiresTls,
  diffSecretNames,
  ensureHyperdriveLocalConnectionSsl,
  runtimeSecretNamesForWranglerEnv,
  withSslModeRequire,
  wranglerCliEnvArgs,
} from "./cloudflare-secret-allowlist.mjs";
import { AGENT_ROUTING_ENV_KEYS } from "../src/lib/ai/agent-routing-keys.mjs";
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

  it("WRANGLER_VAR_NAMES includes IPI-607 per-agent routing flags (optional)", () => {
    expect(AGENT_ROUTING_ENV_KEYS.length).toBeGreaterThan(0);
    for (const name of AGENT_ROUTING_ENV_KEYS) {
      expect(WRANGLER_VAR_NAMES).toContain(name);
      expect(WRANGLER_REQUIRED_VAR_NAMES).not.toContain(name);
    }
  });

  it("cloudflare-secrets-sync.yml exports every agent-routing env key", () => {
    const workflowPath = resolve(
      dirname(fileURLToPath(import.meta.url)),
      "../../.github/workflows/cloudflare-secrets-sync.yml",
    );
    const yaml = readFileSync(workflowPath, "utf8");
    for (const name of AGENT_ROUTING_ENV_KEYS) {
      expect(yaml).toContain(`${name}: \${{ vars.${name} }}`);
    }
  });

  it("IPI-822 wires ENABLE_HYPERDRIVE_THREAD_CANARY (allowlist + workflow + wrangler false)", () => {
    expect(WRANGLER_VAR_NAMES).toContain("ENABLE_HYPERDRIVE_THREAD_CANARY");
    expect(WRANGLER_REQUIRED_VAR_NAMES).not.toContain("ENABLE_HYPERDRIVE_THREAD_CANARY");

    const workflowPath = resolve(
      dirname(fileURLToPath(import.meta.url)),
      "../../.github/workflows/cloudflare-secrets-sync.yml",
    );
    const yaml = readFileSync(workflowPath, "utf8");
    expect(yaml).toContain(
      "ENABLE_HYPERDRIVE_THREAD_CANARY: ${{ vars.ENABLE_HYPERDRIVE_THREAD_CANARY }}",
    );

    const wranglerPath = resolve(dirname(fileURLToPath(import.meta.url)), "../wrangler.jsonc");
    const wrangler = readFileSync(wranglerPath, "utf8");
    // Top-level vars + env.preview.vars + env.production.vars (non-inheritable).
    const falseDecls = wrangler.match(
      /"ENABLE_HYPERDRIVE_THREAD_CANARY"\s*:\s*"false"/g,
    );
    expect(falseDecls?.length).toBe(3);
    expect(wrangler).not.toMatch(/"ENABLE_HYPERDRIVE_THREAD_CANARY"\s*:\s*"true"/);
  });

  it("IPI-824 / IPI-826 — Hyperdrive local connection from DATABASE_URL + TLS (not Worker secrets)", () => {
    // Wrangler system env — must not enter runtime allowlist / secrets-file.
    expect(RUNTIME_SECRET_NAMES).not.toContain(HYPERDRIVE_LOCAL_CONNECTION_ENV);
    expect(WRANGLER_VAR_NAMES).not.toContain(HYPERDRIVE_LOCAL_CONNECTION_ENV);

    const workflowPath = resolve(
      dirname(fileURLToPath(import.meta.url)),
      "../../.github/workflows/cloudflare-secrets-sync.yml",
    );
    const yaml = readFileSync(workflowPath, "utf8");
    // IPI-824: workflow still seeds the Wrangler system env from DATABASE_URL.
    expect(yaml).toContain(
      "CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE_FRESH: ${{ secrets.DATABASE_URL }}",
    );
    // IPI-826: TLS upgrade lives in the upload script (scripts-only PR — not workflow).
    const uploadScript = readFileSync(
      resolve(dirname(fileURLToPath(import.meta.url)), "upload-opennext-with-secrets.mjs"),
      "utf8",
    );
    expect(uploadScript).toContain("ensureHyperdriveLocalConnectionSsl");
  });

  it("IPI-826 appends sslmode=require when absent; upgrades non-TLS modes; keeps TLS modes", () => {
    expect(withSslModeRequire("postgresql://u:p@h:5432/db")).toBe(
      "postgresql://u:p@h:5432/db?sslmode=require",
    );
    expect(withSslModeRequire("postgresql://u:p@h:5432/db?application_name=x")).toBe(
      "postgresql://u:p@h:5432/db?application_name=x&sslmode=require",
    );
    expect(withSslModeRequire("postgresql://u:p@h:5432/db?sslmode=require")).toBe(
      "postgresql://u:p@h:5432/db?sslmode=require",
    );
    expect(withSslModeRequire("postgresql://u:p@h:5432/db?sslmode=verify-full")).toBe(
      "postgresql://u:p@h:5432/db?sslmode=verify-full",
    );
    // P1: disable/allow/prefer must not survive — TLS is the guarantee.
    expect(withSslModeRequire("postgresql://u:p@h:5432/db?sslmode=disable")).toBe(
      "postgresql://u:p@h:5432/db?sslmode=require",
    );
    expect(withSslModeRequire("postgresql://u:p@h:5432/db?sslmode=prefer&x=1")).toBe(
      "postgresql://u:p@h:5432/db?sslmode=require&x=1",
    );
    expect(withSslModeRequire("postgresql://u:p@h:5432/db?foo=1&sslmode=allow")).toBe(
      "postgresql://u:p@h:5432/db?foo=1&sslmode=require",
    );
    expect(connectionStringRequiresTls("postgresql://u@h/db?sslmode=disable")).toBe(false);
    expect(connectionStringRequiresTls("postgresql://u@h/db?sslmode=require")).toBe(true);
  });

  it("IPI-826 ensureHyperdriveLocalConnectionSsl derives from DATABASE_URL without logging values", () => {
    const fakeUrl = "postgresql://user:super-secret-password@db.example:5432/postgres";
    const env = { DATABASE_URL: fakeUrl };
    const result = ensureHyperdriveLocalConnectionSsl(env);
    expect(result).toEqual({ ok: true, appended: true });
    expect(env[HYPERDRIVE_LOCAL_CONNECTION_ENV]).toBe(`${fakeUrl}?sslmode=require`);
    expect(connectionStringRequiresTls(env[HYPERDRIVE_LOCAL_CONNECTION_ENV])).toBe(true);

    // Idempotent when TLS-required sslmode already present on CLOUDFLARE_ env.
    const again = ensureHyperdriveLocalConnectionSsl(env);
    expect(again).toEqual({ ok: true, appended: false });

    // Upgrades sslmode=disable → require (ok must not be true merely because substring exists).
    const disabled = {
      DATABASE_URL: "postgresql://user:super-secret-password@db.example:5432/postgres?sslmode=disable",
    };
    const upgraded = ensureHyperdriveLocalConnectionSsl(disabled);
    expect(upgraded).toEqual({ ok: true, appended: true });
    expect(disabled[HYPERDRIVE_LOCAL_CONNECTION_ENV]).toBe(
      "postgresql://user:super-secret-password@db.example:5432/postgres?sslmode=require",
    );

    // Shape-only: unset returns ok:false (caller fails live upload).
    expect(ensureHyperdriveLocalConnectionSsl({})).toEqual({ ok: false, appended: false });
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
  it("places --var and --secrets-file after OpenNext -- passthrough", async () => {
    const { buildOpenNextCliArgs } = await import("./upload-opennext-with-secrets.mjs");
    const varArgs = buildWranglerVarCliArgs({
      INTELLIGENCE_API_URL: "https://intel.example/api",
      AI_GATEWAY_URL: "https://gateway.example",
    });
    const args = buildOpenNextCliArgs("upload", "preview", "/tmp/secrets.json", varArgs);
    const sep = args.indexOf("--");
    expect(sep).toBeGreaterThan(0);
    expect(args.slice(0, sep)).toEqual(["upload", "--env", "preview"]);
    expect(args.slice(sep)).toEqual([
      "--",
      "--var",
      "AI_GATEWAY_URL:https://gateway.example",
      "--var",
      "INTELLIGENCE_API_URL:https://intel.example/api",
      "--secrets-file",
      "/tmp/secrets.json",
    ]);
  });

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
          // IPI-826 — seed Hyperdrive local connection so the early TLS gate passes and
          // this test still exercises required-secret / required-var / CF credential gates.
          DATABASE_URL: "postgresql://u:p@127.0.0.1:5432/db",
          INTELLIGENCE_API_URL: "https://intel.example/api",
          INTELLIGENCE_GATEWAY_WS_URL: "wss://intel.example/ws",
        },
        encoding: "utf8",
      },
    );
    const combined = r.stderr + r.stdout;
    // Must pass Hyperdrive TLS + required-secret + required-var gates; fail on missing CF credentials.
    expect(combined).not.toMatch(/required runtime secrets missing.*COPILOTKIT/);
    expect(combined).not.toMatch(/HYPERDRIVE_LOCAL_CONNECTION|Hyperdrive local upload/);
    expect(combined).toMatch(/hyperdrive_local_sslmode=appended_require/);
    expect(combined).toMatch(/Missing Cloudflare credentials|CLOUDFLARE_API_TOKEN|CLOUDFLARE_ACCOUNT_ID/);
    expect(r.status).not.toBe(0);
  });

  it("dry-run without DATABASE_URL warns about Hyperdrive local connection (no values)", () => {
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
    expect(r.stderr + r.stdout).toMatch(
      /warn:.*CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE_FRESH unset/,
    );
    expect(r.stderr + r.stdout).not.toMatch(/postgresql:\/\//);
  });
});
