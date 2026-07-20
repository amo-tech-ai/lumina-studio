#!/usr/bin/env node
/**
 * IPI-742 · SB-EDGE-CI-001 — Resolve which Supabase Edge functions to deploy.
 *
 * Fail closed when:
 * - an explicit name is not in the deployable set
 * - `_shared` changed and on-disk importers disagree with SHARED_DEPENDENTS
 *
 * Usage:
 *   node scripts/resolve-edge-deploy-targets.mjs --self-check
 *   node scripts/resolve-edge-deploy-targets.mjs --functions health,brand-intelligence
 *   node scripts/resolve-edge-deploy-targets.mjs --from-diff <base> <head>
 *   node scripts/resolve-edge-deploy-targets.mjs --from-files   # paths on stdin
 *
 * Output: JSON { functions, reason, sharedChanged, skipped }
 * Optional: --github-output writes functions / should_deploy / reason to $GITHUB_OUTPUT
 */
import { execFileSync } from "node:child_process";
import {
  appendFileSync,
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
} from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const FUNCTIONS_DIR = join(ROOT, "supabase", "functions");

/** Deployable Edge function slugs (must match config.toml [functions.*]). */
export const DEPLOYABLE_FUNCTIONS = Object.freeze([
  "audit-asset-dna",
  "brand-intelligence",
  "capture-lead",
  "edge-test",
  "firecrawl-webhook",
  "health",
  "start-brand-crawl",
]);

/**
 * Explicit dependents of `_shared`. Keep in sync with on-disk importers.
 * A `_shared` change expands to this full matrix — never path-filter alone.
 */
export const SHARED_DEPENDENTS = Object.freeze([...DEPLOYABLE_FUNCTIONS]);

const DEPLOYABLE = new Set(DEPLOYABLE_FUNCTIONS);
const SHARED_SET = new Set(SHARED_DEPENDENTS);

/**
 * @param {string} dir
 * @returns {string[]}
 */
function listFunctionDirs(dir = FUNCTIONS_DIR) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => {
      if (name.startsWith("_") || name.startsWith(".")) return false;
      try {
        return statSync(join(dir, name)).isDirectory();
      } catch {
        return false;
      }
    })
    .sort();
}

/**
 * True if source under a function dir imports `../_shared` (non-test files).
 * @param {string} fnDir absolute path
 */
function functionImportsShared(fnDir) {
  /** @type {string[]} */
  const stack = [fnDir];
  while (stack.length) {
    const cur = stack.pop();
    let entries;
    try {
      entries = readdirSync(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      const p = join(cur, ent.name);
      if (ent.isDirectory()) {
        if (ent.name === "node_modules" || ent.name === ".git") continue;
        stack.push(p);
        continue;
      }
      if (!ent.isFile()) continue;
      if (!/\.(ts|js|mjs|tsx)$/.test(ent.name)) continue;
      if (/\.test\.(ts|js|mjs|tsx)$/.test(ent.name)) continue;
      let text;
      try {
        text = readFileSync(p, "utf8");
      } catch {
        continue;
      }
      if (/from\s+["']\.\.\/_shared\//.test(text) || /from\s+["']\.\.\/_shared["']/.test(text)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Discover function dirs that import `_shared` on disk.
 * @returns {string[]}
 */
export function discoverSharedImporters(functionsDir = FUNCTIONS_DIR) {
  return listFunctionDirs(functionsDir).filter((name) =>
    functionImportsShared(join(functionsDir, name)),
  );
}

/**
 * Assert SHARED_DEPENDENTS matches on-disk importers. Fail closed on drift.
 * @returns {{ ok: true, importers: string[] } | { ok: false, error: string, importers: string[], matrix: string[] }}
 */
export function assertSharedMatrixAligned(functionsDir = FUNCTIONS_DIR) {
  const importers = discoverSharedImporters(functionsDir);
  const missingFromMatrix = importers.filter((n) => !SHARED_SET.has(n));
  const extraInMatrix = SHARED_DEPENDENTS.filter((n) => !importers.includes(n));
  if (missingFromMatrix.length || extraInMatrix.length) {
    return {
      ok: false,
      error:
        `SHARED_DEPENDENTS out of sync with on-disk _shared importers. ` +
        `missingFromMatrix=${JSON.stringify(missingFromMatrix)} ` +
        `extraInMatrix=${JSON.stringify(extraInMatrix)}. ` +
        `Update scripts/resolve-edge-deploy-targets.mjs before deploying.`,
      importers,
      matrix: [...SHARED_DEPENDENTS],
    };
  }
  return { ok: true, importers };
}

/**
 * @param {string} path
 * @returns {{ kind: 'shared' } | { kind: 'function', name: string } | { kind: 'other' }}
 */
export function classifyPath(path) {
  const norm = path.replaceAll("\\", "/").replace(/^\.\//, "");
  const prefix = "supabase/functions/";
  if (!norm.startsWith(prefix)) return { kind: "other" };
  const rest = norm.slice(prefix.length);
  const seg = rest.split("/")[0];
  if (!seg) return { kind: "other" };
  if (seg === "_shared") return { kind: "shared" };
  if (DEPLOYABLE.has(seg)) return { kind: "function", name: seg };
  // Unknown function directory under supabase/functions/
  if (!seg.startsWith("_") && !seg.includes(".")) {
    return { kind: "function", name: seg };
  }
  return { kind: "other" };
}

/**
 * @param {string[]} paths
 * @param {{ functionsDir?: string }} [opts]
 */
export function resolveFromPaths(paths, opts = {}) {
  const functionsDir = opts.functionsDir ?? FUNCTIONS_DIR;
  /** @type {Set<string>} */
  const named = new Set();
  let sharedChanged = false;
  /** @type {string[]} */
  const unknownDirs = [];

  for (const p of paths) {
    const c = classifyPath(p);
    if (c.kind === "shared") sharedChanged = true;
    else if (c.kind === "function") {
      if (!DEPLOYABLE.has(c.name)) unknownDirs.push(c.name);
      else named.add(c.name);
    }
  }

  if (unknownDirs.length) {
    const uniq = [...new Set(unknownDirs)].sort();
    return {
      ok: false,
      error:
        `Unknown Edge function dir(s) not in DEPLOYABLE_FUNCTIONS: ${uniq.join(", ")}. ` +
        `Add to the matrix or remove the path.`,
      functions: [],
      reason: "unknown_function_dir",
      sharedChanged,
      skipped: false,
    };
  }

  if (sharedChanged) {
    const align = assertSharedMatrixAligned(functionsDir);
    if (!align.ok) {
      return {
        ok: false,
        error: align.error,
        functions: [],
        reason: "shared_matrix_mismatch",
        sharedChanged: true,
        skipped: false,
      };
    }
    const functions = [...SHARED_DEPENDENTS].sort();
    return {
      ok: true,
      functions,
      reason: "shared_changed_expand_matrix",
      sharedChanged: true,
      skipped: false,
    };
  }

  const functions = [...named].sort();
  if (functions.length === 0) {
    return {
      ok: true,
      functions: [],
      reason: "no_edge_function_changes",
      sharedChanged: false,
      skipped: true,
    };
  }
  return {
    ok: true,
    functions,
    reason: "named_function_paths",
    sharedChanged: false,
    skipped: false,
  };
}

/**
 * @param {string} csv
 */
export function resolveFromExplicit(csv) {
  const parts = String(csv ?? "")
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) {
    return {
      ok: false,
      error: "empty --functions list",
      functions: [],
      reason: "empty_explicit",
      sharedChanged: false,
      skipped: false,
    };
  }
  const bad = parts.filter((p) => !DEPLOYABLE.has(p));
  if (bad.length) {
    return {
      ok: false,
      error: `Invalid function name(s): ${bad.join(", ")}. Allowed: ${DEPLOYABLE_FUNCTIONS.join(", ")}`,
      functions: [],
      reason: "invalid_explicit_name",
      sharedChanged: false,
      skipped: false,
    };
  }
  const functions = [...new Set(parts)].sort();
  return {
    ok: true,
    functions,
    reason: "explicit_functions",
    sharedChanged: false,
    skipped: false,
  };
}

/**
 * @param {string} base
 * @param {string} head
 */
export function resolveFromDiff(base, head) {
  // Three-dot (`A...B`) needs commit-ish on both sides (uses merge-base).
  // Empty-tree / bare tree SHAs (root-commit fallback) must use two-dot.
  let baseType = "";
  try {
    baseType = execFileSync("git", ["cat-file", "-t", base], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    baseType = "";
  }
  const diffArgs =
    baseType === "tree"
      ? ["diff", "--name-only", base, head]
      : ["diff", "--name-only", `${base}...${head}`];
  const out = execFileSync("git", diffArgs, { cwd: ROOT, encoding: "utf8" });
  const paths = out
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return resolveFromPaths(paths);
}

/**
 * Compare pre/post `functions list` JSON for deployed slugs.
 *
 * Hard fail: missing slug or not ACTIVE.
 * Soft warn: identical source redeploy may not bump Management API
 * version/updated_at (observed on no-op `health` deploy) — CLI deploy
 * success + ACTIVE is enough.
 *
 * @param {string} preRaw
 * @param {string} postRaw
 * @param {string[]} functions
 */
export function verifyDeployDelta(preRaw, postRaw, functions) {
  const pre = indexBySlug(parseListJson(preRaw));
  const post = indexBySlug(parseListJson(postRaw));
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];
  /** @type {object[]} */
  const rows = [];

  for (const slug of functions) {
    const a = pre.get(slug);
    const b = post.get(slug);
    if (!b) {
      errors.push(`${slug}: missing from post-deploy list`);
      continue;
    }
    // Fail closed: missing status must not default to ACTIVE.
    const status = String(b.status ?? "UNKNOWN").toUpperCase();
    if (status !== "ACTIVE") {
      errors.push(`${slug}: status=${status} (expected ACTIVE)`);
    }
    const metaBefore = fingerprint(a);
    const metaAfter = fingerprint(b);
    const changed = !a || metaBefore !== metaAfter;
    rows.push({
      slug,
      status,
      changed,
      before: metaBefore,
      after: metaAfter,
    });
    if (!changed) {
      warnings.push(
        `${slug}: list metadata unchanged after deploy (identical bundle no-op is OK; before=${metaBefore})`,
      );
    }
  }

  return { ok: errors.length === 0, errors, warnings, rows };
}

/**
 * @param {string} raw
 * @returns {object[]}
 */
function parseListJson(raw) {
  const text = String(raw ?? "").trim();
  if (!text) throw new Error("empty functions list JSON");
  const data = JSON.parse(text);
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.functions)
      ? data.functions
      : null;
  if (!list) throw new Error("functions list must be an array or { functions: [...] }");
  return list;
}

/** @param {object[]} list */
function indexBySlug(list) {
  /** @type {Map<string, object>} */
  const map = new Map();
  for (const fn of list) {
    const slug = fn?.slug ?? fn?.name;
    if (typeof slug === "string") map.set(slug, fn);
  }
  return map;
}

/** @param {object | undefined} fn */
function fingerprint(fn) {
  if (!fn) return "(absent)";
  const parts = [
    fn.id,
    fn.version,
    fn.updated_at ?? fn.updatedAt,
    fn.created_at ?? fn.createdAt,
    fn.status,
  ]
    .filter((v) => v != null && v !== "")
    .map(String);
  return parts.length ? parts.join("|") : JSON.stringify(fn);
}

function writeGithubOutputSync(result) {
  const path = process.env.GITHUB_OUTPUT;
  if (!path) return;
  const should = result.ok && !result.skipped && result.functions.length > 0;
  const lines = [
    `should_deploy=${should}`,
    `reason=${result.reason ?? ""}`,
    `shared_changed=${result.sharedChanged ? "true" : "false"}`,
    `functions<<EOF`,
    result.functions.join("\n"),
    `EOF`,
    `functions_csv=${result.functions.join(",")}`,
  ];
  appendFileSync(path, `${lines.join("\n")}\n`);
}

function selfCheck() {
  let failed = 0;
  const check = (name, cond, detail = "") => {
    if (cond) console.log(`ok: ${name}`);
    else {
      failed += 1;
      console.error(`FAIL: ${name}${detail ? ` — ${detail}` : ""}`);
    }
  };

  // Align matrix with live tree
  const align = assertSharedMatrixAligned();
  check("shared matrix aligned", align.ok, align.ok ? "" : align.error);

  // one function change
  let r = resolveFromPaths(["supabase/functions/health/index.ts"]);
  check(
    "one function → health",
    r.ok && r.functions.join() === "health" && !r.sharedChanged,
    JSON.stringify(r),
  );

  // multiple
  r = resolveFromPaths([
    "supabase/functions/health/index.ts",
    "supabase/functions/brand-intelligence/handler.ts",
  ]);
  check(
    "multiple functions",
    r.ok && r.functions.join() === "brand-intelligence,health",
    JSON.stringify(r),
  );

  // _shared expands matrix
  r = resolveFromPaths(["supabase/functions/_shared/cors.ts"]);
  check(
    "_shared expands full matrix",
    r.ok &&
      r.sharedChanged &&
      r.functions.length === SHARED_DEPENDENTS.length &&
      r.reason === "shared_changed_expand_matrix",
    JSON.stringify(r),
  );

  // unrelated
  r = resolveFromPaths(["README.md", "app/package.json"]);
  check(
    "unrelated → skip",
    r.ok && r.skipped && r.functions.length === 0,
    JSON.stringify(r),
  );

  // invalid explicit
  r = resolveFromExplicit("health,not-a-real-fn");
  check(
    "invalid explicit name fails",
    !r.ok && r.reason === "invalid_explicit_name",
    JSON.stringify(r),
  );

  // valid explicit
  r = resolveFromExplicit("health");
  check("valid explicit", r.ok && r.functions.join() === "health", JSON.stringify(r));

  // unknown dir under functions
  r = resolveFromPaths(["supabase/functions/brand-new-orphan/index.ts"]);
  check(
    "unknown function dir fails",
    !r.ok && r.reason === "unknown_function_dir",
    JSON.stringify(r),
  );

  // deploy delta: metadata must change
  const pre = JSON.stringify([
    { slug: "health", status: "ACTIVE", id: "1", updated_at: "2026-01-01T00:00:00Z" },
  ]);
  const postSame = JSON.stringify([
    { slug: "health", status: "ACTIVE", id: "1", updated_at: "2026-01-01T00:00:00Z" },
  ]);
  const postNew = JSON.stringify([
    { slug: "health", status: "ACTIVE", id: "1", updated_at: "2026-07-20T12:00:00Z" },
  ]);
  let d = verifyDeployDelta(pre, postSame, ["health"]);
  check(
    "delta warns but ok when metadata unchanged (identical bundle)",
    d.ok && d.warnings.length === 1 && d.errors.length === 0,
    JSON.stringify(d),
  );
  d = verifyDeployDelta(pre, postNew, ["health"]);
  check(
    "delta ok when updated_at changes",
    d.ok && d.warnings.length === 0,
    JSON.stringify(d),
  );
  const postInactive = JSON.stringify([
    { slug: "health", status: "REMOVED", id: "1", updated_at: "2026-07-20T12:00:00Z" },
  ]);
  d = verifyDeployDelta(pre, postInactive, ["health"]);
  check("delta fails when not ACTIVE", !d.ok, JSON.stringify(d));

  const postNoStatus = JSON.stringify([
    { slug: "health", id: "1", updated_at: "2026-07-20T12:00:00Z" },
  ]);
  d = verifyDeployDelta(pre, postNoStatus, ["health"]);
  check(
    "delta fails when status missing (fail-closed)",
    !d.ok && d.errors.some((e) => e.includes("UNKNOWN")),
    JSON.stringify(d),
  );

  // Empty-tree base (root-commit / zero-SHA fallback) must not use three-dot
  const emptyTree = execFileSync("git", ["hash-object", "-t", "tree", "/dev/null"], {
    cwd: ROOT,
    encoding: "utf8",
  }).trim();
  let fromEmpty;
  try {
    fromEmpty = resolveFromDiff(emptyTree, "HEAD");
  } catch (err) {
    fromEmpty = { ok: false, error: String(err) };
  }
  check(
    "from-diff empty-tree base does not throw",
    fromEmpty.ok !== undefined && !String(fromEmpty.error ?? "").includes("not a commit"),
    JSON.stringify(fromEmpty),
  );

  if (failed) {
    console.error(`\nself-check: ${failed} failure(s)`);
    process.exit(1);
  }
  console.log("\nself-check: all passed");
}

function printResult(result, { githubOutput = false } = {}) {
  if (!result.ok) {
    console.error(JSON.stringify(result, null, 2));
    if (githubOutput) writeGithubOutputSync(result);
    process.exit(1);
  }
  console.log(JSON.stringify(result, null, 2));
  if (githubOutput) writeGithubOutputSync(result);
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--self-check")) {
    selfCheck();
    return;
  }

  const githubOutput = args.includes("--github-output");
  const filtered = args.filter((a) => a !== "--github-output");

  if (filtered[0] === "--functions") {
    printResult(resolveFromExplicit(filtered[1] ?? ""), { githubOutput });
    return;
  }

  if (filtered[0] === "--from-diff") {
    const base = filtered[1];
    const head = filtered[2];
    if (!base || !head) {
      console.error("usage: --from-diff <base> <head>");
      process.exit(2);
    }
    printResult(resolveFromDiff(base, head), { githubOutput });
    return;
  }

  if (filtered[0] === "--from-files") {
    const paths = readFileSync(0, "utf8")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    printResult(resolveFromPaths(paths), { githubOutput });
    return;
  }

  if (filtered[0] === "--verify-delta") {
    const prePath = filtered[1];
    const postPath = filtered[2];
    const fnCsv = filtered[3] ?? "";
    if (!prePath || !postPath || !fnCsv) {
      console.error("usage: --verify-delta <pre.json> <post.json> <fn1,fn2>");
      process.exit(2);
    }
    const functions = fnCsv.split(",").map((s) => s.trim()).filter(Boolean);
    const result = verifyDeployDelta(
      readFileSync(prePath, "utf8"),
      readFileSync(postPath, "utf8"),
      functions,
    );
    console.log(JSON.stringify(result, null, 2));
    for (const w of result.warnings ?? []) {
      console.warn(`::warning::${w}`);
    }
    if (!result.ok) process.exit(1);
    return;
  }

  console.error(`usage:
  --self-check
  --functions <csv>
  --from-diff <base> <head>
  --from-files   (paths on stdin)
  --verify-delta <pre.json> <post.json> <csv>
  [--github-output]`);
  process.exit(2);
}

const ranAsCli =
  Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (ranAsCli) main();
