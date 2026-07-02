"use client";

import Image from "next/image";
import Link from "next/link";

import { intakeStatusColor, intakeStatusLabel } from "@/lib/brand-hub";
import { BASE_SCORE_TYPES } from "@/lib/brand-scores";
import { brandListCoverForBrand } from "@/lib/command-center/sample-images";
import { isAnalysingIntakeStatus } from "@/lib/brand-list-filters";
import { scoreLabel } from "@/lib/brand-utils";

import styles from "./brand-list.module.css";

export type BrandListCardPillar = {
  score_type: string;
  score: number;
};

export type BrandListCardProps = {
  id: string;
  name: string;
  brandUrl: string | null;
  intakeStatus: string | null;
  dnaScore: number;
  pillars: BrandListCardPillar[];
};

function displayHost(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).host;
  } catch {
    return url;
  }
}

function weakestPillarType(pillars: BrandListCardPillar[]): string | null {
  if (pillars.length === 0) return null;
  return pillars.reduce((min, row) => (row.score < min.score ? row : min)).score_type;
}

export function BrandListCard({
  id,
  name,
  brandUrl,
  intakeStatus,
  dnaScore,
  pillars,
}: BrandListCardProps) {
  const status = intakeStatus ?? "brand_created";
  const analysing = isAnalysingIntakeStatus(status);
  const hasDna = dnaScore > 0;
  const noDna = !hasDna && !analysing;
  const coverSrc = brandListCoverForBrand(id);
  const host = displayHost(brandUrl);
  const weakType = weakestPillarType(pillars);
  const statusDot = intakeStatusColor(status);

  const pillarRows = BASE_SCORE_TYPES.map((type) => {
    const row = pillars.find((p) => p.score_type === type);
    return { type, score: row?.score ?? null };
  }).filter((row) => row.score != null) as { type: string; score: number }[];

  return (
    <article
      className={`${styles.card}${analysing ? ` ${styles.cardAnalysing}` : ""}`}
      data-testid="brand-list-card"
    >
      <Link href={`/app/brand/${id}`} className={styles.coverWrap} aria-label={`Open ${name}`}>
        <Image
          src={coverSrc}
          alt=""
          fill
          sizes="(max-width: 720px) 100vw, (max-width: 1280px) 50vw, 320px"
          className={styles.coverImage}
        />
        <span className={styles.coverScrim} aria-hidden />
        <span className={styles.statusPill}>
          <span className={styles.statusDot} style={{ background: statusDot }} aria-hidden />
          {intakeStatusLabel(status)}
        </span>
      </Link>

      <div className={styles.cardBody}>
        <div className={styles.cardTitleRow}>
          <h2 className={styles.cardName}>{name}</h2>
          {host ? <p className={styles.cardUrl}>{host}</p> : null}
        </div>

        {analysing ? (
          <div className={styles.analysingBlock}>
            <p className={styles.analysingCopy}>
              <span className={styles.analysingDot} aria-hidden />
              Crawling {host ?? name}…
            </p>
            <div className={styles.analysingBar} aria-hidden>
              <span className={styles.analysingBarIndet} />
            </div>
          </div>
        ) : null}

        {hasDna ? (
          <>
            <div className={styles.dnaRow}>
              <span className={styles.dnaScore}>{dnaScore}</span>
              <span className={styles.dnaLabel}>DNA</span>
              <div className={styles.dnaBarTrack} aria-hidden>
                <span
                  className={styles.dnaBarFill}
                  style={{ width: `${Math.min(100, dnaScore)}%` }}
                />
              </div>
            </div>
            {pillarRows.length > 0 ? (
              <div className={styles.pillarRow}>
                {pillarRows.map(({ type, score }) => (
                  <span key={type} className={styles.pillarInline}>
                    {scoreLabel(type)}{" "}
                    <span
                      className={
                        type === weakType ? styles.pillarScoreWeak : styles.pillarScore
                      }
                    >
                      {score}
                      {type === weakType ? "*" : ""}
                    </span>
                  </span>
                ))}
              </div>
            ) : null}
          </>
        ) : null}

        {noDna ? (
          <div className={styles.noDnaBlock}>
            <p className={styles.noDnaCopy}>
              No DNA profile yet. Run an analysis to score this brand.
            </p>
            <Link href={`/app/brand/${id}`} className={styles.cardBtnPrimary}>
              Analyse brand
            </Link>
          </div>
        ) : null}

        {hasDna || analysing ? (
          <div className={styles.cardActions}>
            <Link href={`/app/brand/${id}`} className={styles.cardBtn}>
              View
            </Link>
            <Link href={`/app/brand/${id}`} className={styles.cardBtnGhost}>
              Analyse
            </Link>
          </div>
        ) : null}
      </div>
    </article>
  );
}
