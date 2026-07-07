import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  classifyBlockers,
  hasStaleGroqImport,
  parseWorktreeListPorcelain,
  resolveMaxBehind,
} from "./worktree-health-checks.mjs";

describe("hasStaleGroqImport", () => {
  it("detects the pre-IPI-428 static import", () => {
    const content = 'import groqModelsJson from "../../../../config/groq-models.json";\n';
    assert.equal(hasStaleGroqImport(content), true);
  });

  it("does not flag the fixed readFileSync-based loader", () => {
    const content = `
      const path = join(MODULE_DIR, "..", "..", "..", "..", "config", "groq-models.json");
      return JSON.parse(readFileSync(path, "utf8"));
    `;
    assert.equal(hasStaleGroqImport(content), false);
  });

  it("does not flag unrelated imports", () => {
    const content = 'import { createGeminiLanguageModel } from "./gemini-registry";\n';
    assert.equal(hasStaleGroqImport(content), false);
  });
});

describe("classifyBlockers", () => {
  it("returns no blockers when clean and within threshold", () => {
    const blockers = classifyBlockers({ groqStaleImport: false, behind: 5, maxBehind: 30 });
    assert.deepEqual(blockers, []);
  });

  it("hard-blocks on stale Groq import regardless of behind count", () => {
    const blockers = classifyBlockers({ groqStaleImport: true, behind: 0, maxBehind: 30 });
    assert.equal(blockers.length, 1);
    assert.match(blockers[0], /HARD BLOCK/);
  });

  it("soft-blocks when behind exceeds threshold", () => {
    const blockers = classifyBlockers({ groqStaleImport: false, behind: 31, maxBehind: 30 });
    assert.equal(blockers.length, 1);
    assert.match(blockers[0], /SOFT BLOCK/);
  });

  it("does not soft-block exactly at the threshold", () => {
    const blockers = classifyBlockers({ groqStaleImport: false, behind: 30, maxBehind: 30 });
    assert.deepEqual(blockers, []);
  });

  it("can report both blockers at once", () => {
    const blockers = classifyBlockers({ groqStaleImport: true, behind: 100, maxBehind: 30 });
    assert.equal(blockers.length, 2);
  });

  it("ignores unpushed commits in start mode (default)", () => {
    const blockers = classifyBlockers({ groqStaleImport: false, behind: 0, maxBehind: 30, unpushedCommits: 3 });
    assert.deepEqual(blockers, []);
  });

  it("ignores unpushed commits in start mode even when explicit", () => {
    const blockers = classifyBlockers({
      groqStaleImport: false,
      behind: 0,
      maxBehind: 30,
      unpushedCommits: 3,
      mode: "start",
    });
    assert.deepEqual(blockers, []);
  });

  it("hard-blocks on unpushed commits in delete mode", () => {
    const blockers = classifyBlockers({
      groqStaleImport: false,
      behind: 0,
      maxBehind: 30,
      unpushedCommits: 1,
      mode: "delete",
    });
    assert.equal(blockers.length, 1);
    assert.match(blockers[0], /HARD BLOCK \(pre-delete\)/);
  });

  it("does not block in delete mode when there are zero unpushed commits", () => {
    const blockers = classifyBlockers({
      groqStaleImport: false,
      behind: 0,
      maxBehind: 30,
      unpushedCommits: 0,
      mode: "delete",
    });
    assert.deepEqual(blockers, []);
  });

  it("blocks with an UNKNOWN blocker when a check couldn't run, even if everything else looks clean", () => {
    const blockers = classifyBlockers({
      groqStaleImport: false,
      behind: 0,
      maxBehind: 30,
      checkError: "couldn't compute ahead/behind vs origin/main: fatal: not a git repository",
    });
    assert.equal(blockers.length, 1);
    assert.match(blockers[0], /UNKNOWN \(treated as unsafe\)/);
    assert.match(blockers[0], /not a git repository/);
  });

  it("reports both the check error and any other real blockers together", () => {
    const blockers = classifyBlockers({
      groqStaleImport: true,
      behind: 100,
      maxBehind: 30,
      checkError: "git fetch failed",
    });
    assert.equal(blockers.length, 3);
  });
});

describe("resolveMaxBehind", () => {
  it("uses the fallback when no value was passed", () => {
    const { value, error } = resolveMaxBehind(undefined, 30);
    assert.equal(value, 30);
    assert.equal(error, null);
  });

  it("accepts a valid non-negative number", () => {
    const { value, error } = resolveMaxBehind("50", 30);
    assert.equal(value, 50);
    assert.equal(error, null);
  });

  it("accepts zero", () => {
    const { value, error } = resolveMaxBehind("0", 30);
    assert.equal(value, 0);
    assert.equal(error, null);
  });

  it("rejects a non-numeric value instead of silently disabling the soft-block check", () => {
    const { value, error } = resolveMaxBehind("abc", 30);
    assert.equal(value, 30); // fallback returned, but caller must check `error` and refuse to proceed
    assert.match(error, /Invalid --max-behind value "abc"/);
  });

  it("rejects a negative number", () => {
    const { value, error } = resolveMaxBehind("-5", 30);
    assert.equal(value, 30);
    assert.match(error, /Invalid --max-behind value "-5"/);
  });

  it("rejects an empty string", () => {
    const { error } = resolveMaxBehind("", 30);
    assert.match(error, /Invalid --max-behind value ""/);
  });
});

describe("parseWorktreeListPorcelain", () => {
  it("parses a normal multi-worktree listing", () => {
    const raw = [
      "worktree /home/sk/ipix",
      "HEAD 0873d73a4b0acc9b712dff2f6b8bb5a2cfc94974",
      "branch refs/heads/main",
      "",
      "worktree /home/sk/wt-ipi-358-followup",
      "HEAD 20f0157a",
      "branch refs/heads/ipi/358-followup-test-rigor",
      "",
    ].join("\n");
    const entries = parseWorktreeListPorcelain(raw);
    assert.deepEqual(entries, [
      { path: "/home/sk/ipix", branch: "main" },
      { path: "/home/sk/wt-ipi-358-followup", branch: "ipi/358-followup-test-rigor" },
    ]);
  });

  it("reports a detached-HEAD worktree with branch: null", () => {
    const raw = ["worktree /home/sk/wt-exp", "HEAD abc123", "detached", ""].join("\n");
    const entries = parseWorktreeListPorcelain(raw);
    assert.deepEqual(entries, [{ path: "/home/sk/wt-exp", branch: null }]);
  });

  it("returns an empty array for empty input", () => {
    assert.deepEqual(parseWorktreeListPorcelain(""), []);
  });

  it("handles a single worktree with no trailing blank line", () => {
    const raw = "worktree /home/sk/ipix\nHEAD 0873d73a\nbranch refs/heads/main";
    const entries = parseWorktreeListPorcelain(raw);
    assert.deepEqual(entries, [{ path: "/home/sk/ipix", branch: "main" }]);
  });
});
