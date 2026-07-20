import { describe, expect, it } from "vitest";

import {
  DEAL_HEALTH_AT_RISK_THRESHOLD,
  DEAL_HEALTH_SCORE_VERSION,
  scoreDealHealth,
  type ScoreDealHealthDeal,
} from "./score-deal-health";

const NOW = new Date("2026-07-20T12:00:00.000Z");

function deal(partial: Partial<ScoreDealHealthDeal> & Pick<ScoreDealHealthDeal, "id">): ScoreDealHealthDeal {
  return {
    company_id: "co-1",
    stage: "lead",
    updated_at: "2026-07-18T12:00:00.000Z",
    expected_close_date: null,
    owner: "owner-1",
    value: 1000,
    ...partial,
  };
}

describe("scoreDealHealth", () => {
  it("returns versioned shape with evidence ids", () => {
    const result = scoreDealHealth({
      deal: deal({ id: "d-1" }),
      activities: [{ id: "a-1", created_at: "2026-07-19T12:00:00.000Z" }],
      now: NOW,
    });
    expect(result.scoreVersion).toBe(DEAL_HEALTH_SCORE_VERSION);
    expect(result.asOf).toBe(NOW.toISOString());
    expect(result.evidenceIds).toEqual(expect.arrayContaining(["d-1", "co-1", "a-1"]));
    expect(result.reasons.length).toBeGreaterThan(0);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("scores closed won at 100 and excludes from at_risk focus", () => {
    const all = scoreDealHealth({ deal: deal({ id: "d-w", stage: "won" }), now: NOW, focus: "all" });
    expect(all.score).toBe(100);
    expect(all.matchesFocus).toBe(true);

    const risk = scoreDealHealth({ deal: deal({ id: "d-w", stage: "won" }), now: NOW, focus: "at_risk" });
    expect(risk.matchesFocus).toBe(false);
  });

  it("scores closed lost at 0", () => {
    const result = scoreDealHealth({ deal: deal({ id: "d-l", stage: "lost" }), now: NOW });
    expect(result.score).toBe(0);
    expect(result.reasons.some((r) => /lost/i.test(r))).toBe(true);
  });

  it("penalizes long staleness into at-risk range", () => {
    const result = scoreDealHealth({
      deal: deal({
        id: "d-stale",
        stage: "negotiation",
        updated_at: "2026-06-01T12:00:00.000Z",
        owner: null,
        value: null,
      }),
      activities: [],
      now: NOW,
      focus: "at_risk",
    });
    expect(result.score).toBeLessThanOrEqual(DEAL_HEALTH_AT_RISK_THRESHOLD);
    expect(result.matchesFocus).toBe(true);
  });

  it("penalizes overdue expected_close_date", () => {
    const fresh = scoreDealHealth({
      deal: deal({ id: "d-ok", updated_at: "2026-07-19T12:00:00.000Z" }),
      activities: [{ id: "a-1", created_at: "2026-07-19T12:00:00.000Z" }],
      now: NOW,
    });
    const overdue = scoreDealHealth({
      deal: deal({
        id: "d-due",
        updated_at: "2026-07-19T12:00:00.000Z",
        expected_close_date: "2026-07-01",
      }),
      activities: [{ id: "a-1", created_at: "2026-07-19T12:00:00.000Z" }],
      now: NOW,
    });
    expect(overdue.score).toBe(fresh.score - 25);
    expect(overdue.reasons.some((r) => /overdue/i.test(r))).toBe(true);
  });

  it("treats healthy recent deals as not matching at_risk focus", () => {
    const result = scoreDealHealth({
      deal: deal({ id: "d-healthy", updated_at: "2026-07-19T12:00:00.000Z" }),
      activities: [{ id: "a-1", created_at: "2026-07-19T12:00:00.000Z" }],
      now: NOW,
      focus: "at_risk",
    });
    expect(result.score).toBeGreaterThan(DEAL_HEALTH_AT_RISK_THRESHOLD);
    expect(result.matchesFocus).toBe(false);
  });

  it("clamps score to 0..100", () => {
    const result = scoreDealHealth({
      deal: deal({
        id: "d-floor",
        stage: "negotiation",
        updated_at: "2025-01-01T12:00:00.000Z",
        expected_close_date: "2025-01-02",
        owner: null,
        value: null,
      }),
      activities: [],
      now: NOW,
    });
    expect(result.score).toBe(0);
  });
});
