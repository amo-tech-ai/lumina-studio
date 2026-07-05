"use client";

import Image from "next/image";
import Link from "next/link";

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

function formatShootDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ShootCard({ shoot }: { shoot: ShootRow }) {
  const coverSrc = shootListCoverForShoot(shoot.id);
  const statusDot = shootStatusDotToken(shoot.status);

  return (
    <Link
      href={`/app/shoots/${shoot.id}`}
      className={styles.card}
      aria-label={`Open ${shoot.name}`}
      data-testid="shoot-card"
    >
      <div className={styles.coverWrap}>
        <Image
          src={coverSrc}
          alt=""
          fill
          sizes="(max-width: 720px) 100vw, (max-width: 1280px) 50vw, 300px"
          className={styles.coverImage}
        />
        <span className={styles.coverScrim} aria-hidden />
        <span className={styles.dnaBadge}>
          DNA {shoot.dna_score ?? "—"}
        </span>
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
    </Link>
  );
}
