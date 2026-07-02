"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { IntelligencePanelData } from "@/lib/intelligence/panel-contract";
import {
  portfolioBarColor,
  portfolioBarWidth,
  portfolioCountLabel,
  portfolioDotColor,
  portfolioScoreColor,
} from "@/lib/intelligence/portfolio-panel-helpers";

import styles from "./intelligence-panel.module.css";

type Props = {
  portfolio: NonNullable<IntelligencePanelData["portfolio"]>;
  approvals: IntelligencePanelData["approvals"];
  onReviewApprovals: () => void;
};

export function PortfolioPanelSection({ portfolio, approvals, onReviewApprovals }: Props) {
  const pendingCount = approvals.pendingCount;
  const pendingLabel =
    pendingCount === 1
      ? "1 pending across all brands"
      : `${pendingCount} pending across all brands`;

  return (
    <section className={styles.portfolioBlock} aria-label="Portfolio intelligence">
      <div className={styles.portfolioHeader}>
        <h3 className={styles.portfolioTitle}>Portfolio</h3>
        <span className={styles.portfolioCount}>{portfolioCountLabel(portfolio.brandCount)}</span>
      </div>

      <div className={styles.portfolioAvgRow}>
        <span className={styles.portfolioAvgValue}>{portfolio.avgDna}</span>
        <span className={styles.portfolioAvgLabel}>Avg DNA</span>
      </div>

      <ul className={styles.portfolioHealthList}>
        {portfolio.healthRows.map((row) => (
          <li key={row.brandId} className={styles.portfolioHealthRow}>
            <span
              className={styles.portfolioHealthDot}
              style={{ background: portfolioDotColor(row.score) }}
              aria-hidden
            />
            <span className={styles.portfolioHealthName}>{row.name}</span>
            <div className={styles.portfolioHealthTrack} aria-hidden>
              <span
                className={styles.portfolioHealthFill}
                style={{
                  width: portfolioBarWidth(row.score),
                  background: portfolioBarColor(row.score),
                }}
              />
            </div>
            <span
              className={styles.portfolioHealthScore}
              style={{ color: portfolioScoreColor(row.score) }}
            >
              {row.score}
            </span>
          </li>
        ))}
      </ul>

      {portfolio.needsAttention ? (
        <>
          <div className={styles.sectionDivider} aria-hidden />
          <div className={styles.portfolioAttentionBlock}>
            <div className={styles.portfolioSectionLabelRow}>
              <span className={styles.portfolioSectionLabel}>Needs attention</span>
              <span className={styles.portfolioSectionBadgeMuted}>1</span>
            </div>
            <div className={styles.portfolioAttentionCard}>
              <span className={styles.portfolioAttentionCopy}>
                <strong>{portfolio.needsAttention.brandName}</strong> —{" "}
                {portfolio.needsAttention.pillarLabel}{" "}
                <span className={styles.portfolioAttentionScore}>
                  {portfolio.needsAttention.score}
                </span>
              </span>
              <Link href={portfolio.needsAttention.href} className={styles.portfolioFixBtn}>
                Fix now
              </Link>
            </div>
          </div>
        </>
      ) : null}

      <div className={styles.sectionDivider} aria-hidden />

      <div className={styles.portfolioApprovalsSummary}>
        <div className={styles.portfolioSectionLabelRow}>
          <span className={styles.portfolioSectionLabel}>Approvals</span>
          {pendingCount > 0 ? (
            <span className={styles.portfolioSectionBadgeAction}>{pendingCount}</span>
          ) : null}
        </div>
        <div className={styles.portfolioApprovalsRow}>
          <span className={styles.portfolioApprovalsCopy}>{pendingLabel}</span>
          <button type="button" className={styles.portfolioReviewBtn} onClick={onReviewApprovals}>
            Review
            <ArrowRight className={styles.portfolioReviewIcon} aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}
