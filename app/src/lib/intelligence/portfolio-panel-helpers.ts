import type { IntelligencePortfolio } from "@/lib/intelligence/panel-contract";

export function portfolioCountLabel(count: number): string {
  return `${count} brand${count === 1 ? "" : "s"}`;
}

export function portfolioBarWidth(score: number): string {
  return `${Math.min(100, Math.max(0, score))}%`;
}

export function portfolioDotColor(score: number): string {
  if (score >= 80) return "var(--color-approved, #059669)";
  if (score >= 60) return "var(--color-warning, #d97706)";
  return "var(--color-blocked, #dc2626)";
}

export function portfolioScoreColor(score: number): string {
  if (score >= 80) return "var(--color-text-primary, #111)";
  if (score >= 60) return "var(--color-warning-text, #92400e)";
  return "var(--color-blocked, #dc2626)";
}

export function portfolioBarColor(score: number): string {
  if (score >= 80) return "var(--dna-bar-high, #059669)";
  if (score >= 60) return "var(--dna-bar-mid, #d97706)";
  return "var(--dna-bar-low, #dc2626)";
}

export function resolvePortfolioForDisplay(
  portfolio: IntelligencePortfolio | undefined,
  padForDemo: boolean,
): IntelligencePortfolio {
  if (!portfolio) {
    return { brandCount: 0, avgDna: 0, healthRows: [], needsAttention: null };
  }
  if (!padForDemo || portfolio.healthRows.length >= 3) return portfolio;

  return portfolio;
}
