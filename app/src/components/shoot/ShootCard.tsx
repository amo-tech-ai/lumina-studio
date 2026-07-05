"use client";

import Image from "next/image";

import { shootListCoverForShoot } from "@/lib/command-center/sample-images";
import { shootStatusDotToken, shootStatusLabel } from "@/lib/shoot-list-filters";

import styles from "./shoots-list.module.css";

export type ShootRow = {
  id: string;
  name: string;
  type: string;
  status: string;
  dna_score: number | null;
  target_channels: string[] | null;
  estimated_budget: number | null;
  updated_at: string;
};

export function formatShootDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  // ponytail: pin to UTC so SSR (server TZ) and hydration (browser TZ) render the
  // same day — otherwise a near-midnight updated_at mismatches and React warns.
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

type Props = {
  shoot: ShootRow;
  selected?: boolean;
  onSelect?: (shootId: string) => void;
};

/** DC parity: card SELECTS (previews in the IntelligencePanel) — it does not navigate.
 *  Only the panel's "Open shoot" action routes to the detail page (IPI-383). */
export function ShootCard({ shoot, selected = false, onSelect }: Props) {
  const coverSrc = shootListCoverForShoot(shoot.id);
  const statusDot = shootStatusDotToken(shoot.status);
  const descId = `shoot-card-desc-${shoot.id}`;

  return (
    <button
      type="button"
      className={selected ? `${styles.card} ${styles.cardSelected}` : styles.card}
      aria-label={`Select ${shoot.name}`}
      aria-describedby={descId}
      aria-pressed={selected}
      data-selected={selected ? "true" : undefined}
      data-testid="shoot-card"
      onClick={() => onSelect?.(shoot.id)}
    >
      {/* Concise label names the shoot; describedby exposes the visible details
          (status/type/date/DNA) to screen readers without bloating the name. */}
      <span id={descId} className="sr-only">
        {`${shootStatusLabel(shoot.status)}, ${shoot.type}, updated ${formatShootDate(
          shoot.updated_at,
        )}, DNA ${shoot.dna_score ?? "not scored"}`}
      </span>
      <div className={styles.coverWrap}>
        <Image
          src={coverSrc}
          alt=""
          fill
          sizes="(max-width: 720px) 100vw, (max-width: 1280px) 50vw, 300px"
          className={styles.coverImage}
        />
        <span className={styles.coverScrim} aria-hidden />
        <span className={styles.dnaBadge}>DNA {shoot.dna_score ?? "—"}</span>
        <span className={styles.statusPill}>
          <span className={styles.statusDot} style={{ background: statusDot }} aria-hidden />
          {shootStatusLabel(shoot.status)}
        </span>
      </div>

      <div className={styles.cardBody}>
        <p className={styles.cardName}>{shoot.name}</p>
        <div className={styles.cardMetaRow}>
          <span className={styles.cardType}>{shoot.type}</span>
          <span className={styles.cardDate}>{formatShootDate(shoot.updated_at)}</span>
        </div>
      </div>
    </button>
  );
}
