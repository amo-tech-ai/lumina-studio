/**
 * IPI-369 · CRM-AI-003 Phase A — deterministic deal health score.
 * Zero LLM calls. Formula versioned so pipeline / tools can evolve safely.
 */

export const DEAL_HEALTH_SCORE_VERSION = "v1";

/** Open deals at or below this score are "at risk" for focus filtering. */
export const DEAL_HEALTH_AT_RISK_THRESHOLD = 50;

const MS_PER_DAY = 86_400_000;

export type ScoreDealHealthDeal = {
  id: string;
  company_id: string | null;
  stage: string;
  updated_at: string;
  expected_close_date: string | null;
  owner: string | null;
  value: number | null;
};

export type ScoreDealHealthActivity = {
  id: string;
  /** Prefer created_at; completed_at used when present for "last touch". */
  created_at: string;
  completed_at?: string | null;
};

export type ScoreDealHealthInput = {
  deal: ScoreDealHealthDeal;
  activities?: ScoreDealHealthActivity[];
  /** Injected clock for unit tests — defaults to `new Date()`. */
  now?: Date;
  focus?: "all" | "at_risk";
};

export type ScoreDealHealthResult = {
  score: number;
  reasons: string[];
  scoreVersion: string;
  asOf: string;
  evidenceIds: string[];
  /** False when `focus: "at_risk"` and the deal is not at risk. */
  matchesFocus: boolean;
};

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function daysBetween(iso: string, now: Date): number {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return 0;
  return Math.floor((now.getTime() - t) / MS_PER_DAY);
}

function lastActivityTouchIso(activities: ScoreDealHealthActivity[]): string | null {
  let best: string | null = null;
  let bestMs = -Infinity;
  for (const a of activities) {
    const iso = a.completed_at || a.created_at;
    const ms = Date.parse(iso);
    if (Number.isNaN(ms)) continue;
    if (ms > bestMs) {
      bestMs = ms;
      best = iso;
    }
  }
  return best;
}

/**
 * Pure deal-health scorer. Callers load org-scoped rows; this never touches
 * the network or an LLM.
 */
export function scoreDealHealth(input: ScoreDealHealthInput): ScoreDealHealthResult {
  const now = input.now ?? new Date();
  const asOf = now.toISOString();
  const { deal } = input;
  const activities = input.activities ?? [];
  const focus = input.focus ?? "all";

  const evidenceIds = new Set<string>([deal.id]);
  if (deal.company_id) evidenceIds.add(deal.company_id);
  for (const a of activities) evidenceIds.add(a.id);

  const reasons: string[] = [];

  if (deal.stage === "won") {
    reasons.push("Deal is closed won.");
    const result: ScoreDealHealthResult = {
      score: 100,
      reasons,
      scoreVersion: DEAL_HEALTH_SCORE_VERSION,
      asOf,
      evidenceIds: [...evidenceIds],
      matchesFocus: true,
    };
    if (focus === "at_risk") result.matchesFocus = false;
    return result;
  }

  if (deal.stage === "lost") {
    reasons.push("Deal is closed lost.");
    const result: ScoreDealHealthResult = {
      score: 0,
      reasons,
      scoreVersion: DEAL_HEALTH_SCORE_VERSION,
      asOf,
      evidenceIds: [...evidenceIds],
      matchesFocus: true,
    };
    // Match pipeline at-risk: terminal deals are never actionable risk.
    if (focus === "at_risk") result.matchesFocus = false;
    return result;
  }

  let score = 100;

  const staleDays = daysBetween(deal.updated_at, now);
  if (staleDays >= 7) {
    const penalty = Math.min(40, (staleDays - 6) * 5);
    score -= penalty;
    reasons.push(`No deal update in ${staleDays} day(s) (−${penalty}).`);
  } else {
    reasons.push(`Deal updated within ${Math.max(0, staleDays)} day(s).`);
  }

  if (deal.expected_close_date) {
    const closeDays = daysBetween(deal.expected_close_date, now);
    // expected_close_date in the past → closeDays > 0
    if (closeDays > 0) {
      score -= 25;
      reasons.push(`Expected close date is ${closeDays} day(s) overdue (−25).`);
    }
  }

  if (!deal.owner) {
    score -= 5;
    reasons.push("No owner assigned (−5).");
  }

  if (
    (deal.stage === "proposal" || deal.stage === "negotiation") &&
    (deal.value === null || deal.value === undefined)
  ) {
    score -= 10;
    reasons.push(`Stage ${deal.stage} has no deal value (−10).`);
  }

  if ((deal.stage === "proposal" || deal.stage === "negotiation") && staleDays >= 14) {
    score -= 10;
    reasons.push(`Late-stage deal idle ${staleDays} day(s) (−10).`);
  }

  const lastTouch = lastActivityTouchIso(activities);
  if (activities.length === 0) {
    score -= 10;
    reasons.push("No timeline activities on record (−10).");
  } else if (lastTouch) {
    const activityAge = daysBetween(lastTouch, now);
    if (activityAge >= 14) {
      score -= 15;
      reasons.push(`Last activity ${activityAge} day(s) ago (−15).`);
    } else {
      reasons.push(`Recent activity within ${activityAge} day(s).`);
    }
  }

  const finalScore = clampScore(score);
  const atRisk = finalScore <= DEAL_HEALTH_AT_RISK_THRESHOLD;
  if (atRisk) {
    reasons.push(`Score ${finalScore} ≤ ${DEAL_HEALTH_AT_RISK_THRESHOLD} (at risk).`);
  }

  return {
    score: finalScore,
    reasons,
    scoreVersion: DEAL_HEALTH_SCORE_VERSION,
    asOf,
    evidenceIds: [...evidenceIds],
    matchesFocus: focus === "all" || atRisk,
  };
}
