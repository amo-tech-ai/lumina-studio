"use client";

import Image from "next/image";
import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { useMemo } from "react";

import { shootListCoverForShoot } from "@/lib/command-center/sample-images";
import { useSetIntelligenceDetail } from "@/context/intelligence-detail-context";
import { shootStatusDotToken, shootStatusLabel } from "@/lib/shoot-list-filters";

import { formatShootDate, type ShootRow } from "./ShootCard";
import styles from "./shoots-list-intel.module.css";

function ShootIntelPrompt() {
  return (
    <div className={styles.prompt} data-testid="shoots-intel-prompt">
      <ImageIcon size={26} aria-hidden className={styles.promptIcon} />
      <p className={styles.promptCopy}>Select a shoot to preview its cover and shot list.</p>
    </div>
  );
}

function ShootIntelHero({ shoot }: { shoot: ShootRow }) {
  const coverSrc = shootListCoverForShoot(shoot.id);
  const statusDot = shootStatusDotToken(shoot.status);

  return (
    <div className={styles.heroCover}>
      <Image src={coverSrc} alt="" fill sizes="360px" className={styles.heroImage} />
      <span className={styles.heroScrim} aria-hidden />
      <span className={styles.heroStatus}>
        <span className={styles.heroStatusDot} style={{ background: statusDot }} aria-hidden />
        {shootStatusLabel(shoot.status)}
      </span>
      {shoot.dna_score != null ? (
        <span className={styles.heroDna}>DNA {shoot.dna_score}</span>
      ) : null}
    </div>
  );
}

function ShootIntelSelected({ shoot }: { shoot: ShootRow }) {
  return (
    <div className={styles.selected} data-testid="shoots-intel-selected">
      <ShootIntelHero shoot={shoot} />

      <div>
        <h3 className={styles.selectedTitle}>{shoot.name}</h3>
        <div className={styles.selectedMeta}>
          <span>{shoot.type}</span>
          <span className={styles.metaSep}>·</span>
          <span className={styles.mono}>{formatShootDate(shoot.updated_at)}</span>
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

      <ShotListPreview />
    </div>
  );
}

function ShotListPreview() {
  return (
    <div>
      <div className={styles.shotListHeader}>
        <span className={styles.shotListTitle}>Shot list</span>
        <span className={styles.shotListCount}>Preview</span>
      </div>
      {/* ponytail: shoot_portfolio_view has no shot rows; open the shoot for the full list.
          Upgrade path: fetch shots for the selected id if inline preview is needed. */}
      <p className={styles.shotMeta}>Open the shoot to see and edit its full shot list.</p>
    </div>
  );
}

/** Presentational preview node rendered inside the operator IntelligencePanel. */
export function ShootsListIntelDetail({ selected }: { selected: ShootRow | null }) {
  return selected ? <ShootIntelSelected shoot={selected} /> : <ShootIntelPrompt />;
}

/** Publishes the shoots-list preview into the shared IntelligencePanel while mounted.
 *  `enabled` is false outside the populated state (empty/error/unauth) → panel keeps its default. */
export function useShootsListIntelDetail(selected: ShootRow | null, enabled: boolean) {
  const node = useMemo(
    () => (enabled ? <ShootsListIntelDetail selected={selected} /> : null),
    [selected, enabled],
  );
  useSetIntelligenceDetail(node);
}
