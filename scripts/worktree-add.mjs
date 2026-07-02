#!/usr/bin/env node
/**
 * Create an iPix worktree with standard naming + env bootstrap.
 *
 * Usage:
 *   node scripts/worktree-add.mjs IPI-286 route-aware-sections
 *   node scripts/worktree-add.mjs 286 route-aware-sections
 *   node scripts/worktree-add.mjs IPI-286 route-aware-sections --skip-install
 *
 * Creates:
 *   Path:   ../wt-ipi-286-route-aware-sections  (sibling of repo)
 *   Branch: ipi/286-route-aware-sections
 *   Base:   origin/main
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const PARENT = path.dirname(REPO_ROOT);

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const skipInstall = process.argv.includes("--skip-install");

if (args.length < 2) {
  console.error("Usage: node scripts/worktree-add.mjs IPI-286 short-name [--skip-install]");
  process.exit(1);
}

function run(cmd, cwd = REPO_ROOT) {
  execSync(cmd, { cwd, stdio: "inherit" });
}

function runOut(cmd, cwd = REPO_ROOT) {
  return execSync(cmd, { cwd, encoding: "utf8" }).trim();
}

const issueRaw = args[0].replace(/^IPI-/i, "");
const slug = args[1].toLowerCase().replace(/[^a-z0-9-]/g, "-");
const branch = `ipi/${issueRaw}-${slug}`;
const wtName = `wt-ipi-${issueRaw}-${slug}`;
const wtPath = path.join(PARENT, wtName);

if (fs.existsSync(wtPath)) {
  console.error(`Already exists: ${wtPath}`);
  process.exit(1);
}

// Nested guard
const gitDir = runOut("git rev-parse --git-dir");
const gitCommon = runOut("git rev-parse --git-common-dir");
if (path.resolve(gitDir) !== path.resolve(gitCommon)) {
  console.error("Refusing to nest: run from main repo checkout, not inside another worktree.");
  process.exit(1);
}

console.log(`Creating worktree:\n  path:   ${wtPath}\n  branch: ${branch}\n  base:   origin/main\n`);

let defaultBranch = "main";
try {
  defaultBranch = runOut("git symbolic-ref refs/remotes/origin/HEAD --short").replace("origin/", "");
} catch {}
run(`git fetch origin ${defaultBranch}`);
let branchExists = true;
try {
  execSync(`git show-ref --verify --quiet "refs/heads/${branch}"`, { cwd: REPO_ROOT });
} catch {
  branchExists = false;
}
if (branchExists) {
  console.log(`Branch ${branch} already exists locally — checking it out instead of creating.`);
  run(`git worktree add "${wtPath}" "${branch}"`);
} else {
  run(`git worktree add "${wtPath}" -b "${branch}" origin/${defaultBranch}`);
}

// Copy .worktreeinclude patterns
const includePath = path.join(REPO_ROOT, ".worktreeinclude");
if (fs.existsSync(includePath)) {
  const patterns = fs
    .readFileSync(includePath, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

  for (const pattern of patterns) {
    const src = path.join(REPO_ROOT, pattern);
    const dest = path.join(wtPath, pattern);
    if (!fs.existsSync(src)) continue;
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      fs.cpSync(src, dest, { recursive: true });
    } else {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
    }
    console.log(`  copied ${pattern}`);
  }
}

if (!skipInstall) {
  if (fs.existsSync(path.join(wtPath, "app/package.json"))) {
    console.log("  npm ci (app/)…");
    run("npm ci", path.join(wtPath, "app"));
  }
  if (fs.existsSync(path.join(wtPath, "package.json"))) {
    console.log("  npm ci (root)…");
    run("npm ci", wtPath);
  }
}

console.log(`
Done. Next:
  cd ${wtPath}
  npm run worktree:audit
  /pr
`);
