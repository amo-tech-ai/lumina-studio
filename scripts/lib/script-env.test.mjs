import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  firstEnv,
  loadEnvFile,
  parseEnvLine,
  repoRoot,
  resolveSupabaseEnv,
} from "./script-env.mjs";

function writeTempEnv(contents) {
  const dir = mkdtempSync(join(tmpdir(), "script-env-"));
  const path = join(dir, ".env.local");
  writeFileSync(path, contents);
  return path;
}

test("parseEnvLine skips blanks and comments", () => {
  assert.equal(parseEnvLine(""), undefined);
  assert.equal(parseEnvLine("   "), undefined);
  assert.equal(parseEnvLine("# NEXT_PUBLIC_SUPABASE_URL=x"), undefined);
  assert.equal(parseEnvLine("NO_EQUALS_SIGN"), undefined);
});

test("parseEnvLine strips surrounding quotes but keeps inner ones", () => {
  assert.deepEqual(parseEnvLine("A=1"), { key: "A", value: "1" });
  assert.deepEqual(parseEnvLine('A="1"'), { key: "A", value: "1" });
  assert.deepEqual(parseEnvLine("A='1'"), { key: "A", value: "1" });
  assert.deepEqual(parseEnvLine('A="it\'s"'), { key: "A", value: "it's" });
  assert.deepEqual(parseEnvLine('A="'), { key: "A", value: '"' });
});

test("parseEnvLine keeps '=' inside values (JWTs, connection strings)", () => {
  assert.deepEqual(parseEnvLine("DATABASE_URL=postgres://u:p@h/db?a=b"), {
    key: "DATABASE_URL",
    value: "postgres://u:p@h/db?a=b",
  });
});

test("loadEnvFile does not overwrite existing values", () => {
  const path = writeTempEnv("A=from-file\nB=from-file\n");
  const env = { A: "from-process" };
  loadEnvFile(path, env);
  assert.equal(env.A, "from-process");
  assert.equal(env.B, "from-file");
});

test("loadEnvFile ignores a missing file", () => {
  const env = {};
  loadEnvFile(join(tmpdir(), "definitely-absent.env"), env);
  assert.deepEqual(env, {});
});

test("firstEnv returns the first non-empty alias", () => {
  const env = { A: "", B: "b", C: "c" };
  assert.equal(firstEnv(["A", "B", "C"], env), "b");
  assert.equal(firstEnv(["MISSING"], env), undefined);
});

test("resolveSupabaseEnv prefers NEXT_PUBLIC over NEXT and VITE aliases", () => {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: "next-public",
    NEXT_SUPABASE_URL: "next",
    VITE_SUPABASE_URL: "vite",
    VITE_SUPABASE_PUBLISHABLE_KEY: "vite-anon",
    SUPABASE_SERVICE_ROLE_KEY: "service",
    DATABASE_URL: "postgres://db",
  };
  assert.deepEqual(resolveSupabaseEnv(env), {
    url: "next-public",
    anonKey: "vite-anon",
    serviceRoleKey: "service",
    dbUrl: "postgres://db",
  });
});

test("resolveSupabaseEnv prefers SUPABASE_DB_URL over DATABASE_URL", () => {
  const env = { SUPABASE_DB_URL: "postgres://direct", DATABASE_URL: "postgres://ci" };
  assert.equal(resolveSupabaseEnv(env).dbUrl, "postgres://direct");
});

test("resolveSupabaseEnv never aliases the service-role key", () => {
  const env = {
    NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: "leaked",
    VITE_SUPABASE_SERVICE_ROLE_KEY: "leaked",
  };
  assert.equal(resolveSupabaseEnv(env).serviceRoleKey, undefined);
});

test("repoRoot points at the repo, not scripts/lib", () => {
  assert.ok(!repoRoot.endsWith("lib"));
});
