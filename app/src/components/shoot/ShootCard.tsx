"use client";

import { shootListCoverForShoot } from "@/lib/command-center/sample-images";
import { formatShootCardDate } from "@/lib/shoot/shoot-list-format";
import { shootStatusDisplay } from "@/lib/shoot/shoot-list-filters";

import styles from "./shoots-list.module.css";

export type ShootListItem = {
  id: string;
  name: string;
  status: string;
  dna_score: number | null;
  updated_at: string;
  start_date?: string | null;
  end_date?: string | null;
  cover_image?: string | null;
  brandName?: string | null;
  shot_count?: number | null;
};

type Props = {
  shoot: ShootListItem;
  selected?: boolean;
  onSelect?: (shootId: string) => void;
};

export function ShootCard({ shoot, selected = false, onSelect }: Props) {
  const { label, dot } = shootStatusDisplay(shoot.status);
  const coverUrl = shootListCoverForShoot(shoot.id, shoot.cover_image);
  const dateLabel = formatShootCardDate(shoot.start_date) ?? "—";

  return (
    <button
      type="button"
      className={selected ? styles.cardSelected : styles.card}
      data-testid="shoot-list-card"
      data-selected={selected ? "true" : undefined}
      aria-pressed={selected}
      onClick={() => onSelect?.(shoot.id)}
    >
      <div
        className={styles.coverWrap}
        style={{ backgroundImage: `url("${coverUrl}")` }}
        aria-hidden
      >
        <span className={styles.coverScrim} />
        {shoot.dna_score != null ? (
          <span className={styles.dnaBadge}>DNA {Math.round(shoot.dna_score)}</span>
        ) : null}
        <span className={styles.statusPill}>
          <span className={styles.statusDot} style={{ background: dot }} aria-hidden />
          {label}
        </span>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardTitle}>{shoot.name}</div>
        <div className={styles.cardMeta}>
          <span className={styles.cardBrand}>{shoot.brandName ?? "—"}</span>
          <span className={styles.cardDate}>{dateLabel}</span>
        </div>
      </div>
    </button>
  );
}

/** @deprecated use ShootListItem */
export type ShootRow = ShootListItem;
