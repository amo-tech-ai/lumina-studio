#!/usr/bin/env node
/**
 * Fast pre-flight gate — run before starting agent work in a worktree.
 *
 * Unlike `worktree-audit.mjs` (a human-facing inventory of every worktree,
 * for periodic cleanup), this is a machine-facing gate: it checks ONE
 * worktree (the current one by default) and exits non-zero if it's unsafe
 * to work in. Fast enough to run at the start of every agent session.
 *
 * Hard block (always fails, no threshold): the worktree's `provider.ts`
 * still has the pre-IPI-428 static JSON import — a real, previously-shipped
 * bug (Turbopack "Module not found") that will break `next build`/`next dev`
 * regardless of how "close" the branch otherwise is.
 *
 * Soft block (configurable threshold): the worktree is too many commits
 * behind `origin/main` to trust local state — remediation is `git fetch`
 * + rebase, not a code fix.
 *
 * Usage:
 *   node scripts/worktree-health.mjs                  # check current worktree
 *   node scripts/worktree-health.mjs --all             # check every registered worktree
 *   node scripts/worktree-health.mjs --max-behind=30    # override the soft-block threshold (default 30)
 *   node scripts/worktree-health.mjs --json             # machine-readable
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { classifyBlockers, hasStaleGroqImport } from "./lib/worktree-health-checks.mjs";

const PROVIDER_TS_RELATIVE = "app/src/lib/ai/provider.ts";

const args = process.argv.slice(2);
const ALL = args.includes("--all");
const JSON_OUT = args.includes("--json");
const maxBehindArg = args.find((a) => a.startsWith("--max-behind="));
const MAX_BEHIND = maxBehindArg ? Number(maxBehindArg.split("=")[1]) : 30;

function run(cmd, cwd) {
  try {
    return execSync(cmd, { cwd, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch {
    return "";
  }
}

/** The one check that's always fatal, regardless of --max-behind. */
function checkGroqStaleImport(wtPath) {
  const file = path.join(wtPath, PROVIDER_TS_RELATIVE);
  if (!fs.existsSync(file)) {
    return { present: false, fileExists: false };
  }
  const content = fs.readFileSync(file, "utf8");
  return { present: hasStaleGroqImport(content), fileExists: true };
}

function checkAheadBehind(wtPath) {
  const raw = run("git rev-list --left-right --count HEAD...origin/main", wtPath);
  const [ahead, behind] = raw.split(/\s+/).map(Number);
  return { ahead: ahead || 0, behind: behind || 0 };
}

function checkWorktree(wtPath, branch) {
  const groqImport = checkGroqStaleImport(wtPath);
  const { ahead, behind } = checkAheadBehind(wtPath);
  const blockers = classifyBlockers({ groqStaleImport: groqImport.present, behind, maxBehind: MAX_BEHIND });

  return {
    path: wtPath,
    branch: branch || "(detached)",
    ahead,
    behind,
    groqStaleImport: groqImport.present,
    providerTsExists: groqImport.fileExists,
    blockers,
    safe: blockers.length === 0,
  };
}

function listAllWorktrees() {
  const raw = run("git worktree list --porcelain", process.cwd());
  const entries = [];
  let current = null;
  for (const line of raw.split("\n")) {
    if (line.startsWith("worktree ")) {
      if (current) entries.push(current);
      current = { path: line.slice(9), branch: null };
    } else if (!current) continue;
    else if (line.startsWith("branch ")) current.branch = line.slice(7).replace(/^refs\/heads\//, "");
  }
  if (current) entries.push(current);
  return entries;
}

function main() {
  run("git fetch origin --quiet", process.cwd());

  const targets = ALL
    ? listAllWorktrees()
    : [{ path: run("git rev-parse --show-toplevel", process.cwd()), branch: run("git branch --show-current", process.cwd()) }];

  const results = targets.map((t) => checkWorktree(t.path, t.branch));
  const anyBlocked = results.some((r) => !r.safe);

  if (JSON_OUT) {
    console.log(JSON.stringify({ maxBehind: MAX_BEHIND, results }, null, 2));
  } else {
    for (const r of results) {
      const icon = r.safe ? "🟢" : "🔴";
      console.log(`${icon} ${r.path} [${r.branch}] — ahead ${r.ahead}, behind ${r.behind}`);
      for (const b of r.blockers) console.log(`   ${b}`);
    }
    console.log(
      anyBlocked
        ? `\n❌ ${results.filter((r) => !r.safe).length}/${results.length} worktree(s) blocked.`
        : `\n✅ All ${results.length} checked worktree(s) safe.`,
    );
  }

  process.exit(anyBlocked ? 1 : 0);
}

main();
