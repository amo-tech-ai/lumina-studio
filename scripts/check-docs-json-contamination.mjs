#!/usr/bin/env node
/**
 * Prevent docs/docs.json from leaking into non-docs PRs (AGENTS.md rule #1).
 * Fails the PR check if docs/docs.json is modified on any branch that is not
 * a docs-only branch (pattern: docs/* or chore/docs-*).
 *
 * Usage: node scripts/check-docs-json-contamination.mjs
 * CI:    runs on pull_request events
 */
import { execSync } from "node:child_process";

function getChangedFiles() {
  try {
    const base = process.env.GITHUB_BASE_REF
      ? `origin/${process.env.GITHUB_BASE_REF}`
      : "HEAD~1";
    return execSync(`git diff --name-only ${base}...HEAD`, {
      encoding: "utf8",
      stdio: "pipe",
    })
      .trim()
      .split("\n")
      .filter(Boolean);
  } catch {
    return [];
  }
}

function getCurrentBranch() {
  try {
    return execSync("git branch --show-current", {
      encoding: "utf8",
      stdio: "pipe",
    }).trim();
  } catch {
    return "";
  }
}

const changed = getChangedFiles();
const docsJsonChanged = changed.some((f) => f === "docs/docs.json");
const branch = getCurrentBranch();
const isDocsBranch = /^docs\//.test(branch) || /^chore\/docs-/.test(branch);

if (docsJsonChanged && !isDocsBranch) {
  console.error(`
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
  process.exit(1);
}

if (docsJsonChanged && isDocsBranch) {
  console.log(`✅ docs/docs.json changes on docs-only branch: ${branch}`);
} else {
  console.log("✅ No docs/docs.json changes detected");
}
