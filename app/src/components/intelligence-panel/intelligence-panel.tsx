"use client";

import type { ReactNode } from "react";
import { AIContextCard } from "./ai-context-card";
import styles from "./intelligence-panel.module.css";
import { resolveRouteBriefing } from "./route-briefing";

type Props = {
  pathname: string;
  activeBrandId: string | null;
  brandName: string | null;
  children: ReactNode;
};

export function IntelligencePanel({
  pathname,
  activeBrandId,
  brandName,
  children,
}: Props) {
  const briefing = resolveRouteBriefing(pathname);

  return (
    <div className={styles.panel} data-testid="intelligence-panel">
      <div className={styles.briefing}>
        <AIContextCard brandName={brandName} briefing={briefing} />
        <div className={styles.insightsPlaceholder} aria-live="polite">
          <p className="font-sans text-[11px] font-medium text-[#6B7280]">
            Intelligence insights
          </p>
          <p className="mt-1 font-sans text-xs text-[#9CA3AF]">
            Live DNA scores and approvals load in Phase B (
            {activeBrandId ? "brand context ready" : "select a brand"} · IPI-255).
          </p>
        </div>
      </div>
      <div className={styles.chat}>{children}</div>
    </div>
  );
}
