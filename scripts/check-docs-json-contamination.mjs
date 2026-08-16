#!/usr/bin/env node
/**
 * Prevent docs/docs.json from leaking into non-docs PRs (AGENTS.md rule #1).
 *
 * Fails the PR check if docs/docs.json is added, modified, renamed, or deleted
 * on any branch that is not a docs-only branch (pattern: docs/* or chore/docs-*).
 * Deletes are included (AMRD) so a feature PR cannot wipe Mintlify nav silently.
 *
 * Fail-closed design: if the base ref cannot be resolved or the diff cannot
 * be computed, the check FAILS rather than passing silently.
 *
 * Usage: node scripts/check-docs-json-contamination.mjs
 * CI:    runs on pull_request events with GITHUB_BASE_REF set
 */
import { execSync } from "node:child_process";

function run(cmd) {
  return execSync(cmd, { encoding: "utf8", stdio: "pipe" }).trim();
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function getChangedFiles(baseRef) {
  if (!baseRef) {
    fail(
      `🔴 docs-json-gate: GITHUB_BASE_REF is not set — cannot compute PR diff. ` +
        `Fail-closed: refusing to pass without a base ref.`
    );
  }

  const base = `origin/${baseRef}`;

  let changed;
  try {
    changed = run(`git diff --name-only --diff-filter=AMRD ${base}...HEAD`);
  } catch (err) {
    fail(
      `🔴 docs-json-gate: git diff against ${base} failed — cannot determine changed files. ` +
        `Fail-closed: refusing to pass without a clean diff.\nError: ${err}`
    );
  }

  return changed
    .split("\n")
    .filter(Boolean)
    .map((f) => f.trim())
    .filter(Boolean);
}

function getCurrentBranch() {
  try {
    return run("git branch --show-current");
  } catch {
    return "";
  }
}

function getChangedFilesOnBranch(baseRef) {
  const changed = getChangedFiles(baseRef);
  return changed.some((f) => f === "docs/docs.json");
}

const baseRef = process.env.GITHUB_BASE_REF;
const docsJsonChanged = getChangedFilesOnBranch(baseRef);
const branch = getCurrentBranch();
const isDocsBranch = /^docs\//.test(branch) || /^chore\/docs-/.test(branch);

if (docsJsonChanged && !isDocsBranch) {
  fail(`
🔴 docs/docs.json changed on a non-docs branch: ${branch}

AGENTS.md rule #1: NEVER mix docs and production files in the same PR or commit.
docs/docs.json is a docs-infrastructure file and must be in a separate
docs-only PR (branch pattern: docs/*).

Fix: Split this PR. Move the docs.json changes to a docs-only branch:
  git checkout 029b8e803 -- docs/docs.json   # or restore from the docs-only PR
  git commit --amend
  git push --force-with-lease origin ${branch}

Then create a new: git checkout -b docs/restore-mintlify-nav
`);
}

if (docsJsonChanged && isDocsBranch) {
  console.log(`✅ docs/docs.json changes on docs-only branch: ${branch}`);
} else {
  console.log("✅ No docs/docs.json changes detected");
}
