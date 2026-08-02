/**
 * IPI-914 · CF-DEPLOY-031 — tests for scripts/check-build-env.mjs.
 */

import { describe, expect, it } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { BUILD_TIME_SECRET_NAMES } from "./cloudflare-secret-allowlist.mjs";
import {
  REQUIRED_BUILD_ENV_NAMES,
  WARN_BUILD_ENV_ITEMS,
  parseEnvFile,
  loadBuildEnv,
  checkBuildEnv,
  formatBuildEnvReport,
} from "./check-build-env.mjs";

const scriptPath = resolve(import.meta.dirname, "check-build-env.mjs");

function tempEnvFile(content) {
  const dir = mkdtempSync(join(tmpdir(), "check-build-env-"));
  const path = join(dir, ".env.local");
  writeFileSync(path, content);
  return path;
}

describe("parseEnvFile", () => {
  it("parses KEY=VALUE lines", () => {
    expect(parseEnvFile("FOO=bar\nBAZ=qux\n")).toEqual({ FOO: "bar", BAZ: "qux" });
  });

  it("skips blank lines and comments", () => {
    expect(parseEnvFile("# comment\n\nFOO=bar\n# trailing comment")).toEqual({
      FOO: "bar",
    });
  });

  it("accepts an optional `export ` prefix", () => {
    expect(parseEnvFile("export FOO=bar\nexport BAR=qux")).toEqual({
      FOO: "bar",
      BAR: "qux",
    });
  });

  it("strips surrounding quotes", () => {
    expect(parseEnvFile('FOO="bar"\nBAZ=\'qux\'')).toEqual({
      FOO: "bar",
      BAZ: "qux",
    });
  });

  it("does not interpolate variables", () => {
    expect(parseEnvFile("A=x\nB=$A")).toEqual({ A: "x", B: "$A" });
  });

  it("handles CRLF line endings", () => {
    expect(parseEnvFile("FOO=bar\r\nBAZ=qux\r\n")).toEqual({
      FOO: "bar",
      BAZ: "qux",
    });
  });
});

describe("loadBuildEnv", () => {
  it("reads the file and overlays process.env (process env wins)", () => {
    const filePath = tempEnvFile("NEXT_PUBLIC_SUPABASE_URL=file-value\n");
    const { merged } = loadBuildEnv({
      env: { NEXT_PUBLIC_SUPABASE_URL: "real-value" },
      envFile: filePath,
    });
    expect(merged.NEXT_PUBLIC_SUPABASE_URL).toBe("real-value");
  });

  it("returns values from the file when process.env does not set them", () => {
    const filePath = tempEnvFile("NEXT_PUBLIC_SUPABASE_ANON_KEY=anon-key\n");
    const { merged } = loadBuildEnv({ env: {}, envFile: filePath });
    expect(merged.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe("anon-key");
  });

  it("treats a missing file as an empty env", () => {
    const { merged, filePath } = loadBuildEnv({
      env: {},
      envFile: join(tmpdir(), "does-not-exist.env"),
    });
    expect(merged).toEqual({});
    expect(filePath).toBeNull();
  });
});

describe("checkBuildEnv", () => {
  it("passes when required names are present", () => {
    const result = checkBuildEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
    });
    expect(result.ok).toBe(true);
    expect(result.missingRequired).toEqual([]);
  });

  it("fails and lists missing required names", () => {
    const result = checkBuildEnv({});
    expect(result.ok).toBe(false);
    expect(result.missingRequired).toEqual([
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ]);
  });

  it("treats empty-string values as missing", () => {
    const result = checkBuildEnv({
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "  ",
    });
    expect(result.ok).toBe(false);
    expect(result.missingRequired).toHaveLength(2);
  });

  it("warns (but passes) when optional env is absent", () => {
    const result = checkBuildEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
    });
    expect(result.ok).toBe(true);
    const warned = result.warnings.map((w) => w.name);
    expect(warned).toContain("NEXT_PUBLIC_MARKETING_CHAT_ENABLED");
    expect(warned).toContain("NEXT_PUBLIC_SITE_URL");
    expect(result.warnings.every((w) => w.hint.length > 0)).toBe(true);
  });

  it("does not warn for cloudinary when a server-side fallback is present", () => {
    const result = checkBuildEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      CLOUDINARY_CLOUD_NAME: "dzqy2ixl0",
      CLOUDINARY_API_KEY: "key",
    });
    const warned = result.warnings.map((w) => w.name);
    expect(warned).not.toContain("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");
    expect(warned).not.toContain("NEXT_PUBLIC_CLOUDINARY_API_KEY");
  });

  it("keeps required names inside the build-time secret allowlist", () => {
    for (const name of REQUIRED_BUILD_ENV_NAMES) {
      expect(BUILD_TIME_SECRET_NAMES).toContain(name);
    }
  });

  it("keeps warn items and required names disjoint", () => {
    const required = new Set(REQUIRED_BUILD_ENV_NAMES);
    for (const item of WARN_BUILD_ENV_ITEMS) {
      expect(required.has(item.name)).toBe(false);
    }
  });
});

describe("CLI integration", () => {
  function runCli(envFile) {
    return spawnSync(process.execPath, [scriptPath], {
      env: { ...process.env, BUILD_ENV_FILE: envFile },
      encoding: "utf8",
    });
  }

  it("exits 0 when required env is present and prints no values", () => {
    const envFile = tempEnvFile(
      [
        "NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY=secret-anon-key",
        "",
      ].join("\n"),
    );
    const result = runCli(envFile);
    expect(result.status).toBe(0);
    expect(result.stdout).not.toContain("secret-anon-key");
  });

  it("exits 1 and names the missing required vars when absent", () => {
    const envFile = tempEnvFile("# empty\n");
    const result = runCli(envFile);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(result.stderr).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  });

  it("warns about optional env without failing the deploy", () => {
    const envFile = tempEnvFile(
      [
        "NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY=anon-key",
        "",
      ].join("\n"),
    );
    const result = runCli(envFile);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("NEXT_PUBLIC_MARKETING_CHAT_ENABLED");
  });
});

describe("formatBuildEnvReport", () => {
  it("renders a pass message", () => {
    const text = formatBuildEnvReport({ ok: true, missingRequired: [], warnings: [] });
    expect(text).toContain("OK");
  });

  it("renders missing names on failure", () => {
    const text = formatBuildEnvReport({
      ok: false,
      missingRequired: ["NEXT_PUBLIC_SUPABASE_URL"],
      warnings: [],
    });
    expect(text).toContain("FAIL");
    expect(text).toContain("NEXT_PUBLIC_SUPABASE_URL");
  });
});
