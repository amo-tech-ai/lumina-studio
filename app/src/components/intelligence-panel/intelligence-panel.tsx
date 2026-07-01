"use client";

import { useState } from "react";

import { useIntelligencePanel } from "@/lib/intelligence/use-intelligence-panel";

import { IntelligencePanelSections } from "./intelligence-panel-sections";
import styles from "./intelligence-panel.module.css";

type Props = {
  activeBrandId: string | null;
  brandName: string | null;
};

type PanelTab = "overview" | "approvals" | "activity";

const TABS: { id: PanelTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "approvals", label: "Approvals" },
  { id: "activity", label: "Activity" },
];

export function IntelligencePanel({ activeBrandId, brandName }: Props) {
  const { data, loading, error } = useIntelligencePanel(activeBrandId);
  const [tab, setTab] = useState<PanelTab>("overview");

  const displayName = data?.brand?.name ?? brandName;
  const brandStatus = data?.brand?.status ?? null;
  const dnaScore = data?.scores?.dna;

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

      <div
        className={styles.briefing}
        role="tabpanel"
        id="intel-panel-tabpanel"
        aria-labelledby={`intel-tab-${tab}`}
      >
        <div className={styles.insights} aria-live="polite">
          {loading && !data ? (
            <p className={styles.mutedCopy}>Loading intelligence…</p>
          ) : error ? (
            <p className={styles.errorCopy}>{error}</p>
          ) : null}

          {!error && data ? (
            <IntelligencePanelSections
              data={data}
              tab={tab}
              activeBrandId={activeBrandId}
              loading={loading}
            />
          ) : null}
        </div>
      </div>

      <nav className={styles.tabs} aria-label="Intelligence panel sections" role="tablist">
        {TABS.map((item) => {
          const selected = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              id={`intel-tab-${item.id}`}
              role="tab"
              aria-selected={selected}
              aria-controls="intel-panel-tabpanel"
              tabIndex={selected ? 0 : -1}
              className={selected ? styles.tabActive : styles.tab}
              onClick={() => setTab(item.id)}
            >
              {item.label}
              {item.id === "approvals" && data?.approvals.items.length ? (
                <span className={styles.tabBadge}>{data.approvals.items.length}</span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
