#!/usr/bin/env node
/**
 * IPI-665 · SB-CI-001 / IPI-673 · SB-CI-001b — Ledger + pending-migration validation.
 *
 * Compares local vs remote migration *timestamps* via
 * `supabase migration list --linked --output-format json`.
 * Does NOT prove SQL byte-equality with the live schema.
 *
 * Modes:
 *   PR (default when GITHUB_BASE_REF / GITHUB_BASE_SHA set, or --pr):
 *     - Fail on remote-only versions (missing local files)
 *     - Allow local-only versions only if they are *added* by this PR
 *       (git diff --name-status base...HEAD -- supabase/migrations → status A)
 *     - Fail if any existing migration is Modified / Deleted / Renamed
 *     - `db push --linked --dry-run` pending set must match those
 *       PR-introduced (added) versions
 *   main (--main, or GITHUB_REF_NAME=main):
 *     - Fail unless local/remote sets are identical
 *     - Dry-run must report up to date (no pending)
 *
 * Usage:
 *   node scripts/check-supabase-migration-drift.mjs [--pr|--main] [--base <sha>]
 *   node scripts/check-supabase-migration-drift.mjs --self-check
 */
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

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

/** Capture stdout/stderr and exit status without exiting the process. */
function runCapture(cmd, cmdArgs) {
  try {
    const out = execFileSync(cmd, cmdArgs, {
      cwd: root,
      encoding: "utf8",
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { ok: true, out, status: 0 };
  } catch (err) {
    return {
      ok: false,
      out: `${err.stdout ?? ""}${err.stderr ?? ""}`,
      status: err.status ?? 1,
    };
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

function mapMigrationRows(rows) {
  return rows.map((r) => ({
    local: r.local ? String(r.local) : "",
    remote: r.remote ? String(r.remote) : "",
  }));
}

/** Index of a JSON array start, skipping log tags like `[INFO]` / `[debug]`. */
function findJsonArrayStart(raw) {
  // Array of objects: `[{...`  or empty array: `[]` (optional whitespace).
  const re = /\[\s*(?:\{|\])/g;
  const m = re.exec(raw);
  return m ? m.index : -1;
}

/** Try closing-bracket positions from right to left until JSON.parse succeeds. */
function parseJsonSlice(raw, start, closeChar) {
  let end = raw.lastIndexOf(closeChar);
  let lastErr;
  while (end >= start) {
    try {
      return JSON.parse(raw.slice(start, end + 1));
    } catch (err) {
      lastErr = err;
      end = raw.lastIndexOf(closeChar, end - 1);
    }
  }
  throw lastErr ?? new Error("Could not parse migration list JSON");
}

function parseMigrationListJson(raw) {
  const envelopeStart = raw.indexOf('{"migrations"');
  if (envelopeStart >= 0) {
    try {
      const parsed = parseJsonSlice(raw, envelopeStart, "}");
      const rows = parsed.migrations;
      if (!Array.isArray(rows)) throw new Error("migration list JSON missing migrations array");
      return mapMigrationRows(rows);
    } catch (err) {
      throw new Error(`Could not parse migration list JSON envelope: ${err.message}`);
    }
  }

  // Bare array (or log-prefixed array). Never use raw indexOf("[") — that matches `[INFO]`.
  const arrayStart = findJsonArrayStart(raw);
  if (arrayStart >= 0) {
    try {
      const rows = parseJsonSlice(raw, arrayStart, "]");
      if (!Array.isArray(rows)) throw new Error("migration list JSON missing migrations array");
      return mapMigrationRows(rows);
    } catch (err) {
      throw new Error(`Could not parse migration list JSON array: ${err.message}`);
    }
  }

  throw new Error("Could not parse migration list JSON");
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

function migrationNameStatusDiff() {
  return run("git", ["diff", "--name-status", `${baseRef}...HEAD`, "--", "supabase/migrations"], {
    allowFail: true,
  });
}

/** Fail closed if an already-tracked migration file is edited, deleted, or renamed. */
function assertNoMutationOfExistingMigrations() {
  const violations = [];
  for (const line of migrationNameStatusDiff().split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split("\t");
    const status = parts[0] ?? "";
    const code = status.charAt(0);
    // Only newly Added files are allowed. M/D/R/C/T rewrite history.
    if (code === "A") continue;
    if (code === "M" || code === "D" || code === "R" || code === "C" || code === "T") {
      violations.push(trimmed);
    }
  }
  if (violations.length) {
    console.error(
      "PR: existing migration files must not be modified, deleted, or renamed (add a new timestamped file instead):",
    );
    for (const v of violations) console.error(`  - ${v}`);
    process.exit(1);
  }
}

function prIntroducedVersions() {
  const versions = new Set();
  for (const line of migrationNameStatusDiff().split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split("\t");
    const status = parts[0] ?? "";
    // Only Added files count as PR-introduced. Modified must already have failed above.
    if (!status.startsWith("A")) continue;
    const base = (parts[1] ?? "").split("/").pop();
    if (!base?.endsWith(".sql")) continue;
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
    // Upstream CLI style: "Would push migration 20230108110451_this_should_fail.sql..."
    const m3 = /Would push migration\s+(\d{14}_[\w.-]+\.sql)/i.exec(line);
    if (m3) pending.push(m3[1]);
  }
  return [...new Set(pending)];
}

function dryRunIsUsable(dry) {
  // Exit 0 is always trusted. Non-zero is only accepted when the CLI clearly
  // reported "up to date" — do NOT treat a parsed pending filename list as
  // success on failure (CLI may print migrations then die on auth/connection).
  if (dry.ok) return true;
  if (/Remote database is up to date/i.test(dry.out)) return true;
  return false;
}

if (args.includes("--self-check")) {
  const envelope = parseMigrationListJson(
    'noise\n{"migrations":[{"local":"1","remote":"1"}],"message":"ok"}\n',
  );
  assert.equal(envelope.length, 1);
  assert.equal(envelope[0].local, "1");

  const bare = parseMigrationListJson('[{"local":"1","remote":"1"},{"local":"2","remote":""}]');
  assert.equal(bare.length, 2);
  assert.equal(bare[1].local, "2");

  const logPrefixed = parseMigrationListJson(
    '[INFO] Connecting...\n[{"local":"1","remote":"1"}]\n',
  );
  assert.equal(logPrefixed.length, 1);
  assert.equal(logPrefixed[0].local, "1");

  const debugPrefixed = parseMigrationListJson(
    'noise [debug] foo\n[{"local":"9","remote":""}]\n',
  );
  assert.equal(debugPrefixed[0].local, "9");

  const trailingBracket = parseMigrationListJson(
    '[{"local":"1","remote":"1"}]\n[INFO] Done]\n',
  );
  assert.equal(trailingBracket[0].local, "1");

  const trailingBrace = parseMigrationListJson(
    '{"migrations":[{"local":"1","remote":"1"}],"message":"ok"}\nlog: done}\n',
  );
  assert.equal(trailingBrace[0].local, "1");

  const empty = parseMigrationListJson("[]");
  assert.equal(empty.length, 0);

  const would = parseDryRunPending(
    "Would push migration 20230108110451_this_should_fail.sql...\nRemote database is up to date\n",
  );
  assert.deepEqual(would, []); // up-to-date short-circuits

  const wouldOnly = parseDryRunPending(
    "Would push migration 20230108110451_this_should_fail.sql...\n",
  );
  assert.deepEqual(wouldOnly, ["20230108110451_this_should_fail.sql"]);

  assert.equal(dryRunIsUsable({ ok: false, out: "auth failed", status: 1 }), false);
  // Pending filenames on a failed dry-run must NOT count as usable.
  assert.equal(
    dryRunIsUsable({
      ok: false,
      out: "Would push migration 20230108110451_x.sql...\n",
      status: 1,
    }),
    false,
  );
  assert.equal(
    dryRunIsUsable({
      ok: false,
      out: "Remote database is up to date\n",
      status: 1,
    }),
    true,
  );
  assert.equal(
    dryRunIsUsable({
      ok: true,
      out: "Would push migration 20230108110451_x.sql...\n",
      status: 0,
    }),
    true,
  );

  console.log("ok: self-check");
  process.exit(0);
}

console.log(`check-supabase-migration-drift: mode=${isMain ? "main" : "pr"} base=${baseRef}`);

// Prefer the PATH `supabase` binary (CI: supabase/setup-cli pin). Do not use
// `npx supabase` — that can download an unpinned npm package and bypass the pin.
const listRaw = run("supabase", ["migration", "list", "--linked", "--output-format", "json"]);
const { remoteOnly, localOnly } = classify(parseMigrationListJson(listRaw));

if (remoteOnly.length) {
  console.error("Remote-only migrations (missing local files):");
  for (const v of remoteOnly) console.error(`  - ${v}`);
  process.exit(1);
}

const dry = runCapture("supabase", ["db", "push", "--linked", "--dry-run", "--yes"]);
if (!dryRunIsUsable(dry)) {
  console.error("db push --dry-run failed without parseable success or pending migrations:");
  console.error(dry.out.trim() || `(exit ${dry.status})`);
  process.exit(dry.status || 1);
}
const dryRaw = dry.out;
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

assertNoMutationOfExistingMigrations();
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
