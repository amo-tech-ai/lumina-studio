#!/usr/bin/env node
/**
 * Regression tests for worktree-audit.mjs PR lookup correctness.
 * Tests the fix for PR #720: prevent marking active worktrees safe to delete
 * when a branch name has been reused across multiple PRs.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Import the actual production functions from worktree-audit.mjs
const {
  classify,
  buildReport,
} = await import("./worktree-audit.mjs");

// Test the PR deduplication logic (mirrors production logic)
function buildPrLookup(prs) {
  const prLookup = new Map();
  for (const pr of prs.filter(Boolean)) {
    const existing = prLookup.get(pr.headRefName);
    if (!existing) {
      prLookup.set(pr.headRefName, pr);
    } else {
      // Prefer OPEN over any other state
      if (pr.state === "OPEN" && existing.state !== "OPEN") {
        prLookup.set(pr.headRefName, pr);
      }
      // If same state, prefer newer by createdAt
      else if (pr.state === existing.state && pr.createdAt > existing.createdAt) {
        prLookup.set(pr.headRefName, pr);
      }
    }
  }
  return prLookup;
}

describe("worktree-audit PR lookup correctness", () => {
  it("prefers OPEN PR over older MERGED PR for same branch", () => {
    const prs = [
      { headRefName: "feature/test", state: "MERGED", number: 100, createdAt: "2026-07-01T00:00:00Z" },
      { headRefName: "feature/test", state: "OPEN", number: 200, createdAt: "2026-08-01T00:00:00Z" },
    ];
    const lookup = buildPrLookup(prs);
    const pr = lookup.get("feature/test");
    assert.equal(pr.state, "OPEN");
    assert.equal(pr.number, 200);
  });

  it("prefers newer PR when both have same state", () => {
    const prs = [
      { headRefName: "feature/test", state: "MERGED", number: 100, createdAt: "2026-07-01T00:00:00Z" },
      { headRefName: "feature/test", state: "MERGED", number: 150, createdAt: "2026-07-15T00:00:00Z" },
    ];
    const lookup = buildPrLookup(prs);
    const pr = lookup.get("feature/test");
    assert.equal(pr.state, "MERGED");
    assert.equal(pr.number, 150);
  });

  it("handles single PR correctly", () => {
    const prs = [{ headRefName: "feature/test", state: "OPEN", number: 200, createdAt: "2026-08-01T00:00:00Z" }];
    const lookup = buildPrLookup(prs);
    const pr = lookup.get("feature/test");
    assert.equal(pr.state, "OPEN");
    assert.equal(pr.number, 200);
  });

  it("returns null for non-existent branch", () => {
    const prs = [{ headRefName: "feature/other", state: "OPEN", number: 200 }];
    const lookup = buildPrLookup(prs);
    const pr = lookup.get("feature/test");
    assert.equal(pr, undefined);
  });
});

describe("worktree-audit classification with PR states", () => {
  it("merged + clean = safe to delete", () => {
    const entry = {};
    const pr = { state: "MERGED" };
    const tracking = { gone: false };
    const age = null;
    const isMain = false;
    const dirty = 0;
    const result = classify(entry, pr, tracking, age, isMain, dirty);
    assert.equal(result.status, "merged");
    assert.equal(result.safeToDelete, true);
  });

  it("merged + dirty = not safe to delete (merged-dirty)", () => {
    const entry = {};
    const pr = { state: "MERGED" };
    const tracking = { gone: false };
    const age = null;
    const isMain = false;
    const dirty = 5;
    const result = classify(entry, pr, tracking, age, isMain, dirty);
    assert.equal(result.status, "merged-dirty");
    assert.equal(result.emoji, "🟠");
    assert.equal(result.safeToDelete, false);
  });

  it("OPEN PR = not safe to delete (active-pr)", () => {
    const entry = {};
    const pr = { state: "OPEN", isDraft: false };
    const tracking = { gone: false };
    const age = null;
    const isMain = false;
    const dirty = 0;
    const result = classify(entry, pr, tracking, age, isMain, dirty);
    assert.equal(result.status, "active-pr");
    assert.equal(result.emoji, "🟢");
    assert.equal(result.safeToDelete, false);
  });

  it("OPEN draft PR = not safe to delete (waiting)", () => {
    const entry = {};
    const pr = { state: "OPEN", isDraft: true };
    const tracking = { gone: false };
    const age = null;
    const isMain = false;
    const dirty = 0;
    const result = classify(entry, pr, tracking, age, isMain, dirty);
    assert.equal(result.status, "waiting");
    assert.equal(result.emoji, "🟡");
    assert.equal(result.safeToDelete, false);
  });

  it("no PR + gone + clean = safe to delete (merged status)", () => {
    const entry = {};
    const pr = null;
    const tracking = { gone: true };
    const age = null;
    const isMain = false;
    const dirty = 0;
    const result = classify(entry, pr, tracking, age, isMain, dirty);
    assert.equal(result.status, "merged");
    assert.equal(result.emoji, "⚪");
    assert.equal(result.safeToDelete, true);
  });

  it("no PR + gone + dirty = not safe to delete (stale-dirty)", () => {
    const entry = {};
    const pr = null;
    const tracking = { gone: true };
    const age = null;
    const isMain = false;
    const dirty = 3;
    const result = classify(entry, pr, tracking, age, isMain, dirty);
    assert.equal(result.status, "stale-dirty");
    assert.equal(result.emoji, "🔴");
    assert.equal(result.safeToDelete, false);
  });

  it("no PR + not gone + idle = not safe to delete (idle)", () => {
    const entry = {};
    const pr = null;
    const tracking = { gone: false };
    const age = { days: 20 };
    const isMain = false;
    const dirty = 0;
    const result = classify(entry, pr, tracking, age, isMain, dirty);
    assert.equal(result.status, "idle");
    assert.equal(result.emoji, "🟡");
    assert.equal(result.safeToDelete, false);
  });
});

describe("regression: reused branch name scenarios", () => {
  it("old merged + new open picks OPEN", () => {
    const prs = [
      { headRefName: "ipi/123-feature", state: "MERGED", number: 123, createdAt: "2026-07-01T00:00:00Z" },
      { headRefName: "ipi/123-feature", state: "OPEN", number: 456, createdAt: "2026-08-01T00:00:00Z" },
    ];
    const lookup = buildPrLookup(prs);
    const pr = lookup.get("ipi/123-feature");

    assert.equal(pr.state, "OPEN");
    assert.equal(pr.number, 456);

    const result = classify({}, pr, { gone: false }, null, false, 0);
    assert.equal(result.status, "active-pr");
    assert.equal(result.safeToDelete, false);
  });

  it("old merged + newer closed picks newer", () => {
    const prs = [
      { headRefName: "ipi/123-feature", state: "CLOSED", number: 123, createdAt: "2026-07-01T00:00:00Z" },
      { headRefName: "ipi/123-feature", state: "CLOSED", number: 200, createdAt: "2026-07-15T00:00:00Z" },
    ];
    const lookup = buildPrLookup(prs);
    const pr = lookup.get("ipi/123-feature");

    assert.equal(pr.state, "CLOSED");
    assert.equal(pr.number, 200);
  });

  it("only MERGED PR for branch marks clean worktree as safe", () => {
    const prs = [
      { headRefName: "ipi/123-feature", state: "MERGED", number: 123, createdAt: "2026-07-01T00:00:00Z" },
    ];
    const lookup = buildPrLookup(prs);
    const pr = lookup.get("ipi/123-feature");

    assert.equal(pr.state, "MERGED");

    const result = classify({}, pr, { gone: false }, null, false, 0);
    assert.equal(result.status, "merged");
    assert.equal(result.safeToDelete, true);
  });

  it("no PR found for branch falls back to tracking status", () => {
    const prs = [];
    const lookup = buildPrLookup(prs);
    const pr = lookup.get("ipi/123-feature");

    assert.equal(pr, undefined);

    const result = classify({}, null, { gone: true }, null, false, 0);
    assert.equal(result.status, "merged");
    assert.equal(result.safeToDelete, true);
  });

  it("merged + dirty never auto-deletable", () => {
    const prs = [
      { headRefName: "ipi/123-feature", state: "MERGED", number: 123, createdAt: "2026-07-01T00:00:00Z" },
    ];
    const lookup = buildPrLookup(prs);
    const pr = lookup.get("ipi/123-feature");

    assert.equal(pr.state, "MERGED");

    const result = classify({}, pr, { gone: false }, null, false, 5);
    assert.equal(result.status, "merged-dirty");
    assert.equal(result.safeToDelete, false);
  });

  it("merged + clean is safe to delete", () => {
    const prs = [
      { headRefName: "ipi/123-feature", state: "MERGED", number: 123, createdAt: "2026-07-01T00:00:00Z" },
    ];
    const lookup = buildPrLookup(prs);
    const pr = lookup.get("ipi/123-feature");

    assert.equal(pr.state, "MERGED");

    const result = classify({}, pr, { gone: false }, null, false, 0);
    assert.equal(result.status, "merged");
    assert.equal(result.safeToDelete, true);
  });
});
