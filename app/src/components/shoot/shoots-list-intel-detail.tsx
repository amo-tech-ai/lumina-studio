"use client";

import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { useMemo } from "react";

import { shootListCoverForShoot } from "@/lib/command-center/sample-images";
import { useSetIntelligenceDetail } from "@/context/intelligence-detail-context";
import { formatShootCardDate } from "@/lib/shoot/shoot-list-format";
import { shootStatusDisplay } from "@/lib/shoot/shoot-list-filters";

import type { ShootListItem } from "@/components/shoot/ShootCard";

import styles from "./shoots-list-intel.module.css";

const SHOT_PREVIEW_LABELS = [
  { name: "Hero — full look", meta: "4:5 · 3 frames" },
  { name: "Motion — runway", meta: "9:16 · 2 frames" },
  { name: "Detail — fabric", meta: "1:1 · 4 frames" },
  { name: "Lifestyle — street", meta: "4:5 · 3 frames" },
];

function ShootIntelPrompt() {
  return (
    <div className={styles.prompt} data-testid="shoots-intel-prompt">
      <ImageIcon size={26} aria-hidden className={styles.promptIcon} />
      <p className={styles.promptCopy}>
        Select a shoot to preview its cover and shot list.
      </p>
    </div>
  );
}

function ShootIntelSelected({ shoot }: { shoot: ShootListItem }) {
  const { label, dot } = shootStatusDisplay(shoot.status);
  const coverUrl = shootListCoverForShoot(shoot.id, shoot.cover_image);
  const dateLabel = formatShootCardDate(shoot.start_date) ?? "—";
  const shotCount = shoot.shot_count ?? 0;
  const previewCount = Math.min(SHOT_PREVIEW_LABELS.length, Math.max(shotCount, 2));

  return (
    <div className={styles.selected} data-testid="shoots-intel-selected">
      <div
        className={styles.heroCover}
        style={{ backgroundImage: `url("${coverUrl}")` }}
        role="img"
        aria-label={`${shoot.name} cover`}
      >
        <span className={styles.heroScrim} aria-hidden />
        <span className={styles.heroStatus}>
          <span className={styles.heroStatusDot} style={{ background: dot }} />
          {label}
        </span>
        {shoot.dna_score != null ? (
          <span className={styles.heroDna}>DNA {Math.round(shoot.dna_score)}</span>
        ) : null}
      </div>

      <div>
        <h3 className={styles.selectedTitle}>{shoot.name}</h3>
        <div className={styles.selectedMeta}>
          <span>{shoot.brandName ?? "—"}</span>
          <span className={styles.metaSep}>·</span>
          <span className={styles.mono}>{dateLabel}</span>
          {shotCount > 0 ? (
            <>
              <span className={styles.metaSep}>·</span>
              <span className={styles.mono}>{shotCount} looks</span>
            </>
          ) : null}
        </div>
      </div>

      <div className={styles.actions}>
        <Link href={`/app/shoots/${shoot.id}`} className={styles.openBtn}>
          Open shoot
        </Link>
        <button type="button" className={styles.secondaryBtn} disabled title="Coming soon">
          Duplicate
        </button>
      </div>

      <div className={styles.divider} aria-hidden />

      <div>
        <div className={styles.shotListHeader}>
          <span className={styles.shotListTitle}>Shot list</span>
          <span className={styles.shotListCount}>
            {shotCount > 0 ? `${shotCount} shots` : "Preview"}
          </span>
        </div>
        <div className={styles.shotList}>
          {SHOT_PREVIEW_LABELS.slice(0, previewCount).map((shotLabel, index) => {
            const thumb = shootListCoverForShoot(`${shoot.id}-preview-${index}`, null);
            return (
              <div key={shotLabel.name} className={styles.shotRow}>
                <div
                  className={styles.shotThumb}
                  style={{ backgroundImage: `url("${thumb}")` }}
                  aria-hidden
                />
                <div className={styles.shotCopy}>
                  <div className={styles.shotName}>{shotLabel.name}</div>
                  <div className={styles.shotMeta}>{shotLabel.meta}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Injects shoots-list intelligence content into the operator IntelligencePanel. */
export function useShootsListIntelDetail(selected: ShootListItem | null) {
  const detailNode = useMemo(
    () => (selected ? <ShootIntelSelected shoot={selected} /> : <ShootIntelPrompt />),
    [selected],
  );

  useSetIntelligenceDetail(detailNode);
}
