import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classifyBlockers, hasStaleGroqImport } from "./worktree-health-checks.mjs";

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
});
