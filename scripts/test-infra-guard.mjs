#!/usr/bin/env node
/**
 * Synthetic negative-test matrix for INFRA-GUARD-001.
 *
 * Creates temporary git repos with a local "origin" remote (a bare repo),
 * simulates PR scenarios, and verifies that check-docs-json-contamination.mjs
 * and detect-merge-regressions.mjs behave correctly across all scenarios.
 *
 * Run: node scripts/test-infra-guard.mjs
 */
import { execSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = join(__dirname, "..");

let passed = 0;
let failed = 0;

function run(dir, cmd, opts = {}) {
  return execSync(cmd, {
    cwd: dir,
    encoding: "utf8",
    stdio: "pipe",
    env: { ...process.env, GITHUB_BASE_REF: "main" },
    ...opts,
  }).trim();
}

function failCheck(dir, cmd, label, script) {
  try {
    const scriptPath = join(repoRoot, script);
    run(dir, `node "${scriptPath}"`);
    console.log(`  ❌ ${label}: expected failure, got success`);
    failed++;
  } catch (err) {
    if (err.message.includes("exit code 1") || err.status === 1) {
      console.log(`  ✅ ${label}: correctly failed`);
      passed++;
    } else {
      console.log(`  ❌ ${label}: unexpected error`);
      console.error(`     ${err.message}`);
      failed++;
    }
  }
}

function passCheck(dir, cmd, label, script) {
  try {
    const scriptPath = join(repoRoot, script);
    run(dir, `node "${scriptPath}"`);
    console.log(`  ✅ ${label}: correctly passed`);
    passed++;
  } catch (err) {
    console.log(`  ❌ ${label}: expected pass, got failure`);
    console.error(`     ${err.stderr || err.message}`);
    failed++;
  }
}

function gitIdentity(dir) {
  run(dir, "git config user.email test@test.com");
  run(dir, "git config user.name Test");
}

function setupRepo() {
  const dir = mkdtempSync(join(tmpdir(), "infra-guard-test-"));
  const bareDir = mkdtempSync(join(tmpdir(), "infra-guard-bare-"));

  run(bareDir, "git init --bare");
  run(dir, "git init --initial-branch=main");
  gitIdentity(dir);
  run(dir, `git remote add origin "${bareDir}"`);

  mkdirSync(join(dir, "docs"), { recursive: true });
  mkdirSync(join(dir, "src"), { recursive: true });
  return { dir, bareDir };
}

function cleanup({ dir, bareDir }) {
  rmSync(dir, { recursive: true, force: true });
  rmSync(bareDir, { recursive: true, force: true });
}

function pushToOrigin(dir) {
  run(dir, "git push -u origin main --force");
}

// ─── Test 1: Code PR touching docs/docs.json → FAIL
function test1() {
  console.log("\n--- Test 1: Code PR touches docs/docs.json → FAIL ---");
  const { dir, bareDir } = setupRepo();
  try {
    writeFileSync(join(dir, "src.ts"), "code");
    writeFileSync(join(dir, "docs/docs.json"), '{"pages": ["home"]}');
    run(dir, "git add -A && git commit -m 'feat: code + docs.json'");

    failCheck(dir, "", "code PR with docs.json change",
      "scripts/check-docs-json-contamination.mjs");
  } finally { cleanup({ dir, bareDir }); }
}

// ─── Test 2: True docs-only PR on docs/* branch → PASS
function test2() {
  console.log("\n--- Test 2: True docs-only PR on docs/* branch → PASS ---");
  const { dir, bareDir } = setupRepo();
  try {
    writeFileSync(join(dir, "src.ts"), "code");
    writeFileSync(join(dir, "docs/docs.json"), '{"pages": ["home"]}');
    run(dir, "git add -A && git commit -m 'feat: code + docs.json'");
    pushToOrigin(dir);

    run(dir, "git checkout -b docs/test-page");
    writeFileSync(join(dir, "docs/docs.json"), '{"pages": ["about"]}');
    run(dir, "git add -A && git commit -m 'docs: add page'");

    passCheck(dir, "", "docs-only PR on docs/* branch",
      "scripts/check-docs-json-contamination.mjs");
  } finally { cleanup({ dir, bareDir }); }
}

// ─── Test 3: Docs branch also changes production code → FAIL
function test3() {
  console.log("\n--- Test 3: Docs branch changes production code → FAIL ---");
  const { dir, bareDir } = setupRepo();
  try {
    writeFileSync(join(dir, "docs/docs.json"), '{"pages": ["home"]}');
    writeFileSync(join(dir, "src/index.ts"), "production code");
    run(dir, "git add -A && git commit -m 'docs: + code'");
    run(dir, "git branch -M docs/test");

    failCheck(dir, "", "docs branch with production code",
      "scripts/check-docs-json-contamination.mjs");
  } finally { cleanup({ dir, bareDir }); }
}

// ─── Test 4: Missing/unavailable base ref → FAIL closed
function test4() {
  console.log("\n--- Test 4: Missing/unavailable base ref → FAIL closed ---");
  const { dir, bareDir } = setupRepo();
  try {
    writeFileSync(join(dir, "src.ts"), "code");
    run(dir, "git add -A && git commit -m 'feat'");
    run(dir, "git branch -M feature");

    try {
      const scriptPath = join(repoRoot, "scripts/check-docs-json-contamination.mjs");
      // No GITHUB_BASE_REF set
      execSync(`node "${scriptPath}"`, {
        cwd: dir,
        encoding: "utf8",
        stdio: "pipe",
        env: { ...process.env },
      });
      console.log("  ❌ missing GITHUB_BASE_REF → fail closed: expected failure");
      failed++;
    } catch (err) {
      console.log("  ✅ missing GITHUB_BASE_REF → fail closed: correctly failed");
      passed++;
    }
  } finally { cleanup({ dir, bareDir }); }
}

// ─── Test 5: Clean merge from main → PASS
function test5() {
  console.log("\n--- Test 5: Clean merge from main → PASS ---");
  const { dir, bareDir } = setupRepo();
  try {
    writeFileSync(join(dir, "base.txt"), "base");
    run(dir, "git add -A && git commit -m 'initial'");
    pushToOrigin(dir);

    run(dir, "git checkout -b feature");
    writeFileSync(join(dir, "feature.txt"), "feature work");
    run(dir, "git add -A && git commit -m 'feature work'");

    run(dir, "git merge origin/main --no-edit");

    passCheck(dir, "", "clean merge from main",
      "scripts/detect-merge-regressions.mjs");
  } finally { cleanup({ dir, bareDir }); }
}

// ─── Test 6: Merge clobbers feature modification → FAIL
function test6() {
  console.log("\n--- Test 6: Merge clobbers feature modification → FAIL ---");
  const { dir, bareDir } = setupRepo();
  try {
    writeFileSync(join(dir, "shared.txt"), "base");
    run(dir, "git add -A && git commit -m 'initial'");
    pushToOrigin(dir);

    run(dir, "git checkout -b feature");
    writeFileSync(join(dir, "shared.txt"), "feature work");
    run(dir, "git add -A && git commit -m 'feature work'");

    run(dir, "git checkout main");
    writeFileSync(join(dir, "main.txt"), "main change");
    run(dir, "git add -A && git commit -m 'main change'");
    pushToOrigin(dir);

    run(dir, "git checkout feature");
    // Fake a merge commit where feature work was clobbered:
    // 1. Create a tree where shared.txt = base content
    // 2. Create a merge commit with that tree and both parents
    writeFileSync(join(dir, "shared.txt"), "base");
    run(dir, "git add -A");
    const featureSha = run(dir, "git rev-parse HEAD");
    const mainSha = run(dir, "git rev-parse origin/main");
    const treeSha = run(dir, "git write-tree");
    const newCommit = run(dir, `git commit-tree ${treeSha} -p ${featureSha} -p ${mainSha} -m 'merge main'`);
    run(dir, `git reset --hard ${newCommit}`);

    failCheck(dir, "", "merge clobbering feature modification",
      "scripts/detect-merge-regressions.mjs");
  } finally { cleanup({ dir, bareDir }); }
}

// ─── Test 7: Feature-added file deleted by merge → FAIL
function test7() {
  console.log("\n--- Test 7: Feature-added file deleted by merge → FAIL ---");
  const { dir, bareDir } = setupRepo();
  try {
    writeFileSync(join(dir, "base.txt"), "base");
    run(dir, "git add -A && git commit -m 'initial'");
    pushToOrigin(dir);

    run(dir, "git checkout -b feature");
    writeFileSync(join(dir, "feature-file.txt"), "feature content");
    run(dir, "git add -A && git commit -m 'add feature file'");

    run(dir, "git checkout main");
    writeFileSync(join(dir, "main.txt"), "main change");
    run(dir, "git add -A && git commit -m 'main change'");
    pushToOrigin(dir);

    run(dir, "git checkout feature");
    // Create merge commit that deletes the feature file
    const featureSha = run(dir, "git rev-parse HEAD");
    const mainSha = run(dir, "git rev-parse origin/main");
    run(dir, "rm feature-file.txt");
    run(dir, "git add -A");
    const treeSha = run(dir, "git write-tree");
    const newCommit = run(dir, `git commit-tree ${treeSha} -p ${featureSha} -p ${mainSha} -m 'merge main'`);
    run(dir, `git reset --hard ${newCommit}`);

    failCheck(dir, "", "feature-added file deleted by merge",
      "scripts/detect-merge-regressions.mjs");
  } finally { cleanup({ dir, bareDir }); }
}

// ─── Test 8: Feature-deleted file restored by merge → FAIL
function test8() {
  console.log("\n--- Test 8: Feature-deleted file restored by merge → FAIL ---");
  const { dir, bareDir } = setupRepo();
  try {
    writeFileSync(join(dir, "shared.txt"), "base content");
    writeFileSync(join(dir, "feature.txt"), "feature file");
    run(dir, "git add -A && git commit -m 'initial'");
    pushToOrigin(dir);

    run(dir, "git checkout -b feature");
    run(dir, "git rm feature.txt");
    run(dir, "git commit -m 'delete feature file'");

    run(dir, "git checkout main");
    writeFileSync(join(dir, "main.txt"), "main change");
    run(dir, "git add -A && git commit -m 'main change'");
    pushToOrigin(dir);

    run(dir, "git checkout feature");
    // Create merge commit that restores the feature-deleted file from base
    const featureSha = run(dir, "git rev-parse HEAD");
    const mainSha = run(dir, "git rev-parse origin/main");
    // Restore feature.txt from main (which still has it = base)
    run(dir, "git checkout main -- feature.txt");
    run(dir, "git add -A");
    const treeSha = run(dir, "git write-tree");
    const newCommit = run(dir, `git commit-tree ${treeSha} -p ${featureSha} -p ${mainSha} -m 'merge main'`);
    run(dir, `git reset --hard ${newCommit}`);

    failCheck(dir, "", "feature-deleted file restored by merge",
      "scripts/detect-merge-regressions.mjs");
  } finally { cleanup({ dir, bareDir }); }
}

// ─── Test 9: Bad merge + repair commit → PASS after repair
function test9() {
  console.log("\n--- Test 9: Bad merge then repair → PASS ---");
  const { dir, bareDir } = setupRepo();
  try {
    writeFileSync(join(dir, "shared.txt"), "base");
    run(dir, "git add -A && git commit -m 'initial'");
    pushToOrigin(dir);

    run(dir, "git checkout -b feature");
    writeFileSync(join(dir, "shared.txt"), "feature work");
    run(dir, "git add -A && git commit -m 'feature work'");

    run(dir, "git checkout main");
    writeFileSync(join(dir, "main.txt"), "main");
    run(dir, "git add -A && git commit -m 'main change'");
    pushToOrigin(dir);

    run(dir, "git checkout feature");
    run(dir, "git merge origin/main --no-edit");
    // Clobber
    run(dir, "git checkout main -- shared.txt && git add -A && git commit -m 'clobber: restore base over feature'");

    // Repair
    writeFileSync(join(dir, "shared.txt"), "feature work");
    run(dir, "git add -A && git commit -m 'repair: restore feature work'");

    passCheck(dir, "", "bad merge + repair commit",
      "scripts/detect-merge-regressions.mjs");
  } finally { cleanup({ dir, bareDir }); }
}

// ─── Test 10: Path with spaces/parentheses in files → correctly inspected
function test10() {
  console.log("\n--- Test 10: Path with spaces/parentheses in files ---");
  const { dir, bareDir } = setupRepo();
  try {
    // Base commit on main with clean state
    writeFileSync(join(dir, "src.ts"), "code");
    run(dir, "git add -A && git commit -m 'initial'");
    pushToOrigin(dir);

    // Feature branch with docs/docs.json change + file with spaces in name
    run(dir, "git checkout -b feature-with-space");
    writeFileSync(join(dir, "docs/docs.json"), '{"pages": ["home"]}');
    writeFileSync(join(dir, "my file (v2).ts"), "code");
    run(dir, "git add -A && git commit -m 'feat: add docs + spaced file'");

    failCheck(dir, "", "docs.json change with paths containing spaces/parens",
      "scripts/check-docs-json-contamination.mjs");
  } finally { cleanup({ dir, bareDir }); }
}

// ─── Test 11: Multiple historical main merges → correct result
function test11() {
  console.log("\n--- Test 11: Multiple historical main merges → CORRECT ---");
  const { dir, bareDir } = setupRepo();
  try {
    writeFileSync(join(dir, "base.txt"), "base");
    run(dir, "git add -A && git commit -m 'initial'");
    pushToOrigin(dir);

    run(dir, "git checkout -b feature");
    writeFileSync(join(dir, "feat1.txt"), "f1");
    run(dir, "git add -A && git commit -m 'feat1'");
    run(dir, "git merge origin/main --no-edit");

    writeFileSync(join(dir, "feat2.txt"), "f2");
    run(dir, "git add -A && git commit -m 'feat2'");

    run(dir, "git checkout main");
    writeFileSync(join(dir, "main2.txt"), "m2");
    run(dir, "git add -A && git commit -m 'main2'");
    pushToOrigin(dir);

    run(dir, "git checkout feature");
    run(dir, "git merge origin/main --no-edit");

    passCheck(dir, "", "multiple historical merges, no regressions",
      "scripts/detect-merge-regressions.mjs");
  } finally { cleanup({ dir, bareDir }); }
}

// ─── Test 12: chore/docs-* branch can change docs.json → PASS
function test12() {
  console.log("\n--- Test 12: chore/docs-* branch can change docs.json → PASS ---");
  const { dir, bareDir } = setupRepo();
  try {
    writeFileSync(join(dir, "docs/docs.json"), '{"pages": ["new"]}');
    run(dir, "git add -A && git commit -m 'docs'");
    pushToOrigin(dir);
    run(dir, "git branch -M chore/docs-fix-nav");

    passCheck(dir, "", "chore/docs-* branch with docs.json change",
      "scripts/check-docs-json-contamination.mjs");
  } finally { cleanup({ dir, bareDir }); }
}

// ─── Test 15: Code PR deletes docs/docs.json → FAIL (AMRD)
function test15() {
  console.log("\n--- Test 15: Code PR deletes docs/docs.json → FAIL ---");
  const { dir, bareDir } = setupRepo();
  try {
    writeFileSync(join(dir, "docs/docs.json"), '{"pages": ["home"]}');
    writeFileSync(join(dir, "src.ts"), "code");
    run(dir, "git add -A && git commit -m 'initial'");
    pushToOrigin(dir);

    run(dir, "git checkout -b feature-delete-nav");
    run(dir, "git rm docs/docs.json");
    run(dir, "git commit -m 'feat: wipe docs.json'");

    failCheck(dir, "", "code PR that deletes docs.json",
      "scripts/check-docs-json-contamination.mjs");
  } finally { cleanup({ dir, bareDir }); }
}

// ─── Test 13: No docs/docs.json changes at all → PASS
function test13() {
  console.log("\n--- Test 13: No docs/docs.json changes → PASS ---");
  const { dir, bareDir } = setupRepo();
  try {
    writeFileSync(join(dir, "src.ts"), "code");
    run(dir, "git add -A && git commit -m 'feat'");
    pushToOrigin(dir);
    run(dir, "git branch -M some-feature");

    passCheck(dir, "", "no docs.json changes",
      "scripts/check-docs-json-contamination.mjs");
  } finally { cleanup({ dir, bareDir }); }
}

// ─── Test 14: Feature file unchanged through merge → PASS
function test14() {
  console.log("\n--- Test 14: Feature file unchanged through merge → PASS ---");
  const { dir, bareDir } = setupRepo();
  try {
    writeFileSync(join(dir, "base.txt"), "base");
    run(dir, "git add -A && git commit -m 'initial'");
    pushToOrigin(dir);

    run(dir, "git checkout -b feature");
    writeFileSync(join(dir, "feature.txt"), "feature work");
    run(dir, "git add -A && git commit -m 'feature work'");

    run(dir, "git checkout main");
    writeFileSync(join(dir, "main.txt"), "main change");
    run(dir, "git add -A && git commit -m 'main change'");
    pushToOrigin(dir);

    run(dir, "git checkout feature");
    run(dir, "git merge origin/main --no-edit");

    passCheck(dir, "", "feature file preserved through merge",
      "scripts/detect-merge-regressions.mjs");
  } finally { cleanup({ dir, bareDir }); }
}

console.log("=== INFRA-GUARD-001 · Synthetic Test Matrix ===\n");

test1();
test2();
test3();
test4();
test5();
test6();
test7();
test8();
test9();
test10();
test11();
test12();
test13();
test14();
test15();

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
