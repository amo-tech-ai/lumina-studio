import Image from "next/image";
import Link from "next/link";

import { isRecentWorkFallback } from "@/lib/command-center/recent-work-fallbacks";
import { recentFallbackForShoot } from "@/lib/command-center/sample-images";
import type { RecentShoot } from "@/lib/command-center/types";
import { cn } from "@/lib/utils";

import styles from "./command-center.module.css";

type Props = {
  shoots: RecentShoot[];
};

const CHANNEL_ASPECT: Record<string, string> = {
  IG: "4:5",
  TikTok: "9:16",
  Reel: "9:16",
  Amazon: "1:1",
  Shopify: "1:1",
  Asset: "4:5",
  Video: "4:5",
};

function formatMeta(shoot: RecentShoot): string {
  if (shoot.channel) {
    const aspect = CHANNEL_ASPECT[shoot.channel];
    if (aspect) return `${shoot.channel} · ${aspect}`;
  }
  return "IG · 4:5";
}

function matchClass(score: number): string {
  if (score >= 80) return styles.recentMatch;
  if (score >= 60) return cn(styles.recentMatch, styles.recentMatchMid);
  return cn(styles.recentMatch, styles.recentMatchLow);
}

function RecentWorkTile({ shoot, index }: { shoot: RecentShoot; index: number }) {
  const imageSrc = shoot.imageUrl ?? recentFallbackForShoot(shoot.id, index);
  const fallback = isRecentWorkFallback(shoot.id);

  const thumb = (
    <div className={styles.recentThumb}>
      <Image
        src={imageSrc}
        alt={`${shoot.name} preview`}
        fill
        loading="lazy"
        sizes="138px"
        className={styles.recentImage}
      />
      <span className={styles.recentThumbScrim} />
      {typeof shoot.dnaScore === "number" && shoot.dnaScore > 0 && (
        <span className={matchClass(shoot.dnaScore)}>{Math.round(shoot.dnaScore)}</span>
      )}
      <span className={styles.recentLabel}>{shoot.name}</span>
    </div>
  );

  const meta = <p className={styles.recentMeta}>{formatMeta(shoot)}</p>;

  if (fallback) {
    return (
      <div className={styles.recentTile}>
        {thumb}
        {meta}
      </div>
    );
  }

  return (
    <Link href={`/app/shoots/${shoot.id}`} className={styles.recentTile}>
      {thumb}
      {meta}
    </Link>
  );
}

export function RecentWorkRow({ shoots }: Props) {
  if (shoots.length === 0) return null;

  return (
    <section className={styles.recentSection} aria-labelledby="cc-recent-title">
      <div className={styles.recentHeader}>
        <h3 id="cc-recent-title" className={styles.recentTitle}>
          Recent work
        </h3>
        <Link href="/app/shoots" className={styles.recentViewAll}>
          View all
        </Link>
      </div>

      <div className={styles.recentScroll}>
        {shoots.map((shoot, index) => (
          <RecentWorkTile key={shoot.id} shoot={shoot} index={index} />
        ))}
      </div>
    </section>
  );
}
