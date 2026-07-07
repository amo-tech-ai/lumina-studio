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
 * Pre-delete mode (`--pre-delete`) adds one more hard block: commits on this
 * branch that were never pushed to any remote. A plain `git worktree remove`
 * (no --force) succeeds anyway — the working tree is clean — but those
 * commits are only one `git branch -D` away from being unrecoverable. Run
 * this before removing any worktree you didn't just finish pushing.
 *
 * Fails safe: if a git command that should always succeed (ahead/behind,
 * fetch) errors out instead, the worktree is reported UNKNOWN/unsafe rather
 * than silently defaulting to "0 behind = safe". A gate that can be made to
 * say "safe" by breaking its own inputs isn't a gate.
 *
 * Usage:
 *   node scripts/worktree-health.mjs                  # check current worktree (start-work gate)
 *   node scripts/worktree-health.mjs --all             # check every registered worktree
 *   node scripts/worktree-health.mjs --pre-delete       # also block on unpushed commits (removal safety)
 *   node scripts/worktree-health.mjs --max-behind=30    # override the soft-block threshold (default 30)
 *   node scripts/worktree-health.mjs --json             # machine-readable
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  classifyBlockers,
  hasStaleGroqImport,
  parseWorktreeListPorcelain,
  resolveMaxBehind,
} from "./lib/worktree-health-checks.mjs";

const PROVIDER_TS_RELATIVE = "app/src/lib/ai/provider.ts";

const args = process.argv.slice(2);
const ALL = args.includes("--all");
const JSON_OUT = args.includes("--json");
const PRE_DELETE = args.includes("--pre-delete");
const maxBehindArg = args.find((a) => a.startsWith("--max-behind="));
const maxBehindRaw = maxBehindArg ? maxBehindArg.split("=")[1] : undefined;
const { value: MAX_BEHIND, error: maxBehindError } = resolveMaxBehind(maxBehindRaw, 30);

if (maxBehindError) {
  console.error(`❌ ${maxBehindError}`);
  process.exit(2);
}

/**
 * Runs `git <args>` with no shell involved (execFileSync + an argv array),
 * so branch/ref names can never be interpreted as shell syntax. Throws on
 * failure — use this for commands where a non-zero exit means something is
 * actually broken (network unreachable, corrupt repo), not an expected "no".
 */
function git(gitArgs, cwd) {
  return execFileSync("git", gitArgs, { cwd, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
}

/** Same as `git()`, but for checks where a non-zero exit is an expected, meaningful "no". */
function tryGit(gitArgs, cwd) {
  try {
    return git(gitArgs, cwd);
  } catch {
    return null;
  }
}

/** The one check that's always fatal, regardless of --max-behind. */
function checkGroqStaleImport(wtPath) {
  const file = path.join(wtPath, PROVIDER_TS_RELATIVE);
  try {
    if (!fs.existsSync(file)) return { present: false, fileExists: false };
    const content = fs.readFileSync(file, "utf8");
    return { present: hasStaleGroqImport(content), fileExists: true };
  } catch (err) {
    return { present: false, fileExists: false, error: `couldn't read ${PROVIDER_TS_RELATIVE}: ${err.message}` };
  }
}

function checkAheadBehind(wtPath) {
  const raw = git(["rev-list", "--left-right", "--count", "HEAD...origin/main"], wtPath);
  const [ahead, behind] = raw.split(/\s+/).map(Number);
  return { ahead: ahead || 0, behind: behind || 0 };
}

/**
 * Commits on this branch not present on its configured upstream (never pushed
 * anywhere). Uses `@{upstream}` rather than assuming `origin/<branch>` — a
 * branch can be pushed to a non-origin remote, or tracked under a different
 * name than its local one, and would falsely look entirely unpushed otherwise.
 *
 * Detached HEAD has no upstream by definition, but its commits are exactly as
 * at-risk as an unpushed branch's — they're reachable only from this one ref
 * and `git worktree remove` won't protect them — so it's treated the same as
 * "no upstream configured" rather than hardcoded to 0.
 */
function checkUnpushedCommits(wtPath, branch, aheadOfMain) {
  const upstream = branch
    ? tryGit(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"], wtPath)
    : null;
  if (!upstream) return aheadOfMain; // no upstream (or detached HEAD) — everything ahead of main is at risk
  const count = tryGit(["rev-list", "--count", `${upstream}..HEAD`], wtPath);
  return count ? Number(count) : 0;
}

function checkWorktree(wtPath, branch, fetchFailed) {
  let ahead = 0;
  let behind = 0;
  let checkError = fetchFailed
    ? "git fetch origin failed — can't trust ahead/behind vs origin/main from a potentially stale cached ref"
    : null;
  const groqImport = checkGroqStaleImport(wtPath);

  try {
    ({ ahead, behind } = checkAheadBehind(wtPath));
  } catch (err) {
    checkError = `couldn't compute ahead/behind vs origin/main: ${err.message}`;
  }

  const unpushedCommits = PRE_DELETE && !checkError ? checkUnpushedCommits(wtPath, branch, ahead) : 0;
  const blockers = classifyBlockers({
    groqStaleImport: groqImport.present,
    behind,
    maxBehind: MAX_BEHIND,
    unpushedCommits,
    mode: PRE_DELETE ? "delete" : "start",
    checkError: checkError || groqImport.error || null,
  });

  return {
    path: wtPath,
    branch: branch || "(detached)",
    ahead,
    behind,
    groqStaleImport: groqImport.present,
    providerTsExists: groqImport.fileExists,
    unpushedCommits,
    blockers,
    safe: blockers.length === 0,
  };
}

function main() {
  const fetchFailed = tryGit(["fetch", "origin", "--quiet"], process.cwd()) === null;
  if (fetchFailed && !JSON_OUT) {
    console.error("⚠️  git fetch origin failed (offline?) — treating every checked worktree as unsafe.");
  }

  const targets = ALL
    ? parseWorktreeListPorcelain(git(["worktree", "list", "--porcelain"], process.cwd()))
    : [
        {
          path: git(["rev-parse", "--show-toplevel"], process.cwd()),
          branch: tryGit(["branch", "--show-current"], process.cwd()),
        },
      ];

  const results = targets.map((t) => checkWorktree(t.path, t.branch, fetchFailed));
  const anyBlocked = results.some((r) => !r.safe);

  if (JSON_OUT) {
    console.log(JSON.stringify({ maxBehind: MAX_BEHIND, fetchFailed, results }, null, 2));
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
