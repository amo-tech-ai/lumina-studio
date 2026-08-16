#!/usr/bin/env node
/**
 * Detect files silently reverted by a merge from main into a feature branch.
 *
 * When a branch is merged into main and then merged BACK into the feature
 * branch (common pattern: "git merge main into feature"), git may resolve
 * file-level conflicts by taking main's version, which can silently wipe
 * in-progress feature work.
 *
 * This script walks the merge commits on the current branch, finds the last
 * commit on the feature side before each merge, and checks if any file that
 * was changed by the feature branch reverts to match main's version after
 * the merge. It also checks the final HEAD so that a follow-up repair commit
 * can clear a previously detected regression.
 *
 * Fail-closed design: if the base ref is unavailable or the merge base cannot
 * be determined, the check FAILS rather than skipping.
 *
 * Usage: node scripts/detect-merge-regressions.mjs
 * CI:    runs on pull_request events (post-merge into feature branch)
 *        Requires full fetch-depth (fetch-depth: 0) and a git fetch of the base ref.
 */
import { execSync, execFileSync } from "node:child_process";

function run(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: "pipe" }).trim();
  } catch {
    return "";
  }
}

function runOrFail(cmd, message) {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: "pipe" }).trim();
  } catch (err) {
    console.error(`🔴 ${message}\nError: ${err.message}`);
    process.exit(1);
  }
}

function getFileContent(sha, path) {
  // Use execFileSync with array args to safely handle paths with
  // spaces, parentheses, and other special characters.
  // Returns null if the file doesn't exist at this ref.
  try {
    return execFileSync("git", ["cat-file", "-p", `${sha}:${path}`], {
      encoding: "utf8",
      stdio: "pipe",
    });
  } catch {
    return null;
  }
}

function getChangedFiles(sha, parents) {
  // For merge commits, `git diff-tree -r <sha>` returns nothing because git
  // uses combined-diff semantics for merges by default. Instead, enumerate
  // files changed relative to EACH parent and take the union.
  const changed = new Set();

  if (parents && parents.length >= 2) {
    for (const parent of parents) {
      const parentChanged = run(
        `git diff --no-commit-id --name-only ${parent} ${sha}`
      );
      parentChanged
        .split("\n")
        .filter(Boolean)
        .forEach((f) => changed.add(f.trim()));
    }
  } else {
    run(`git diff-tree --no-commit-id --name-only -r ${sha}`)
      .split("\n")
      .filter(Boolean)
      .forEach((f) => changed.add(f.trim()));
  }

  return Array.from(changed);
}

function getMergeCommits() {
  return run("git log --merges --pretty=format:%H^^^%H --no-merges")
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("^^^");
      return { merge: parts[0], parent1: parts[1], parent2: parts[2] };
    });
}

function isAncestor(ancestor, descendant) {
  try {
    execSync(`git merge-base --is-ancestor ${ancestor} ${descendant}`, {
      stdio: "pipe",
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Determine which parent of a merge commit is on the base side (main).
 * A parent is on the base side if it is an ancestor of the merge base,
 * OR if it IS the merge base.
 */
function findBaseParent(parents, mergeBase) {
  for (const p of parents) {
    if (p === mergeBase || isAncestor(p, mergeBase)) {
      return p;
    }
  }
  return null;
}

function main() {
  const baseRef = process.env.GITHUB_BASE_REF || "main";
  const baseRemote = `origin/${baseRef}`;

  // Fetch the base ref so origin/<base> is authoritative.
  runOrFail(
    `git fetch --no-tags origin "${baseRef}"`,
    `merge-regression-gate: could not fetch origin/${baseRef}. ` +
      `Fail-closed: base ref unavailable.`
  );

  // Get the merge base between the remote base and HEAD.
  const mergeBase = run(`git merge-base ${baseRemote} HEAD`);
  if (!mergeBase) {
    console.error(
      `🔴 merge-regression-gate: could not determine merge base between ` +
        `${baseRemote} and HEAD. Fail-closed: refusing to pass.`
    );
    process.exit(1);
  }

  // Get all commits on this branch since the merge base.
  const branchCommits = run(`git rev-list --reverse ${mergeBase}..HEAD`)
    .split("\n")
    .filter(Boolean);

  if (branchCommits.length === 0) {
    console.log("✅ No commits on this branch relative to base");
    return;
  }

  const branchCommitsSet = new Set(branchCommits);
  let regressions = [];

  for (const sha of branchCommits) {
    const parentsStr = run(`git rev-list --parents -n 1 ${sha}`);
    const parents = parentsStr.split(" ").slice(1);

    if (parents.length !== 2) {
      continue; // not a merge commit
    }

    // Only consider merges where one parent is on the base side.
    const baseParent = findBaseParent(parents, mergeBase);
    if (!baseParent) {
      continue;
    }

    const featureParent = parents.find((p) => p !== baseParent) || parents[0];

    // The divergence point is where the feature branch split from base.
    // Files added on base *after* this point are not "deleted by feature" —
    // they're new files that the merge correctly brought in.
    const divergencePoint = run(
      `git merge-base ${baseParent} ${featureParent}`
    );

    const changedFiles = getChangedFiles(sha, parents);

    for (const file of changedFiles) {
      const divergenceContent = getFileContent(divergencePoint, file);
      const featureContent = getFileContent(featureParent, file);
      const mergeContent = getFileContent(sha, file);
      const headContent = getFileContent("HEAD", file);

      // Skip files that don't exist at either the feature parent or the merge
      // (e.g., added+deleted edge cases where nobody has the file)
      if (featureContent === null && mergeContent === null) {
        continue;
      }

      // REGRESSION 1: merge clobbered feature work
      // The feature branch modified a file (featureContent differs from
      // divergenceContent), but the merge resolved it back to
      // divergenceContent, and HEAD still has divergenceContent.
      if (
        divergenceContent !== null &&
        featureContent !== null &&
        divergenceContent !== featureContent &&
        mergeContent === divergenceContent &&
        headContent === divergenceContent
      ) {
        regressions.push({
          file,
          mergeCommit: sha,
          reason: "merge clobbered feature modification",
        });
        continue;
      }

      // REGRESSION 2: feature-added file deleted by merge
      // The feature branch added a file (file didn't exist at divergence,
      // featureContent !== null), but the merge deleted it and HEAD
      // doesn't have it either.
      if (
        divergenceContent === null &&
        featureContent !== null &&
        mergeContent === null &&
        headContent === null
      ) {
        regressions.push({
          file,
          mergeCommit: sha,
          reason: "feature-added file deleted by merge",
        });
        continue;
      }

      // REGRESSION 3: feature-deleted file restored by merge
      // The feature branch deleted a file that existed at the divergence
      // point (divergenceContent !== null, featureContent === null), but
      // the merge restored it and HEAD still has the base version.
      if (
        divergenceContent !== null &&
        featureContent === null &&
        mergeContent === divergenceContent &&
        headContent === divergenceContent
      ) {
        regressions.push({
          file,
          mergeCommit: sha,
          reason: "feature-deleted file restored to base version by merge",
        });
        continue;
      }
    }
  }

  if (regressions.length > 0) {
    console.error(`
🔴 Merge regression detected in ${regressions.length} file(s):

${regressions
  .map(
    (r) =>
      `  ${r.file} (merge: ${r.mergeCommit.slice(0, 10)}) — ${r.reason}`
  )
  .join("\n")}

The following files were changed by this branch but their content at HEAD
matches the divergence point (where feature branched from base),
suggesting a merge silently reverted them.

This pattern occurred when PR #921 (Create docs.json) was merged into IPI-750:
the merge resolved file conflicts against f71824774's stale version, wiping
out ensureCfEnvOnContext and other IPI-750 changes.

Fix: After merging, always run:
  git diff <last-feature-commit>..HEAD --stat
to verify no feature files were silently reverted.

If a repair commit was applied after the merge, re-run this check — the
final HEAD state is what matters.
`);
    process.exit(1);
  }

  console.log("✅ No merge regressions detected");
}

main();
