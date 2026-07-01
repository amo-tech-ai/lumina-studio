"use client";

import type { ReactNode } from "react";
import { ApprovalsSection } from "./approvals-section";
import { AIContextCard } from "./ai-context-card";
import { DnaScoresSection } from "./dna-scores-section";
import { AssetsGrid } from "./assets-grid";
import { SuggestionRail } from "./suggestion-rail";
import styles from "./intelligence-panel.module.css";
import { resolveRouteBriefing, type PanelSectionType } from "./route-briefing";
import { useIntelligencePanel } from "@/lib/intelligence/use-intelligence-panel";

type Props = {
  pathname: string;
  activeBrandId: string | null;
  brandName: string | null;
  children: ReactNode;
};

function showsSection(briefing: ReturnType<typeof resolveRouteBriefing>, section: PanelSectionType) {
  return !briefing.panelSections || briefing.panelSections.includes(section);
}

export function IntelligencePanel({
  pathname,
  activeBrandId,
  brandName,
  children,
}: Props) {
  const briefing = resolveRouteBriefing(pathname);
  const { data, loading, error } = useIntelligencePanel(activeBrandId);

  return (
    <div className={styles.panel} data-testid="intelligence-panel">
      <div className={styles.briefing}>
        <AIContextCard brandName={brandName} briefing={briefing} />
        <div className={styles.insights} aria-live="polite">
          {showsSection(briefing, "dna-scores") &&
            (loading && !data ? (
              <p className="px-4 py-3 font-sans text-xs text-[#9CA3AF]">Loading intelligence…</p>
            ) : error ? (
              <p className="px-4 py-3 font-sans text-xs text-[#DC2626]">{error}</p>
            ) : data?.scores ? (
              <DnaScoresSection scores={data.scores} />
            ) : (
              <p className="px-4 py-3 font-sans text-xs text-[#9CA3AF]">
                {activeBrandId
                  ? "DNA scores appear after brand analysis completes."
                  : "Select a brand to view DNA scores."}
              </p>
            ))}
          {!error && showsSection(briefing, "suggestions") && data?.suggestions ? (
            <SuggestionRail suggestions={data.suggestions} />
          ) : null}
          {!error && showsSection(briefing, "assets") && data?.assets ? (
            <AssetsGrid assets={data.assets} />
          ) : null}
          {!error && showsSection(briefing, "approvals") && data?.approvals ? (
            <ApprovalsSection approvals={data.approvals} />
          ) : null}
        </div>
      </div>
      <div className={styles.chat}>{children}</div>
    </div>
  );
}
