#!/usr/bin/env node
/**
 * Detect files silently reverted by a merge into a feature branch.
 *
 * When a branch is merged into main and then merged BACK into the feature
 * branch (common pattern: "git merge main into feature"), git may resolve
 * file-level conflicts by taking main's version, which can silently wipe
 * in-progress feature work.
 *
 * This script walks the merge commits on the current branch, finds the last
 * commit on the feature side before each merge, and checks if any file that
 * was changed by the feature branch reverts to match main's version after
 * the merge.
 *
 * Usage: node scripts/detect-merge-regressions.mjs
 * CI:    runs on pull_request events (post-merge into feature branch)
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

function run(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: "pipe" }).trim();
  } catch {
    return "";
  }
}

function getMergeCommits() {
  // Get merge commits that merged main into this branch
  return run("git log --merges --pretty=format:%H^^^%H --no-merges")
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("^^^");
      return { merge: parts[0], parent1: parts[1], parent2: parts[2] };
    });
}

function getFileContent(sha, path) {
  try {
    return execSync(`git show ${sha}:${path}`, {
      encoding: "utf8",
      stdio: "pipe",
    });
  } catch {
    return null;
  }
}

function getChangedFiles(sha) {
  return run(`git diff-tree --no-commit-id --name-only -r ${sha}`)
    .split("\n")
    .filter(Boolean);
}

// Simpler approach: compare HEAD against the merge base with main
// and flag files where HEAD content == main content but the file was
// changed in intermediate commits on this branch
function main() {
  const currentBranch = run("git branch --show-current");
  const baseRef = process.env.GITHUB_BASE_REF || "main";

  // Get the merge base
  const mergeBase = run(`git merge-base origin/${baseRef} HEAD`);
  if (!mergeBase) {
    console.log("⚠️ Could not determine merge base — skipping merge regression check");
    return;
  }

  // Get all commits on this branch since the merge base
  const branchCommits = run(
    `git rev-list --reverse ${mergeBase}..HEAD`
  )
    .split("\n")
    .filter(Boolean);

  if (branchCommits.length === 0) {
    console.log("✅ No commits on this branch relative to base");
    return;
  }

  // Find merge commits where one parent is on the base branch
  let regressions = [];

  for (let i = 0; i < branchCommits.length; i++) {
    const sha = branchCommits[i];
    const parents = run(`git rev-list --parents -n 1 ${sha}`).split(" ").slice(1);

    if (parents.length === 2) {
      // This is a merge commit — check if one parent is the merge base
      const isMainMerge = parents.some(
        (p) =>
          p === mergeBase ||
          run(`git merge-base --is-ancestor ${p} ${mergeBase} 2>/dev/null && echo yes`).trim() === "yes"
      );

      if (isMainMerge) {
        // Check files changed by this merge
        const changedFiles = getChangedFiles(sha);
        const featureParent = parents.find((p) => p !== mergeBase && !changedFiles.includes("") ) || parents[0];

        for (const file of changedFiles) {
          const mainContent = getFileContent(mergeBase, file);
          const featureContent = getFileContent(featureParent, file);
          const mergeContent = getFileContent(sha, file);

          // If main and merge content are identical, but feature had
          // different content, the merge may have clobbered feature work
          if (
            mainContent !== null &&
            mergeContent !== null &&
            featureContent !== null &&
            mainContent === mergeContent &&
            mainContent !== featureContent
          ) {
            regressions.push({ file, mergeCommit: sha });
          }
        }
      }
    }
  }

  if (regressions.length > 0) {
    console.error(`
🔴 Merge regression detected in ${regressions.length} file(s):

The following files were changed by this branch but their content at HEAD
matches the merge-base (main), suggesting a merge silently reverted them:

${regressions.map((r) => `  ${r.file} (merge: ${r.mergeCommit.slice(0, 10)})`).join("\n")}

This pattern occurred when PR #921 (Create docs.json) was merged into IPI-750:
the merge resolved file conflicts against f71824774's stale version, wiping
out ensureCfEnvOnContext and other IPI-750 changes.

Fix: After merging, always run:
  git diff <last-feature-commit>..HEAD --stat
to verify no feature files were silently reverted.
`);
    process.exit(1);
  }

  console.log("✅ No merge regressions detected");
}

main();
