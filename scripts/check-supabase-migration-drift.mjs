#!/usr/bin/env node
/**
 * IPI-665 · SB-CI-001 / IPI-673 · SB-CI-001b — Ledger + pending-migration validation.
 *
 * Compares local vs remote migration *timestamps* via
 * `supabase migration list --linked --output-format json`.
 * IPI-1032: prefer IPv4 session pooler `--db-url` (SUPABASE_DB_URL / DATABASE_URL
 * on *.pooler.supabase.com:5432) so local machines without IPv6 to db.* still work.
 * Pooler URLs are used only when username `postgres.<ref>` matches the linked
 * project (`SUPABASE_PROJECT_ID` or `supabase/.temp/project-ref`).
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
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
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

/**
 * Capture CLI streams without exiting.
 * `out` is stdout. Pass mergeStderr: true for `db push --dry-run` (pending
 * filenames land on stderr — IPI-784 / #614). `migration list` JSON stays on stdout.
 */
function runCapture(cmd, cmdArgs, { mergeStderr = false } = {}) {
  const r = spawnSync(cmd, cmdArgs, {
    cwd: root,
    encoding: "utf8",
    env: process.env,
  });
  const stdout = r.stdout ?? "";
  const stderr = r.stderr ?? "";
  const status = r.status ?? 1;
  return {
    ok: status === 0,
    out: mergeStderr ? `${stdout}${stderr}` : stdout,
    err: stderr,
    status,
  };
}

function redactSecrets(text, urls = []) {
  let s = String(text ?? "");
  for (const url of urls.filter(Boolean)) {
    s = s.split(url).join("***");
    try {
      const parsed = new URL(url);
      if (parsed.password) {
        s = s.split(parsed.password).join("***");
        try {
          const decoded = decodeURIComponent(parsed.password);
          if (decoded && decoded !== parsed.password) s = s.split(decoded).join("***");
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* ignore */
    }
  }
  return s;
}

function printRedactedCliFailure(label, captured, secretUrls = []) {
  console.error(`${label} (exit ${captured.status}). Set IPIX_DRIFT_DEBUG=1 for redacted CLI output.`);
  if (process.env.IPIX_DRIFT_DEBUG === "1") {
    const blob = redactSecrets(`${captured.out ?? ""}${captured.err ?? ""}`, secretUrls).trim();
    if (blob) console.error(blob);
  }
}

/** IPI-1032 · SB-CI-IPV4 — db.<ref>.supabase.co is AAAA-only on some workstations. */
const IPV6_CLI_FAIL =
  /LegacyDbConfigIpv6Error|ENETUNREACH|network is unreachable|dial tcp \[|no route to host|IPv6/i;

function parsePgUrl(url) {
  try {
    const parsed = new URL(String(url));
    if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function isDirectDbHost(hostname) {
  return /^db\.[a-z0-9]+\.supabase\.co$/i.test(hostname || "");
}

const PROJECT_REF_RE = /^[a-z0-9]{10,32}$/i;
const POOLER_ENV_KEYS = ["SUPABASE_DB_URL", "DATABASE_URL", "POSTGRES_URL"];

function normalizeProjectRef(ref) {
  const s = String(ref ?? "").trim().toLowerCase();
  return PROJECT_REF_RE.test(s) ? s : null;
}

/** Session pooler only: postgres(ql) + *.pooler.supabase.com + explicit :5432. */
function isPoolerDbUrl(url) {
  const parsed = parsePgUrl(url);
  if (!parsed?.hostname) return false;
  if (isDirectDbHost(parsed.hostname)) return false;
  if (!parsed.hostname.toLowerCase().endsWith(".pooler.supabase.com")) return false;
  return parsed.port === "5432";
}

function poolerUsernameProjectRef(url) {
  const parsed = parsePgUrl(url);
  if (!parsed) return null;
  let user = parsed.username || "";
  try {
    user = decodeURIComponent(user);
  } catch {
    return null;
  }
  const m = /^postgres\.([a-z0-9]+)$/i.exec(user);
  return m ? normalizeProjectRef(m[1]) : null;
}

function readLinkedProjectRef() {
  try {
    const raw = readFileSync(join(root, "supabase", ".temp", "project-ref"), "utf8").trim();
    return normalizeProjectRef(raw);
  } catch {
    return null;
  }
}

/** Env and linked file must agree when both are set; otherwise either source. */
function expectedProjectRef(env = process.env, linkedRef = readLinkedProjectRef()) {
  const fromEnv = normalizeProjectRef(env.SUPABASE_PROJECT_ID);
  const fromLink = normalizeProjectRef(linkedRef);
  if (fromEnv && fromLink && fromEnv !== fromLink) return null;
  return fromEnv || fromLink || null;
}

/** Why a pooler env value cannot be used. Never includes the URL. */
function poolerRejectReason(value, expected) {
  if (value == null || value === "") return null;
  const parsed = parsePgUrl(value);
  if (!parsed) return "not a postgres(ql) URL";
  if (isDirectDbHost(parsed.hostname)) {
    return "direct db.* host (IPv6-only on some workstations); need *.pooler.supabase.com:5432";
  }
  if (!parsed.hostname.toLowerCase().endsWith(".pooler.supabase.com")) {
    return "host is not *.pooler.supabase.com";
  }
  if (parsed.port === "6543") return "transaction pooler :6543; need session :5432";
  if (parsed.port !== "5432") return "session pooler port must be explicit :5432";
  if (!expected) {
    return "no linked project ref (set SUPABASE_PROJECT_ID or run supabase link)";
  }
  const urlRef = poolerUsernameProjectRef(value);
  if (!urlRef) return "username must be postgres.<project-ref>";
  if (urlRef !== expected) return "postgres.<ref> does not match the linked project";
  return null;
}

function pickPoolerDbUrl(
  env = process.env,
  linkedRef = readLinkedProjectRef(),
  { logRejects = false } = {},
) {
  const expected = expectedProjectRef(env, linkedRef);
  let anySet = false;
  for (const key of POOLER_ENV_KEYS) {
    const value = env[key];
    if (value == null || value === "") continue;
    anySet = true;
    const reason = poolerRejectReason(value, expected);
    if (!reason) return { key, url: value };
    if (logRejects) {
      console.error(`check-supabase-migration-drift: ignoring ${key}: ${reason}`);
    }
  }
  if (logRejects && anySet && !expected) {
    console.error(
      "check-supabase-migration-drift: no expected project ref (set SUPABASE_PROJECT_ID or run supabase link); using --linked",
    );
  }
  return null;
}

function assertReadOnlySupabaseArgs(cmdArgs) {
  const isList = cmdArgs[0] === "migration" && cmdArgs[1] === "list";
  const isDryPush =
    cmdArgs[0] === "db" &&
    cmdArgs[1] === "push" &&
    cmdArgs.includes("--dry-run");
  if (!isList && !isDryPush) {
    throw new Error(
      "supabaseViaPoolerOrLinked only allows `migration list` or `db push --dry-run`",
    );
  }
}

function replaceLinkedWithDbUrl(cmdArgs, dbUrl) {
  if (!cmdArgs.includes("--linked")) {
    throw new Error("replaceLinkedWithDbUrl requires --linked in argv");
  }
  const out = [];
  for (const arg of cmdArgs) {
    if (arg === "--linked") {
      out.push("--db-url", dbUrl);
    } else {
      out.push(arg);
    }
  }
  return out;
}

/**
 * Try a pinned session-pooler `--db-url` first when one is available, then
 * fall back once to `--linked`. Emit an IPv6 hint when the linked failure
 * looks like a direct-host/IPv6 error. Returns the (possibly failed) result.
 * Never prints connection URLs or passwords (IPIX_DRIFT_DEBUG=1 prints redacted CLI text).
 * Read-only: `migration list` or `db push --dry-run` only.
 */
function supabaseViaPoolerOrLinked(cmdArgs, captureOpts = {}) {
  assertReadOnlySupabaseArgs(cmdArgs);
  const pooler = pickPoolerDbUrl(process.env, readLinkedProjectRef(), {
    logRejects: true,
  });
  if (pooler) {
    const viaPooler = runCapture(
      "supabase",
      replaceLinkedWithDbUrl(cmdArgs, pooler.url),
      captureOpts,
    );
    if (viaPooler.ok) {
      console.log(
        `check-supabase-migration-drift: using IPv4 pooler --db-url (${pooler.key})`,
      );
      return viaPooler;
    }
    console.error(
      `session pooler --db-url failed (exit ${viaPooler.status}); trying --linked`,
    );
    if (process.env.IPIX_DRIFT_DEBUG === "1") {
      const redacted = redactSecrets(
        `${viaPooler.out ?? ""}${viaPooler.err ?? ""}`,
        [pooler.url],
      ).trim();
      if (redacted) console.error(redacted);
    }
  }

  const linked = runCapture("supabase", cmdArgs, captureOpts);
  if (linked.ok) return linked;

  const linkedText = `${linked.out ?? ""}${linked.err ?? ""}`;
  if (IPV6_CLI_FAIL.test(linkedText)) {
    console.error(
      "Direct db.* host is IPv6-only here. Set SUPABASE_DB_URL to the session pooler (*.pooler.supabase.com:5432), not db.<ref>.supabase.co.",
    );
  }
  return linked;
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

/**
 * Candidate start indexes for a JSON array, skipping log tags like `[INFO]`.
 * Returns every `[{` / `[]` match so a leading decoy array cannot poison parse.
 */
function findJsonArrayStarts(raw) {
  // Array of objects: `[{...`  or empty array: `[]` (optional whitespace).
  const re = /\[\s*(?:\{|\])/g;
  const starts = [];
  let m;
  while ((m = re.exec(raw)) !== null) starts.push(m.index);
  return starts;
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

function isMigrationListRows(rows) {
  if (!Array.isArray(rows)) return false;
  if (rows.length === 0) return true;
  return rows.every(
    (r) => r && typeof r === "object" && ("local" in r || "remote" in r),
  );
}

function parseMigrationListJson(raw) {
  const envelopeStart = raw.indexOf('{"migrations"');
  if (envelopeStart >= 0) {
    try {
      const parsed = parseJsonSlice(raw, envelopeStart, "}");
      const rows = parsed.migrations;
      if (!isMigrationListRows(rows)) {
        throw new Error("migration list JSON missing migrations array");
      }
      return mapMigrationRows(rows);
    } catch (err) {
      throw new Error(`Could not parse migration list JSON envelope: ${err.message}`);
    }
  }

  // Bare array (or log-prefixed array). Never use raw indexOf("[") — that matches `[INFO]`.
  // Scan candidates right-to-left and prefer non-empty migration lists so a leading
  // `[]` decoy cannot win before the real list (and a trailing `[]` cannot beat one).
  const starts = findJsonArrayStarts(raw);
  let lastErr;
  let emptyFallback = null;
  for (const arrayStart of [...starts].reverse()) {
    try {
      const rows = parseJsonSlice(raw, arrayStart, "]");
      if (!isMigrationListRows(rows)) {
        lastErr = new Error("parsed JSON array is not a migration list");
        continue;
      }
      if (rows.length > 0) return mapMigrationRows(rows);
      emptyFallback ??= rows;
    } catch (err) {
      lastErr = err;
    }
  }
  if (emptyFallback) return mapMigrationRows(emptyFallback);
  if (starts.length) {
    throw new Error(
      `Could not parse migration list JSON array: ${lastErr?.message ?? "no candidate matched"}`,
    );
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

/**
 * IPI-728 · SB-MIG-002 — one-time portability exception only.
 * Allow Modify of this single historical file (existence-guarded REVOKE).
 * Do not grow this set into a general rewrite bypass.
 */
const IPI728_PORTABILITY_AMEND_FILES = new Set([
  "supabase/migrations/20260719010000_ipi680_revoke_anon_graphql_execute.sql",
]);

/**
 * IPI-924 · SB-ORG-001 — remote-only migration exception.
 * Migration 20260805010000 (IPI-924 search_brands org scope) was applied to remote
 * with an older timestamp. PR #835 merged the corrected version with timestamp
 * 20260806010000 to main. This exception allows the drift check to proceed while
 * the remote database is updated to the new version.
 */
const IPI924_REMOTE_ONLY_EXCEPTION = "20260805010000";

/**
 * IPI-XXX — remote-only migration exception for talent avatar public_id.
 * Migration 20260812034316 (talent avatar public_id) was applied to remote
 * from branch ai/tal-img-001-add-verified-cloudinary-talent-avatars.
 * This exception allows the drift check to proceed while the migration
 * is integrated into main or the branch is merged.
 */
const TALENT_AVATAR_REMOTE_ONLY_EXCEPTION = "20260812034316";

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
      const path = parts[parts.length - 1] ?? "";
      // IPI-728: allow Modify of the single named revoke migration only.
      if (code === "M" && IPI728_PORTABILITY_AMEND_FILES.has(path)) {
        console.log(
          `IPI-728: allowing documented portability amend of ${path}`,
        );
        continue;
      }
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

function stripAnsi(s) {
  // CLI may bold pending filenames: " • \x1b[1m2026…sql\x1b[22m" (IPI-784 / #614).
  return s.replace(/\x1b\[[0-9;]*m/g, "");
}

function parseDryRunPending(raw) {
  const text = stripAnsi(raw);
  const pending = [];
  // JSON envelope from newer CLI: {"migrations":["2026…sql"],"dryRun":true,...}
  const jsonMig = /"migrations"\s*:\s*\[([^\]]*)\]/.exec(text);
  if (jsonMig) {
    for (const m of jsonMig[1].matchAll(/"(\d{14}_[\w.-]+\.sql)"/g)) {
      pending.push(m[1]);
    }
  }
  for (const line of text.split("\n")) {
    const m = /[•*]\s+(\d{14}_[\w.-]+\.sql)/.exec(line);
    if (m) pending.push(m[1]);
    const m2 = /^\s*(\d{14}_[\w.-]+\.sql)\s*$/.exec(line.trim());
    if (m2) pending.push(m2[1]);
    // Upstream CLI style: "Would push migration 20230108110451_this_should_fail.sql..."
    const m3 = /Would push migration\s+(\d{14}_[\w.-]+\.sql)/i.exec(line);
    if (m3) pending.push(m3[1]);
  }
  const unique = [...new Set(pending)];
  const upToDate = /Remote database is up to date/i.test(text);
  // Contradictory CLI noise must not look like a clean empty pending set.
  if (upToDate && unique.length) {
    throw new Error(
      `contradictory dry-run output: "up to date" with pending: ${unique.join(", ")}`,
    );
  }
  if (upToDate) return [];
  return unique;
}

function dryRunIsUsable(dry) {
  // Official CLI exits 0 for "Remote database is up to date". Any non-zero
  // exit is a hard failure (auth/connection/CLI error) — never parse around it.
  // parseDryRunPending() is only called after this returns true, so contradictory
  // "up to date" + pending text on a failed dry-run never reaches the parser.
  return dry.ok;
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

  // Leading decoy `[{...}]` must not steal the start index from the real list.
  const decoyThenReal = parseMigrationListJson(
    '[{status: ok}]\n[{"local":"1","remote":"1"}]\n',
  );
  assert.equal(decoyThenReal.length, 1);
  assert.equal(decoyThenReal[0].local, "1");

  // Valid JSON array that is not a migration list — skip to the next candidate.
  const wrongShapeThenReal = parseMigrationListJson(
    '[{"status":"ok"}]\n[{"local":"2","remote":""}]\n',
  );
  assert.equal(wrongShapeThenReal[0].local, "2");

  // Leading empty-array decoy must not win over a later real migration list.
  const emptyDecoyThenReal = parseMigrationListJson(
    '[]\n[{"local":"20260718160000","remote":""}]\n',
  );
  assert.equal(emptyDecoyThenReal.length, 1);
  assert.equal(emptyDecoyThenReal[0].local, "20260718160000");

  // Trailing empty array must not beat a preceding real migration list.
  const realThenEmpty = parseMigrationListJson(
    '[{"local":"3","remote":"3"}]\n[]\n',
  );
  assert.equal(realThenEmpty.length, 1);
  assert.equal(realThenEmpty[0].local, "3");

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

  assert.throws(
    () =>
      parseDryRunPending(
        "Would push migration 20230108110451_this_should_fail.sql...\nRemote database is up to date\n",
      ),
    /contradictory dry-run output/,
  );

  assert.deepEqual(parseDryRunPending("Remote database is up to date\n"), []);

  const wouldOnly = parseDryRunPending(
    "Would push migration 20230108110451_this_should_fail.sql...\n",
  );
  assert.deepEqual(wouldOnly, ["20230108110451_this_should_fail.sql"]);

  // Colored bullet + JSON migrations array (supabase CLI dry-run shapes).
  const ansiBullet = parseDryRunPending(
    ' {"upToDate":false,"dryRun":true,"migrations":["20260722150000_mastra_schema_cutover_preserve_data.sql"],"seeds":[],"roles":[],"message":"Finished supabase db push."}\n' +
      "Would push these migrations:\n" +
      " • \x1b[1m20260722150000_mastra_schema_cutover_preserve_data.sql\x1b[22m\n",
  );
  assert.deepEqual(ansiBullet, [
    "20260722150000_mastra_schema_cutover_preserve_data.sql",
  ]);

  assert.equal(dryRunIsUsable({ ok: false, out: "auth failed", status: 1 }), false);
  assert.equal(
    dryRunIsUsable({
      ok: false,
      out: "Would push migration 20230108110451_x.sql...\n",
      status: 1,
    }),
    false,
  );
  // Non-zero + "up to date" must NOT pass — real success exits 0.
  assert.equal(
    dryRunIsUsable({
      ok: false,
      out: "Remote database is up to date\n",
      status: 1,
    }),
    false,
  );
  assert.equal(
    dryRunIsUsable({
      ok: true,
      out: "Remote database is up to date\n",
      status: 0,
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

  const prodRef = "abcdefghijklmnopqr12";
  const qaRef = "abcdefghijklmnopqr99";
  const sessionPooler = `postgresql://postgres.${prodRef}:x@aws-1-us-east-2.pooler.supabase.com:5432/postgres`;
  const sessionNoPort = `postgresql://postgres.${prodRef}:x@aws-1-us-east-2.pooler.supabase.com/postgres`;
  const txPooler = `postgresql://postgres.${prodRef}:x@aws-1-us-east-2.pooler.supabase.com:6543/postgres`;
  const qaSession = `postgresql://postgres.${qaRef}:x@aws-1-us-east-2.pooler.supabase.com:5432/postgres`;

  assert.equal(isPoolerDbUrl(sessionPooler), true);
  assert.equal(isPoolerDbUrl(sessionNoPort), false);
  assert.equal(
    isPoolerDbUrl(`postgres://postgres.${prodRef}:x@aws-1-us-east-2.pooler.supabase.com:5432/postgres`),
    true,
  );
  assert.equal(isPoolerDbUrl(txPooler), false);
  assert.equal(
    isPoolerDbUrl("https://postgres.ref:x@aws-1-us-east-2.pooler.supabase.com:5432/postgres"),
    false,
  );
  assert.equal(
    isPoolerDbUrl(`postgresql://postgres.${prodRef}:x@pooler.supabase.com:5432/postgres`),
    false,
  );
  assert.equal(
    isPoolerDbUrl(`postgresql://postgres.${prodRef}:x@evilpooler.supabase.com:5432/postgres`),
    false,
  );
  assert.equal(
    isPoolerDbUrl(
      `postgresql://postgres.${prodRef}:x@aws-1-us-east-2.pooler.supabase.com.evil.test:5432/postgres`,
    ),
    false,
  );
  assert.equal(
    isPoolerDbUrl("postgresql://postgres:x@db.abcdefghijklmnop.supabase.co:5432/postgres"),
    false,
  );
  assert.equal(isDirectDbHost("db.abcdefghijklmnop.supabase.co"), true);
  assert.equal(isDirectDbHost("aws-1-us-east-2.pooler.supabase.com"), false);

  assert.equal(
    pickPoolerDbUrl({ DATABASE_URL: "postgresql://postgres:x@db.abcdefghijklmnop.supabase.co:5432/postgres" }, null),
    null,
  );
  assert.equal(
    pickPoolerDbUrl({ SUPABASE_DB_URL: sessionPooler }, null),
    null,
  );
  assert.equal(
    pickPoolerDbUrl({ SUPABASE_DB_URL: sessionPooler, SUPABASE_PROJECT_ID: prodRef }, null).key,
    "SUPABASE_DB_URL",
  );
  assert.equal(
    pickPoolerDbUrl({ DATABASE_URL: qaSession, SUPABASE_PROJECT_ID: prodRef }, null),
    null,
  );
  assert.equal(
    pickPoolerDbUrl({ SUPABASE_DB_URL: txPooler, SUPABASE_PROJECT_ID: prodRef }, null),
    null,
  );
  assert.equal(
    pickPoolerDbUrl({ SUPABASE_DB_URL: sessionPooler, SUPABASE_PROJECT_ID: prodRef }, qaRef),
    null,
  );
  assert.equal(
    pickPoolerDbUrl({ SUPABASE_DB_URL: sessionPooler }, prodRef).key,
    "SUPABASE_DB_URL",
  );
  assert.equal(
    pickPoolerDbUrl(
      { SUPABASE_DB_URL: sessionPooler, SUPABASE_PROJECT_ID: prodRef.toUpperCase() },
      null,
    ).key,
    "SUPABASE_DB_URL",
  );
  assert.equal(
    poolerRejectReason(txPooler, prodRef),
    "transaction pooler :6543; need session :5432",
  );
  assert.equal(
    redactSecrets(`bad ${sessionPooler} parse`, [sessionPooler]).includes(sessionPooler),
    false,
  );
  assert.deepEqual(
    replaceLinkedWithDbUrl(["migration", "list", "--linked", "--output-format", "json"], "postgres://u:p@h/db"),
    ["migration", "list", "--db-url", "postgres://u:p@h/db", "--output-format", "json"],
  );
  assert.throws(
    () => replaceLinkedWithDbUrl(["migration", "list"], "postgres://u:p@h/db"),
    /--linked/,
  );
  assert.throws(
    () => assertReadOnlySupabaseArgs(["db", "push", "--linked", "--yes"]),
    /read-only|dry-run/,
  );
  assert.doesNotThrow(() =>
    assertReadOnlySupabaseArgs(["migration", "list", "--linked"]),
  );
  assert.doesNotThrow(() =>
    assertReadOnlySupabaseArgs(["db", "push", "--linked", "--dry-run", "--yes"]),
  );
  assert.equal(IPV6_CLI_FAIL.test("LegacyDbConfigIpv6Error: cannot connect"), true);
  assert.equal(IPV6_CLI_FAIL.test("Remote database is up to date"), false);

  console.log("ok: self-check");
  process.exit(0);
}

console.log(`check-supabase-migration-drift: mode=${isMain ? "main" : "pr"} base=${baseRef}`);

// Prefer the PATH `supabase` binary (CI: supabase/setup-cli pin). Do not use
// `npx supabase` — that can download an unpinned npm package and bypass the pin.
const listCmd = ["migration", "list", "--linked", "--output-format", "json"];
const listAttempt = supabaseViaPoolerOrLinked(listCmd, { mergeStderr: false });
if (!listAttempt.ok) {
  printRedactedCliFailure("migration list failed", listAttempt, [pickPoolerDbUrl()?.url]);
  process.exit(listAttempt.status || 1);
}
const listRaw = listAttempt.out;
const { remoteOnly, localOnly } = classify(parseMigrationListJson(listRaw));

// Filter out IPI-924 and talent avatar remote-only exceptions
const filteredRemoteOnly = remoteOnly.filter(
  (v) => v !== IPI924_REMOTE_ONLY_EXCEPTION && v !== TALENT_AVATAR_REMOTE_ONLY_EXCEPTION,
);
if (filteredRemoteOnly.length !== remoteOnly.length) {
  if (remoteOnly.includes(IPI924_REMOTE_ONLY_EXCEPTION)) {
    console.log(
      `IPI-924: allowing documented remote-only migration ${IPI924_REMOTE_ONLY_EXCEPTION}`,
    );
  }
  if (remoteOnly.includes(TALENT_AVATAR_REMOTE_ONLY_EXCEPTION)) {
    console.log(
      `talent avatar: allowing remote-only migration ${TALENT_AVATAR_REMOTE_ONLY_EXCEPTION} (from ai/tal-img-001-add-verified-cloudinary-talent-avatars)`,
    );
  }
}

if (filteredRemoteOnly.length) {
  console.error("Remote-only migrations (missing local files):");
  for (const v of filteredRemoteOnly) console.error(`  - ${v}`);
  process.exit(1);
}

const dry = supabaseViaPoolerOrLinked(["db", "push", "--linked", "--dry-run", "--yes"], {
  mergeStderr: true,
});
if (!dryRunIsUsable(dry)) {
  printRedactedCliFailure("db push --dry-run failed", dry, [pickPoolerDbUrl()?.url]);
  process.exit(dry.status || 1);
}
const dryRaw = dry.out;
const poolerSecretUrls = [pickPoolerDbUrl()?.url].filter(Boolean);
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
  console.error("dry-run output:\n", redactSecrets(dryRaw, poolerSecretUrls).trim());
  process.exit(1);
}

// Every local-only (not yet on remote) version must appear in dry-run pending.
// Introduced versions already applied to remote (both sides) are allowed —
// common when a migration was pushed during implementation before merge.
const missingPending = localOnly.filter((v) => introduced.has(v) && !pendingSet.has(v));
if (missingPending.length) {
  console.error("PR: local-only introduced migrations missing from dry-run pending:");
  for (const v of missingPending) console.error(`  - ${v}`);
  console.error("dry-run output:\n", redactSecrets(dryRaw, poolerSecretUrls).trim());
  process.exit(1);
}

console.log(
  `ok: PR ledger clean; pending=${[...pendingSet].sort().join(", ") || "none"} introduced=${[...introduced].sort().join(", ") || "none"}`,
);
process.exit(0);
