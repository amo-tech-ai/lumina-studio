import Image from "next/image";
import Link from "next/link";

import { buildHeroGreeting } from "@/lib/command-center/greeting";
import { heroFallbackForBrand } from "@/lib/command-center/sample-images";
import type { HeroBrand } from "@/lib/command-center/types";

import styles from "./command-center.module.css";

type Props = {
  heroBrand: HeroBrand;
  pendingApprovalCount: number;
  recentShootName?: string | null;
};

export function PortfolioHeroCard({
  heroBrand,
  pendingApprovalCount,
  recentShootName,
}: Props) {
  const { headline, subline } = buildHeroGreeting({
    brandName: heroBrand.name,
    pendingApprovalCount,
    recentShootName,
  });

  const coverSrc = heroBrand.coverUrl ?? heroFallbackForBrand(heroBrand.id);

  return (
    <section className={styles.heroCard} aria-labelledby="cc-hero-title">
      <Link href={`/app/brand/${heroBrand.id}`} className={styles.heroMediaLink}>
        <div className={styles.heroMedia} aria-hidden>
          <Image
            src={coverSrc}
            alt={`${heroBrand.name} cover`}
            fill
            priority
            sizes="104px"
            className={styles.heroImage}
          />
          <div className={styles.heroMediaScrim} />
          <span className={styles.heroBrandLabel}>{heroBrand.name}</span>
        </div>
      </Link>

      <div className={styles.heroBody}>
        <div className={styles.agentLabel}>
          <span className={styles.agentDot} aria-hidden />
          <span>Production Planner</span>
        </div>
        <h2 id="cc-hero-title" className={styles.heroHeadline}>
          {headline}
        </h2>
        <p className={styles.heroSubline}>{subline}</p>
      </div>
    </section>
  );
}
