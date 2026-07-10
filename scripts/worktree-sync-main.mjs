#!/usr/bin/env node
/**
 * Fast-forwards local `main` to `origin/main` — the "update local main after
 * merge" step the worktrees skill otherwise leaves as a manual afterthought.
 * Run it right after a PR merges (or as the last step of a cleanup pass).
 *
 * Never force-updates anything:
 * - Local `main` identical to `origin/main` already → no-op.
 * - Local `main` is a strict ancestor of `origin/main` (the normal
 *   "someone merged since I last synced" case) → fast-forward.
 * - Local `main` has commits `origin/main` doesn't (real divergence, not
 *   just staleness) → refuse and print the exact commands to inspect it.
 *   This is a human decision, not something a sync script should paper over.
 * - `main` happens to be checked out in some worktree with uncommitted
 *   changes → refuse rather than risk clobbering work in progress.
 *
 * Usage:
 *   node scripts/worktree-sync-main.mjs           # sync local main
 *   node scripts/worktree-sync-main.mjs --json    # machine-readable
 */

import { execFileSync } from "node:child_process";

const JSON_OUT = process.argv.includes("--json");

function git(args, opts = {}) {
  return execFileSync("git", args, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], ...opts }).trim();
}

function tryGit(args, opts = {}) {
  try {
    return { ok: true, out: git(args, opts) };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/** Parses `git worktree list --porcelain` and returns the entry checked out on `branch`, if any. */
function findWorktreeForBranch(branch) {
  const raw = tryGit(["worktree", "list", "--porcelain"]);
  if (!raw.ok) return null;
  const entries = [];
  let current = null;
  for (const line of raw.out.split("\n")) {
    if (line.startsWith("worktree ")) {
      if (current) entries.push(current);
      current = { path: line.slice("worktree ".length), branch: null };
    } else if (current && line.startsWith("branch ")) {
      current.branch = line.slice("branch ".length).replace(/^refs\/heads\//, "");
    }
  }
  if (current) entries.push(current);
  return entries.find((e) => e.branch === branch) || null;
}

function report(result) {
  if (JSON_OUT) {
    console.log(JSON.stringify(result, null, 2));
  } else if (result.ok) {
    console.log(`✅ ${result.action}: ${result.detail}`);
  } else {
    console.error(`❌ ${result.reason}`);
  }
  process.exit(result.ok ? 0 : 1);
}

function main() {
  const fetch = tryGit(["fetch", "origin", "main", "--quiet"]);
  if (!fetch.ok) {
    report({ ok: false, reason: `git fetch origin main failed: ${fetch.error}` });
  }

  const hasLocalMain = tryGit(["show-ref", "--verify", "--quiet", "refs/heads/main"]);
  if (!hasLocalMain.ok) {
    const create = tryGit(["branch", "main", "origin/main"]);
    if (!create.ok) {
      report({ ok: false, reason: `local main branch doesn't exist and couldn't be created: ${create.error}` });
    }
    report({ ok: true, action: "created", detail: "local main didn't exist — created tracking origin/main" });
  }

  const localSha = git(["rev-parse", "main"]);
  const remoteSha = git(["rev-parse", "origin/main"]);

  if (localSha === remoteSha) {
    report({ ok: true, action: "noop", detail: `local main already matches origin/main (${localSha.slice(0, 7)})` });
  }

  const isAncestor = tryGit(["merge-base", "--is-ancestor", "main", "origin/main"]);
  if (!isAncestor.ok) {
    report({
      ok: false,
      reason:
        "local main has diverged from origin/main — not a plain fast-forward, so this needs a human look rather than " +
        "an automated sync. Inspect with: git log main..origin/main --oneline (what origin has that you don't) " +
        "and git log origin/main..main --oneline (what you have that origin doesn't).",
    });
  }

  const wt = findWorktreeForBranch("main");
  if (wt) {
    const dirty = tryGit(["status", "--porcelain"], { cwd: wt.path });
    if (dirty.ok && dirty.out.length > 0) {
      report({
        ok: false,
        reason: `main is checked out at ${wt.path} with uncommitted changes — commit or stash there first, then re-run.`,
      });
    }
    const ff = tryGit(["merge", "--ff-only", "origin/main"], { cwd: wt.path });
    if (!ff.ok) {
      report({ ok: false, reason: `fast-forward merge failed at ${wt.path}: ${ff.error}` });
    }
    report({
      ok: true,
      action: "fast-forwarded",
      detail: `${wt.path} (main checked out there): ${localSha.slice(0, 7)} → ${remoteSha.slice(0, 7)}`,
    });
  }

  // Not checked out anywhere — the merge-base check above already proved this
  // is a clean fast-forward, so moving the ref directly is safe.
  const update = tryGit(["update-ref", "refs/heads/main", remoteSha]);
  if (!update.ok) {
    report({ ok: false, reason: `couldn't update local main ref: ${update.error}` });
  }
  report({
    ok: true,
    action: "fast-forwarded",
    detail: `main (not checked out in any worktree): ${localSha.slice(0, 7)} → ${remoteSha.slice(0, 7)}`,
  });
}

main();
