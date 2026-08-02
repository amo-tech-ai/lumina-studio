#!/usr/bin/env node
/**
 * Regression tests for worktree-audit.mjs PR lookup correctness.
 * Tests the fix for PR #720: prevent marking active worktrees safe to delete
 * when a branch name has been reused across multiple PRs.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Mock the classify function to test PR state handling
function classify(entry, pr, tracking, age, isMain, dirty) {
  if (isMain) return { status: "main", emoji: "🏠", safeToDelete: false, score: 100 };

  if ((pr?.state === "MERGED" || tracking.gone) && dirty === 0) {
    return { status: "merged", emoji: "⚪", safeToDelete: true, score: 90 };
  }
  // Merged PR but uncommitted files: not safe to auto-delete, but not active work
  if (pr?.state === "MERGED") {
    return { status: "merged-dirty", emoji: "🟠", safeToDelete: false, score: 45 };
  }
  if (tracking.gone && dirty > 0) {
    return { status: "stale-dirty", emoji: "🔴", safeToDelete: false, score: 30 };
  }
  if (tracking.gone) {
    return { status: "stale", emoji: "🔴", safeToDelete: true, score: 40 };
  }
  if (pr?.state === "OPEN" && pr.isDraft) {
    return { status: "waiting", emoji: "🟡", safeToDelete: false, score: 70 };
  }
  if (pr?.state === "OPEN") {
    return { status: "active-pr", emoji: "🟢", safeToDelete: false, score: 85 };
  }
  if (age && age.days > 14 && dirty === 0) {
    return { status: "idle", emoji: "🟡", safeToDelete: false, score: 55 };
  }
  return { status: "active", emoji: "🟢", safeToDelete: false, score: dirty ? 80 : 75 };
}

// Test the PR deduplication logic
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
    assert.equal(pr.safeToDelete, undefined); // Will be set by classify
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
  it("reused branch with new OPEN PR + old MERGED PR picks OPEN", () => {
    const prs = [
      { headRefName: "ipi/123-feature", state: "MERGED", number: 123, createdAt: "2026-07-01T00:00:00Z" },
      { headRefName: "ipi/123-feature", state: "OPEN", number: 456, createdAt: "2026-08-01T00:00:00Z" },
    ];
    const lookup = buildPrLookup(prs);
    const pr = lookup.get("ipi/123-feature");
    
    // Should pick the OPEN PR
    assert.equal(pr.state, "OPEN");
    assert.equal(pr.number, 456);
    
    // Classification should mark as active, not safe to delete
    const result = classify({}, pr, { gone: false }, null, false, 0);
    assert.equal(result.status, "active-pr");
    assert.equal(result.safeToDelete, false);
  });

  it("only MERGED PR for branch marks clean worktree as safe", () => {
    const prs = [
      { headRefName: "ipi/123-feature", state: "MERGED", number: 123, createdAt: "2026-07-01T00:00:00Z" },
    ];
    const lookup = buildPrLookup(prs);
    const pr = lookup.get("ipi/123-feature");
    
    assert.equal(pr.state, "MERGED");
    
    // Clean merged worktree should be safe to delete
    const result = classify({}, pr, { gone: false }, null, false, 0);
    assert.equal(result.status, "merged");
    assert.equal(result.safeToDelete, true);
  });

  it("no PR found for branch falls back to tracking status", () => {
    const prs = [];
    const lookup = buildPrLookup(prs);
    const pr = lookup.get("ipi/123-feature");
    
    assert.equal(pr, undefined);
    
    // With gone remote and clean, should be safe to delete (merged status due to tracking.gone)
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
    
    // Dirty merged worktree should NOT be safe to delete
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
    
    // Clean merged worktree should be safe to delete
    const result = classify({}, pr, { gone: false }, null, false, 0);
    assert.equal(result.status, "merged");
    assert.equal(result.safeToDelete, true);
  });
});
