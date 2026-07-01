import Link from "next/link";

import type { RecentShoot } from "@/lib/command-center/types";

import styles from "./command-center.module.css";

type Props = {
  shoots: RecentShoot[];
};

function formatMeta(shoot: RecentShoot): string {
  const date = new Date(shoot.updatedAt);
  const when = Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
  const dna =
    typeof shoot.dnaScore === "number" && shoot.dnaScore > 0
      ? ` · DNA ${Math.round(shoot.dnaScore)}%`
      : "";
  return `${shoot.status}${when ? ` · ${when}` : ""}${dna}`;
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
        {shoots.map((shoot) => (
          <Link key={shoot.id} href={`/app/shoots/${shoot.id}`} className={styles.recentTile}>
            <div className={styles.recentThumb}>
              <span className={styles.recentThumbScrim} />
              {typeof shoot.dnaScore === "number" && shoot.dnaScore > 0 && (
                <span className={styles.recentMatch}>{Math.round(shoot.dnaScore)}%</span>
              )}
              <span className={styles.recentLabel}>{shoot.name}</span>
            </div>
            <p className={styles.recentMeta}>{formatMeta(shoot)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
