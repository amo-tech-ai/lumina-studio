import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  BUILD_TIME_SECRET_NAMES,
  RUNTIME_SECRET_NAMES,
  assertNoForbiddenSecrets,
  collectRuntimeSecretsFromEnv,
  diffSecretNames,
  runtimeSecretNamesForWranglerEnv,
} from "./cloudflare-secret-allowlist.mjs";
import { parseArgs, redactValues } from "./sync-wrangler-secrets-from-infisical.mjs";

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
    expect(parseArgs(["--wrangler-env", "preview", "--dry-run"])).toEqual({
      wranglerEnv: "preview",
      dryRun: true,
      help: false,
    });
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

  it("redactValues strips quoted strings from wrangler output", () => {
    const raw = 'Uploaded secret GEMINI_API_KEY with value "AIzaSyRealSecretValue"';
    expect(redactValues(raw)).not.toContain("AIzaSyRealSecretValue");
    expect(redactValues(raw)).toContain("[REDACTED]");
  });
});
