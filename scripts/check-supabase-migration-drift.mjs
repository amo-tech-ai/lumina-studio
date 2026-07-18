#!/usr/bin/env node
/**
 * IPI-665 · SB-CI-001 — Ledger + pending-migration validation.
 *
 * Compares local vs remote migration *timestamps* via
 * `supabase migration list --linked --output-format json`.
 * Does NOT prove SQL byte-equality with the live schema.
 *
 * Modes:
 *   PR (default when GITHUB_BASE_REF / GITHUB_BASE_SHA set, or --pr):
 *     - Fail on remote-only versions (missing local files)
 *     - Allow local-only versions only if they are introduced by this PR
 *       (git diff base...HEAD -- supabase/migrations)
 *     - `db push --linked --dry-run` pending set must exactly match those
 *       PR-introduced versions
 *   main (--main, or GITHUB_REF_NAME=main):
 *     - Fail unless local/remote sets are identical
 *     - Dry-run must report up to date (no pending)
 *
 * Usage:
 *   node scripts/check-supabase-migration-drift.mjs [--pr|--main] [--base <sha>]
 */
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = join(root, "supabase", "migrations");

const args = process.argv.slice(2);
function flagValue(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

const forceMain = args.includes("--main");
const forcePr = args.includes("--pr");
const isMain =
  forceMain ||
  (!forcePr &&
    (process.env.GITHUB_REF_NAME === "main" ||
      process.env.GITHUB_REF === "refs/heads/main"));

const baseRef =
  flagValue("--base") ||
  process.env.GITHUB_BASE_SHA ||
  process.env.GITHUB_EVENT_PULL_REQUEST_BASE_SHA ||
  (process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : "origin/main");

function run(cmd, cmdArgs, { allowFail = false } = {}) {
  try {
    return execFileSync(cmd, cmdArgs, {
      cwd: root,
      encoding: "utf8",
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (err) {
    if (allowFail) {
      return `${err.stdout ?? ""}${err.stderr ?? ""}`;
    }
    const out = `${err.stdout ?? ""}${err.stderr ?? ""}`.trim();
    console.error(out || err.message);
    process.exit(err.status ?? 1);
  }
}

function versionFromFilename(name) {
  const m = /^(\d{14})_/.exec(name);
  return m ? m[1] : null;
}

function listLocalFiles() {
  return readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .map((f) => ({ version: versionFromFilename(f), file: f }))
    .filter((r) => r.version);
}

function parseMigrationListJson(raw) {
  // Prefer the root envelope; nested row objects also start with `{`.
  const start = raw.indexOf('{"migrations"');
  const sliceStart = start >= 0 ? start : raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (sliceStart < 0 || end < sliceStart) {
    throw new Error("Could not parse migration list JSON");
  }
  const parsed = JSON.parse(raw.slice(sliceStart, end + 1));
  const rows = parsed.migrations ?? parsed;
  if (!Array.isArray(rows)) {
    throw new Error("migration list JSON missing migrations array");
  }
  return rows.map((r) => ({
    local: r.local ? String(r.local) : "",
    remote: r.remote ? String(r.remote) : "",
  }));
}

function classify(rows) {
  const remoteOnly = [];
  const localOnly = [];
  const both = [];
  for (const { local, remote } of rows) {
    if (local && remote && local === remote) both.push(local);
    else if (local && !remote) localOnly.push(local);
    else if (!local && remote) remoteOnly.push(remote);
    else if (local && remote && local !== remote) {
      // Shouldn't happen with aligned timestamps; treat as both sides of a rename mismatch.
      remoteOnly.push(remote);
      localOnly.push(local);
    }
  }
  return { remoteOnly, localOnly, both };
}

function prIntroducedVersions() {
  const diff = run("git", ["diff", "--name-only", `${baseRef}...HEAD`, "--", "supabase/migrations"], {
    allowFail: true,
  });
  const versions = new Set();
  for (const line of diff.split("\n")) {
    const base = line.trim().split("/").pop();
    if (!base?.endsWith(".sql")) continue;
    // Added or modified migration files count; deleted versions are not "introduced".
    const v = versionFromFilename(base);
    if (v) versions.add(v);
  }
  // Also catch brand-new untracked files on the branch tip via filesystem vs base tree.
  const baseFiles = new Set(
    run("git", ["ls-tree", "-r", "--name-only", baseRef, "supabase/migrations"], { allowFail: true })
      .split("\n")
      .map((l) => l.trim().split("/").pop())
      .filter(Boolean),
  );
  for (const { version, file } of listLocalFiles()) {
    if (!baseFiles.has(file)) versions.add(version);
  }
  return versions;
}

function parseDryRunPending(raw) {
  if (/Remote database is up to date/i.test(raw)) return [];
  const pending = [];
  for (const line of raw.split("\n")) {
    const m = /[•*]\s+(\d{14}_[\w.-]+\.sql)/.exec(line);
    if (m) pending.push(m[1]);
    const m2 = /^\s*(\d{14}_[\w.-]+\.sql)\s*$/.exec(line.trim());
    if (m2) pending.push(m2[1]);
  }
  return [...new Set(pending)];
}

console.log(`check-supabase-migration-drift: mode=${isMain ? "main" : "pr"} base=${baseRef}`);

const listRaw = run("npx", ["supabase", "migration", "list", "--linked", "--output-format", "json"]);
const { remoteOnly, localOnly } = classify(parseMigrationListJson(listRaw));

if (remoteOnly.length) {
  console.error("Remote-only migrations (missing local files):");
  for (const v of remoteOnly) console.error(`  - ${v}`);
  process.exit(1);
}

const dryRaw = run("npx", ["supabase", "db", "push", "--linked", "--dry-run", "--yes"], { allowFail: true });
const pendingFiles = parseDryRunPending(dryRaw);
const pendingVersions = pendingFiles.map((f) => versionFromFilename(f)).filter(Boolean);

if (isMain) {
  if (localOnly.length) {
    console.error("main: local-only migrations (not applied remotely):");
    for (const v of localOnly) console.error(`  - ${v}`);
    process.exit(1);
  }
  if (pendingFiles.length) {
    console.error("main: dry-run shows pending migrations (expected up to date):");
    for (const f of pendingFiles) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log("ok: main ledger aligned; dry-run up to date");
  process.exit(0);
}

const introduced = prIntroducedVersions();
const unexpectedLocal = localOnly.filter((v) => !introduced.has(v));
if (unexpectedLocal.length) {
  console.error("PR: local-only migrations not introduced by this PR:");
  for (const v of unexpectedLocal) console.error(`  - ${v}`);
  process.exit(1);
}

const pendingSet = new Set(pendingVersions);
const surprisePending = pendingVersions.filter((v) => !introduced.has(v));
if (surprisePending.length) {
  console.error("PR: dry-run pending migrations not introduced by this PR:");
  for (const v of surprisePending) console.error(`  - ${v}`);
  console.error("dry-run output:\n", dryRaw.trim());
  process.exit(1);
}

// Every local-only (not yet on remote) version must appear in dry-run pending.
// Introduced versions already applied to remote (both sides) are allowed —
// common when a migration was pushed during implementation before merge.
const missingPending = localOnly.filter((v) => introduced.has(v) && !pendingSet.has(v));
if (missingPending.length) {
  console.error("PR: local-only introduced migrations missing from dry-run pending:");
  for (const v of missingPending) console.error(`  - ${v}`);
  console.error("dry-run output:\n", dryRaw.trim());
  process.exit(1);
}

console.log(
  `ok: PR ledger clean; pending=${[...pendingSet].sort().join(", ") || "none"} introduced=${[...introduced].sort().join(", ") || "none"}`,
);
process.exit(0);
