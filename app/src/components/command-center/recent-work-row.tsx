import Image from "next/image";
import Link from "next/link";

import { recentFallbackForShoot } from "@/lib/command-center/sample-images";
import type { RecentShoot } from "@/lib/command-center/types";

import styles from "./command-center.module.css";

type Props = {
  shoots: RecentShoot[];
};

const CHANNEL_ASPECT: Record<string, string> = {
  IG: "4:5",
  TikTok: "9:16",
  Amazon: "1:1",
  Shopify: "1:1",
};

function formatMeta(shoot: RecentShoot): string {
  const date = new Date(shoot.updatedAt);
  const when = Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-CA", { month: "short", day: "numeric" });

  const parts: string[] = [];
  if (shoot.channel) {
    parts.push(shoot.channel);
    const aspect = CHANNEL_ASPECT[shoot.channel];
    if (aspect) parts.push(aspect);
  }
  parts.push(shoot.status);
  if (when) parts.push(when);
  if (typeof shoot.dnaScore === "number" && shoot.dnaScore > 0) {
    parts.push(`DNA ${Math.round(shoot.dnaScore)}%`);
  }
  return parts.join(" · ");
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
        {shoots.map((shoot, index) => {
          const imageSrc = shoot.imageUrl ?? recentFallbackForShoot(shoot.id, index);

          return (
            <Link key={shoot.id} href={`/app/shoots/${shoot.id}`} className={styles.recentTile}>
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
                  <span className={styles.recentMatch}>{Math.round(shoot.dnaScore)}%</span>
                )}
                <span className={styles.recentLabel}>{shoot.name}</span>
              </div>
              <p className={styles.recentMeta}>{formatMeta(shoot)}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
