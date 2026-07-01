"use client";

import { useMemo, useState } from "react";

import type { IntelligenceHealthPillar, IntelligencePanelData } from "@/lib/intelligence/panel-contract";

import { AiInsightsSection } from "./ai-insights-section";
import { HealthSection } from "./health-section";
import { IntelApprovalQueueSection } from "./intel-approval-queue-section";
import { RecentActivitySection } from "./recent-activity-section";
import { RecommendedActionsSection } from "./recommended-actions-section";
import styles from "./intelligence-panel.module.css";
import { DnaScoresSection } from "./dna-scores-section";
import { useIntelligencePanel } from "@/lib/intelligence/use-intelligence-panel";

type Props = {
  pathname: string;
  activeBrandId: string | null;
  brandName: string | null;
};

type PanelTab = "overview" | "approvals" | "activity";

const TABS: { id: PanelTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "approvals", label: "Approvals" },
  { id: "activity", label: "Activity" },
];

function defaultHealthFromScores(data: IntelligencePanelData): IntelligenceHealthPillar[] | null {
  if (!data.scores) return null;
  const { dna, pillars } = data.scores;
  return [
    { key: "brand", label: "Brand", score: dna },
    { key: "visual", label: "Visual", score: pillars.visual ?? 0 },
    { key: "voice", label: "Voice", score: pillars.audience ?? pillars.consistency ?? 0 },
    { key: "commerce", label: "Commerce", score: pillars.commerce_readiness ?? 0 },
  ];
}

function dnaEvidence(data: IntelligencePanelData) {
  if (!data.scores || !data.brand) return null;
  return {
    title: `${data.brand.name} DNA`,
    score: data.scores.dna,
    potential: Math.min(100, data.scores.dna + 5),
    confidence: 88,
    why: "Composite of visual, voice, and commerce readiness pillars.",
    evidence: [{ text: "Scores derived from brand intelligence analysis." }],
  };
}

export function IntelligencePanel({
  pathname: _pathname,
  activeBrandId,
  brandName,
}: Props) {
  const { data, loading, error } = useIntelligencePanel(activeBrandId);
  const [tab, setTab] = useState<PanelTab>("overview");

  const displayName = data?.brand?.name ?? brandName;
  const brandStatus = data?.brand?.status ?? null;
  const dnaScore = data?.scores?.dna;
  const health = data?.health ?? (data ? defaultHealthFromScores(data) : null);
  const dnaExplain = useMemo(() => (data ? dnaEvidence(data) : null), [data]);

  const showOverview = tab === "overview";
  const showApprovals = tab === "approvals" || showOverview;
  const showActivity = tab === "activity" || showOverview;

  return (
    <aside className={styles.panel} data-testid="intelligence-panel" aria-label="Intelligence panel">
      <header className={styles.brandHeader}>
        <div className={styles.brandTitleRow}>
          <h2 className={styles.brandTitle}>{displayName ?? "No brand selected"}</h2>
          {brandStatus ? (
            <span className={styles.brandStatus}>{brandStatus}</span>
          ) : null}
        </div>
        {data?.brand?.summary ? (
          <p className={styles.brandSummary}>{data.brand.summary}</p>
        ) : null}
        <div className={styles.brandMeta}>
          {dnaScore != null ? (
            <span className={styles.brandMetaItem}>DNA {dnaScore.toFixed(0)}</span>
          ) : null}
          {data?.brand?.lastUpdated ? (
            <span className={styles.brandMetaItem}>Updated {data.brand.lastUpdated}</span>
          ) : null}
        </div>
      </header>

      <div className={styles.briefing}>
        <div className={styles.insights} aria-live="polite">
          {loading && !data ? (
            <p className={styles.mutedCopy}>Loading intelligence…</p>
          ) : error ? (
            <p className={styles.errorCopy}>{error}</p>
          ) : null}

          {!error && data && showOverview && (
            <>
              {health && data.scores ? (
                <HealthSection
                  dna={data.scores.dna}
                  pillars={health}
                  dnaEvidence={dnaExplain ?? undefined}
                />
              ) : data.scores ? (
                <DnaScoresSection scores={data.scores} />
              ) : null}

              {data.insights?.length ? (
                <AiInsightsSection insights={data.insights} />
              ) : null}
            </>
          )}

          {!error && data && showApprovals && data.approvals ? (
            <IntelApprovalQueueSection approvals={data.approvals} />
          ) : null}

          {!error && data && showOverview && data.recommendedActions?.length ? (
            <RecommendedActionsSection actions={data.recommendedActions} />
          ) : null}

          {!error && data && showActivity && data.activity?.length ? (
            <RecentActivitySection groups={data.activity} />
          ) : null}

          {!error && !loading && data && !data.scores && !data.insights?.length && (
            <p className={styles.mutedCopy}>
              {activeBrandId
                ? "DNA scores appear after brand analysis completes."
                : "Select a brand to view intelligence."}
            </p>
          )}
        </div>
      </div>

      <nav className={styles.tabs} aria-label="Intelligence panel sections">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={tab === item.id ? styles.tabActive : styles.tab}
            aria-current={tab === item.id ? "page" : undefined}
            onClick={() => setTab(item.id)}
          >
            {item.label}
            {item.id === "approvals" && data?.approvals.pendingCount ? (
              <span className={styles.tabBadge}>{data.approvals.pendingCount}</span>
            ) : null}
          </button>
        ))}
      </nav>
    </aside>
  );
}
