"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { IntelligencePanelData } from "@/lib/intelligence/panel-contract";

import styles from "./intelligence-panel.module.css";

function dnaHistoryDeltaLabel(
  history: NonNullable<IntelligencePanelData["dnaHistory"]>,
): string | null {
  if (history.length < 2) return null;
  const first = history[0];
  const last = history[history.length - 1];
  const delta = last.score - first.score;
  const month = first.date.replace(/\s+\d+$/, "").trim() || first.date;
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${delta} since ${month}`;
}

type Props = {
  extras: Pick<
    IntelligencePanelData,
    "profileSnippet" | "dnaHistory" | "visualIdentity" | "assetPreview"
  >;
  onReviewApprovals: () => void;
  pendingCount: number;
};

export function BrandDetailPanelExtras({
  extras,
  onReviewApprovals,
  pendingCount,
}: Props) {
  const { profileSnippet, dnaHistory, visualIdentity, assetPreview } = extras;
  const dnaDelta = dnaHistory?.length ? dnaHistoryDeltaLabel(dnaHistory) : null;

  return (
    <>
      {dnaHistory?.length ? (
        <div className={styles.dnaHistoryBlock}>
          <div className={styles.dnaHistoryHeader}>
            <span className={styles.portfolioSectionLabel}>DNA history</span>
            {dnaDelta ? (
              <span className={styles.dnaHistoryDelta}>{dnaDelta}</span>
            ) : null}
          </div>
          <div className={styles.dnaHistoryBars} aria-hidden>
            {dnaHistory.map((point) => (
              <span
                key={point.date}
                className={styles.dnaHistoryBar}
                style={{ height: point.barHeight }}
              />
            ))}
          </div>
          <ul className={styles.dnaHistoryList}>
            {dnaHistory.map((point) => (
              <li key={`${point.date}-${point.score}`} className={styles.dnaHistoryItem}>
                <span className={styles.dnaHistoryDate}>{point.date}</span>
                <span className={styles.dnaHistoryScore}>{point.score}</span>
                <span className={styles.dnaHistoryNote}>{point.note}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {visualIdentity ? (
        <div className={styles.visualIdentityBlock}>
          <div className={styles.visualIdentityHeader}>
            <span className={styles.visualIdentityDot} aria-hidden />
            <span className={styles.visualIdentityTitle}>Visual identity</span>
            <span className={styles.visualIdentityScore}>{visualIdentity.visualScore}</span>
          </div>
          <div className={styles.visualPalette} aria-hidden>
            {visualIdentity.palette.map((color) => (
              <span
                key={color}
                className={styles.visualPaletteSwatch}
                style={{ background: color }}
              />
            ))}
          </div>
          <div className={styles.visualSamples}>
            {visualIdentity.sampleUrls.map((src) => (
              <div key={src} className={styles.visualSample}>
                <Image src={src} alt="" fill sizes="64px" className={styles.visualSampleImg} />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className={styles.sectionDivider} aria-hidden />

      {profileSnippet ? (
        <div className={styles.profileSnippetBlock}>
          <div className={styles.portfolioSectionLabel}>Profile</div>
          <p className={styles.profileSnippetText}>{profileSnippet}</p>
          <button type="button" className={styles.profileReadMore}>
            Read more
          </button>
        </div>
      ) : null}

      <div className={styles.sectionDivider} aria-hidden />

      {assetPreview ? (
        <div className={styles.assetPreviewBlock}>
          <div className={styles.assetPreviewHeader}>
            <span className={styles.panelSectionTitle}>Assets ({assetPreview.count})</span>
            <Link href={assetPreview.href} className={styles.assetPreviewLink} aria-label="Open assets">
              <ArrowRight className={styles.assetPreviewLinkIcon} aria-hidden />
            </Link>
          </div>
          <div className={styles.assetPreviewGrid}>
            {assetPreview.urls.map((src) => (
              <div key={src} className={styles.assetPreviewTile}>
                <Image src={src} alt="" fill sizes="72px" className={styles.assetPreviewImg} />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className={styles.sectionDivider} aria-hidden />

      <div className={styles.approvalsSummaryBlock}>
        <div className={styles.sectionHeader}>
          <span className={styles.panelSectionTitle}>Approvals</span>
          {pendingCount > 0 ? <span className={styles.pendingBadge}>{pendingCount}</span> : null}
        </div>
        <div className={styles.approvalsSummaryCard}>
          <span className={styles.approvalsSummaryCopy}>
            <span className={styles.approvalsSummaryDot} aria-hidden />
            {pendingCount > 0
              ? `${pendingCount} pending review${pendingCount === 1 ? "" : "s"}`
              : "No pending reviews"}
          </span>
          {pendingCount > 0 ? (
            <button type="button" className={styles.approvalsSummaryReview} onClick={onReviewApprovals}>
              Review →
            </button>
          ) : null}
        </div>
      </div>
    </>
  );
}

export function BrandDetailNoDnaBlock({ brandName }: { brandName: string }) {
  return (
    <div className={styles.noDnaBlock}>
      <p className={styles.noDnaCopy}>
        Run Brand Intelligence to build {brandName}&apos;s DNA profile — palette, voice, and
        imagery.
      </p>
      <button type="button" className={styles.noDnaBtn}>
        Analyse brand
      </button>
    </div>
  );
}
