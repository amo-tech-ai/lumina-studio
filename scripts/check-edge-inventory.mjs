#!/usr/bin/env node
/**
 * IPI-689 · SB-EDGE-006 — Edge inventory gate (repo ↔ config.toml ↔ remote).
 *
 * Modes:
 *   (default)     Secretless: supabase/functions dirs ↔ config.toml [functions.*] verify_jwt
 *   --remote      Also compare against Management API / CLI inventory JSON
 *   --self-check  Prove fake local + fake remote mismatches fail; real inventory passes
 *
 * Never deploys. Never uses --prune.
 *
 * Usage:
 *   node scripts/check-edge-inventory.mjs
 *   node scripts/check-edge-inventory.mjs --remote --remote-json /tmp/functions.json
 *   node scripts/check-edge-inventory.mjs --self-check
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const funcsDir = join(root, "supabase", "functions");
const configPath = join(root, "supabase", "config.toml");
const exceptionsPath = join(root, "supabase", "edge-inventory-exceptions.json");

const EXCLUDE_DIRS = new Set(["_shared", "tests", "node_modules", ".deno"]);

const args = process.argv.slice(2);
const wantRemote = args.includes("--remote");
const wantSelfCheck = args.includes("--self-check");

function flagValue(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

/** @typedef {{ name: string, verifyJwt: boolean }} ConfigFn */
/** @typedef {{ slug: string, status: string, verifyJwt: boolean | null }} RemoteFn */
/** @typedef {{
 *   remoteOnlyAllowed?: string[],
 *   localOnlyAllowed?: string[],
 *   verifyJwtMismatchAllowed?: string[],
 * }} Exceptions */

export function listRepoFunctionDirs(dir = funcsDir) {
  if (!existsSync(dir)) {
    throw new Error(`missing functions dir: ${dir}`);
  }
  return readdirSync(dir)
    .filter((name) => {
      if (EXCLUDE_DIRS.has(name) || name.startsWith(".")) return false;
      return statSync(join(dir, name)).isDirectory();
    })
    .sort();
}

/**
 * Parse [functions.<name>] + verify_jwt from config.toml (no TOML dependency).
 * Missing verify_jwt defaults to true (Supabase platform default).
 * @returns {Map<string, boolean>}
 */
export function parseConfigVerifyJwt(tomlText) {
  /** @type {Map<string, boolean>} */
  const out = new Map();
  let current = null;
  for (const raw of tomlText.split("\n")) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const section = /^\[functions\.([A-Za-z0-9_-]+)\]$/.exec(line);
    if (section) {
      current = section[1];
      if (!out.has(current)) out.set(current, true);
      continue;
    }
    if (current == null) continue;
    const jwt = /^verify_jwt\s*=\s*(true|false)\s*$/.exec(line);
    if (jwt) {
      out.set(current, jwt[1] === "true");
    }
  }
  return out;
}

/** @returns {Exceptions} */
export function loadExceptions(path = exceptionsPath) {
  if (!existsSync(path)) {
    return {
      remoteOnlyAllowed: [],
      localOnlyAllowed: [],
      verifyJwtMismatchAllowed: [],
    };
  }
  const raw = JSON.parse(readFileSync(path, "utf8"));
  return {
    remoteOnlyAllowed: [...(raw.remoteOnlyAllowed ?? [])].sort(),
    localOnlyAllowed: [...(raw.localOnlyAllowed ?? [])].sort(),
    verifyJwtMismatchAllowed: [...(raw.verifyJwtMismatchAllowed ?? [])].sort(),
  };
}

/**
 * Accept CLI / Management API JSON: bare array, or { functions: [...] }.
 * @returns {RemoteFn[]}
 */
export function parseRemoteFunctionsJson(raw) {
  const text = String(raw).trim();
  if (!text) throw new Error("empty remote functions JSON");
  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    throw new Error(`invalid remote functions JSON: ${err.message}`);
  }
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.functions)
      ? data.functions
      : null;
  if (!list) {
    throw new Error("remote JSON must be an array or { functions: [...] }");
  }
  return list.map((fn, i) => {
    const slug = fn?.slug ?? fn?.name;
    if (!slug || typeof slug !== "string") {
      throw new Error(`remote function[${i}] missing slug`);
    }
    const status = String(fn?.status ?? "ACTIVE").toUpperCase();
    let verifyJwt = null;
    if (typeof fn?.verify_jwt === "boolean") verifyJwt = fn.verify_jwt;
    else if (typeof fn?.verifyJwt === "boolean") verifyJwt = fn.verifyJwt;
    return { slug, status, verifyJwt };
  });
}

/**
 * @param {string[]} repoDirs
 * @param {Map<string, boolean>} configMap
 * @param {Exceptions} exceptions
 */
export function diffLocal(repoDirs, configMap, exceptions) {
  const repo = new Set(repoDirs);
  const config = new Set(configMap.keys());
  const localOnlyAllow = new Set(exceptions.localOnlyAllowed ?? []);

  const dirsMissingConfig = [...repo]
    .filter((n) => !config.has(n) && !localOnlyAllow.has(n))
    .sort();
  // Orphan [functions.*] without a directory — allowlisted via localOnlyAllowed.
  const orphanConfig = [...config]
    .filter((n) => !repo.has(n) && !localOnlyAllow.has(n))
    .sort();

  return { dirsMissingConfig, orphanConfig };
}

/**
 * @param {string[]} repoDirs
 * @param {Map<string, boolean>} configMap
 * @param {RemoteFn[]} remote
 * @param {Exceptions} exceptions
 */
export function diffRemote(repoDirs, configMap, remote, exceptions) {
  const active = remote.filter((f) => f.status === "ACTIVE");
  const remoteSlugs = new Set(active.map((f) => f.slug));
  const repo = new Set(repoDirs);
  const config = new Set(configMap.keys());
  const remoteOnlyAllow = new Set(exceptions.remoteOnlyAllowed ?? []);
  const localOnlyAllow = new Set(exceptions.localOnlyAllowed ?? []);
  const jwtAllow = new Set(exceptions.verifyJwtMismatchAllowed ?? []);

  const remoteOnly = [...remoteSlugs]
    .filter((s) => !repo.has(s) && !config.has(s) && !remoteOnlyAllow.has(s))
    .sort();
  const localOnly = [...repo]
    .filter((s) => !remoteSlugs.has(s) && !localOnlyAllow.has(s))
    .sort();
  const configNotRemote = [...config]
    .filter((s) => !remoteSlugs.has(s) && !localOnlyAllow.has(s))
    .sort();

  /** @type {{ slug: string, config: boolean, remote: boolean | null }[]} */
  const verifyJwtMismatch = [];
  for (const fn of active) {
    if (!config.has(fn.slug)) continue;
    if (fn.verifyJwt == null) continue;
    const expected = configMap.get(fn.slug);
    if (expected !== fn.verifyJwt && !jwtAllow.has(fn.slug)) {
      verifyJwtMismatch.push({
        slug: fn.slug,
        config: expected,
        remote: fn.verifyJwt,
      });
    }
  }
  verifyJwtMismatch.sort((a, b) => a.slug.localeCompare(b.slug));

  return { remoteOnly, localOnly, configNotRemote, verifyJwtMismatch, activeCount: active.length };
}

/**
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function checkLocalInventory({
  repoDirs = listRepoFunctionDirs(),
  configText = readFileSync(configPath, "utf8"),
  exceptions = loadExceptions(),
} = {}) {
  const configMap = parseConfigVerifyJwt(configText);
  const { dirsMissingConfig, orphanConfig } = diffLocal(repoDirs, configMap, exceptions);
  /** @type {string[]} */
  const errors = [];
  if (dirsMissingConfig.length) {
    errors.push(
      `directories without [functions.*] in config.toml: ${dirsMissingConfig.join(", ")}`,
    );
  }
  if (orphanConfig.length) {
    errors.push(
      `config.toml [functions.*] without directory: ${orphanConfig.join(", ")}`,
    );
  }
  return {
    ok: errors.length === 0,
    errors,
    repoDirs,
    configMap,
    count: repoDirs.length,
  };
}

/**
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function checkRemoteInventory({
  repoDirs = listRepoFunctionDirs(),
  configText = readFileSync(configPath, "utf8"),
  remoteJson,
  exceptions = loadExceptions(),
} = {}) {
  const local = checkLocalInventory({ repoDirs, configText, exceptions });
  const configMap = local.configMap;
  const remote = parseRemoteFunctionsJson(remoteJson);
  const diff = diffRemote(repoDirs, configMap, remote, exceptions);
  /** @type {string[]} */
  const errors = [...local.errors];
  if (diff.remoteOnly.length) {
    errors.push(`ACTIVE remote-only (not in repo/config): ${diff.remoteOnly.join(", ")}`);
  }
  if (diff.localOnly.length) {
    errors.push(`repo dirs missing on remote ACTIVE: ${diff.localOnly.join(", ")}`);
  }
  if (diff.configNotRemote.length) {
    errors.push(
      `config.toml entries not ACTIVE remotely: ${diff.configNotRemote.join(", ")}`,
    );
  }
  for (const m of diff.verifyJwtMismatch) {
    errors.push(
      `verify_jwt mismatch for ${m.slug}: config=${m.config} remote=${m.remote}`,
    );
  }
  return {
    ok: errors.length === 0,
    errors,
    activeCount: diff.activeCount,
    count: repoDirs.length,
  };
}

function selfCheck() {
  const real = checkLocalInventory();
  assert.equal(real.ok, true, `real inventory should pass: ${real.errors.join("; ")}`);
  assert.ok(real.count >= 7, `expected ≥7 local functions, got ${real.count}`);

  // Fake local: directory without config block
  const fakeLocalDirs = [...real.repoDirs, "__fake_local_fn__"];
  const fakeLocal = checkLocalInventory({
    repoDirs: fakeLocalDirs,
    configText: readFileSync(configPath, "utf8"),
  });
  assert.equal(fakeLocal.ok, false, "fake local dir mismatch must fail");
  assert.match(fakeLocal.errors.join("\n"), /__fake_local_fn__/);

  // Fake local: config without directory
  const fakeConfigText =
    readFileSync(configPath, "utf8") +
    "\n[functions.__fake_config_fn__]\nverify_jwt = true\n";
  const fakeConfig = checkLocalInventory({
    repoDirs: real.repoDirs,
    configText: fakeConfigText,
  });
  assert.equal(fakeConfig.ok, false, "fake config orphan must fail");
  assert.match(fakeConfig.errors.join("\n"), /__fake_config_fn__/);

  // Fake remote: ACTIVE slug not in repo
  const baselineRemote = real.repoDirs.map((slug) => ({
    slug,
    status: "ACTIVE",
    verify_jwt: real.configMap.get(slug) ?? true,
  }));
  const fakeRemote = checkRemoteInventory({
    repoDirs: real.repoDirs,
    configText: readFileSync(configPath, "utf8"),
    remoteJson: JSON.stringify([
      ...baselineRemote,
      { slug: "__fake_remote_fn__", status: "ACTIVE", verify_jwt: true },
    ]),
  });
  assert.equal(fakeRemote.ok, false, "fake remote mismatch must fail");
  assert.match(fakeRemote.errors.join("\n"), /__fake_remote_fn__/);

  // Fake verify_jwt mismatch
  const jwtMismatchRemote = real.repoDirs.map((slug) => ({
    slug,
    status: "ACTIVE",
    verify_jwt: slug === "health" ? true : (real.configMap.get(slug) ?? true),
  }));
  const jwtFail = checkRemoteInventory({
    repoDirs: real.repoDirs,
    configText: readFileSync(configPath, "utf8"),
    remoteJson: JSON.stringify(jwtMismatchRemote),
  });
  assert.equal(jwtFail.ok, false, "verify_jwt mismatch must fail");
  assert.match(jwtFail.errors.join("\n"), /verify_jwt mismatch for health/);

  // Aligned remote fixture passes
  const aligned = checkRemoteInventory({
    repoDirs: real.repoDirs,
    configText: readFileSync(configPath, "utf8"),
    remoteJson: JSON.stringify(baselineRemote),
  });
  assert.equal(aligned.ok, true, `aligned remote must pass: ${aligned.errors.join("; ")}`);

  // Exception allowlist swallows known remote-only
  const allowed = checkRemoteInventory({
    repoDirs: real.repoDirs,
    configText: readFileSync(configPath, "utf8"),
    remoteJson: JSON.stringify([
      ...baselineRemote,
      { slug: "__allowed_orphan__", status: "ACTIVE", verify_jwt: false },
    ]),
    exceptions: {
      remoteOnlyAllowed: ["__allowed_orphan__"],
      localOnlyAllowed: [],
      verifyJwtMismatchAllowed: [],
    },
  });
  assert.equal(allowed.ok, true, `allowlist must pass: ${allowed.errors.join("; ")}`);

  // REMOVED remote entries ignored
  const removedOk = checkRemoteInventory({
    repoDirs: real.repoDirs,
    configText: readFileSync(configPath, "utf8"),
    remoteJson: JSON.stringify([
      ...baselineRemote,
      { slug: "legacy-gone", status: "REMOVED", verify_jwt: false },
    ]),
  });
  assert.equal(removedOk.ok, true, `REMOVED must be ignored: ${removedOk.errors.join("; ")}`);

  console.log(
    `ok: self-check (local=${real.count} functions; fake local/remote/jwt mismatches fail)`,
  );
  process.exit(0);
}

function main() {
  if (wantSelfCheck) {
    selfCheck();
    return;
  }

  if (wantRemote) {
    const jsonPath = flagValue("--remote-json");
    const remoteJson = jsonPath
      ? readFileSync(jsonPath, "utf8")
      : process.env.EDGE_REMOTE_FUNCTIONS_JSON;
    if (!remoteJson) {
      console.error(
        "FAIL: --remote requires --remote-json <path> or EDGE_REMOTE_FUNCTIONS_JSON",
      );
      process.exit(1);
    }
    const result = checkRemoteInventory({ remoteJson });
    if (!result.ok) {
      console.error("FAIL: edge inventory remote drift");
      for (const e of result.errors) console.error(`  - ${e}`);
      process.exit(1);
    }
    console.log(
      `ok: edge inventory remote aligned (repo=${result.count}, remote ACTIVE=${result.activeCount})`,
    );
    process.exit(0);
  }

  const result = checkLocalInventory();
  if (!result.ok) {
    console.error("FAIL: edge inventory local drift (repo ↔ config.toml)");
    for (const e of result.errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  const jwtSummary = [...result.configMap.entries()]
    .map(([n, v]) => `${n}=${v}`)
    .join(", ");
  console.log(`ok: edge inventory local aligned (${result.count} functions)`);
  console.log(`verify_jwt: ${jwtSummary}`);
  process.exit(0);
}

main();
