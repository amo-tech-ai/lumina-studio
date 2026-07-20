"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Calendar, ChevronRight, Zap } from "lucide-react";
import { toast } from "sonner";

import { BrandDetailAnalysingCard } from "@/components/brand-hub/brand-detail-analysing-card";
import { AnalysisProgressBanner } from "@/components/brand-hub/analysis-progress-banner";
import { BrandDetailDraftCard } from "@/components/brand-hub/brand-detail-draft-card";
import { DraftBanner } from "@/components/brand-hub/draft-banner";
import { useBrandContext } from "@/components/brand-hub/brand-context";
import { EvidenceDialog } from "@/components/intelligence-panel/evidence-dialog";
import type { EvidenceBlockProps } from "@/components/evidence-block/types";
import { reanalyzeBrand } from "@/app/(operator)/app/brand/[id]/actions";
import type { AiProfile, BrandScoreDetail } from "@/lib/brand-hub";
import { isAnalysingIntakeStatus } from "@/lib/brand-list-filters";
import { brandDetailGreeting, brandDetailHeroChip } from "@/lib/brand-detail-greeting";
import {
  brandDetailAssetUrls,
  heroFallbackForBrand,
} from "@/lib/command-center/sample-images";
import { scoreLabel } from "@/lib/brand-utils";
import { cn } from "@/lib/utils";

import styles from "./brand-detail.module.css";

export type BrandDetailWorkspaceProps = {
  brandId: string;
  brandName: string;
  brandUrl: string | null;
  intakeStatus: string | null;
  dnaScore: number;
  profile: AiProfile;
  draftProfile: AiProfile | null;
  workflowRunId?: string | null;
  baseScores: BrandScoreDetail[];
  crawlPages?: { pages_crawled: number | null; pages_found: number | null } | null;
  isAuthenticated: boolean;
};

function displayHost(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).host;
  } catch {
    return url;
  }
}

function pillarBarClass(score: number): string {
  if (score >= 80) return styles.pillarFill;
  if (score >= 60) return cn(styles.pillarFill, styles.pillarFillMid);
  return cn(styles.pillarFill, styles.pillarFillLow);
}

function buildPillarEvidence(
  brandName: string,
  scoreType: string,
  score: number,
): Omit<EvidenceBlockProps, "className" | "loading"> {
  return {
    title: `${scoreLabel(scoreType)} DNA`,
    score: Math.round(score),
    potential: Math.min(100, Math.round(score + 8)),
    confidence: 84,
    why: `${scoreLabel(scoreType)} for ${brandName} is derived from crawled pages and asset audit.`,
    evidence: [{ text: "Score from brand intelligence pipeline." }],
    suggestions: [{ text: `Improve ${scoreLabel(scoreType).toLowerCase()} consistency`, gain: 4 }],
  };
}

export function BrandDetailWorkspace({
  brandId,
  brandName,
  brandUrl,
  intakeStatus,
  dnaScore,
  profile,
  draftProfile,
  workflowRunId,
  baseScores,
  crawlPages,
  isAuthenticated,
}: BrandDetailWorkspaceProps) {
  const router = useRouter();
  const [startingAnalysis, setStartingAnalysis] = useState(false);
  const status = intakeStatus ?? "brand_created";
  const analysing = isAnalysingIntakeStatus(status);
  const hasDna = dnaScore > 0;
  const host = displayHost(brandUrl);
  const heroSrc = heroFallbackForBrand(brandId);
  const heroChip = brandDetailHeroChip(status, dnaScore);
  const greeting = brandDetailGreeting(brandName, dnaScore, baseScores);
  const assetUrls = useMemo(() => brandDetailAssetUrls(brandId), [brandId]);
  const thumbUrls = useMemo(() => brandDetailAssetUrls(brandId, 5), [brandId]);

  const weakestType = useMemo(() => {
    if (baseScores.length === 0) return null;
    return baseScores.reduce((min, row) => (row.score < min.score ? row : min)).score_type;
  }, [baseScores]);

  useBrandContext({
    brandId,
    brandName,
    dnaScore,
    intakeStatus,
    profile,
    scores: baseScores,
    workflowRunId,
  });

  const startAnalysis = async () => {
    if (startingAnalysis) return;
    setStartingAnalysis(true);
    try {
      const result = await reanalyzeBrand(brandId);
      if (result.ok) {
        router.refresh();
      } else {
        // IPI-722 — a real, server-returned failure (e.g. no website URL,
        // analysis already running) was previously discarded here, leaving
        // the button silently doing nothing. Never a silent no-op.
        toast.error(result.error);
      }
    } finally {
      setStartingAnalysis(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={styles.workspace} data-testid="brand-detail-workspace">
        <div className={styles.workspaceInner}>
          <p className={styles.errorCopy}>Sign in to view this brand profile.</p>
          <Link href={`/login?redirect=/app/brand/${brandId}`} className={styles.chipPrimary}>
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const heroClass = cn(
    styles.hero,
    !hasDna && !analysing && styles.heroDimmed,
    analysing && styles.heroAnalysing,
  );

  return (
    <div className={styles.workspace} data-testid="brand-detail-workspace">
      <div className={styles.workspaceInner}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/app/brand" className={styles.breadcrumbLink}>
            Brands
          </Link>
          <ChevronRight size={14} aria-hidden />
          <span className={styles.breadcrumbCurrent}>{brandName}</span>
        </nav>

        <div className={heroClass}>
          <Image src={heroSrc} alt="" fill priority sizes="820px" className={styles.heroImage} />
          <span className={styles.heroScrim} aria-hidden />
          <div className={styles.heroTitleRow}>
            <span className={styles.heroName}>{brandName}</span>
            <span className={styles.heroChip}>{heroChip}</span>
          </div>
          {hasDna ? (
            <div className={styles.heroDna}>
              <div className={styles.heroDnaLabel}>DNA Score</div>
              <div className={styles.heroDnaScore}>{Math.round(dnaScore)}</div>
            </div>
          ) : null}
        </div>

        {!analysing ? (
          <div className={styles.card}>
            <div className={styles.cardEyebrow}>
              <span className={styles.cardEyebrowDot} aria-hidden />
              <span className={styles.cardEyebrowLabel}>Brand Intelligence</span>
            </div>
            <p className={styles.cardBody}>{greeting}</p>
          </div>
        ) : null}

        {analysing ? (
          <BrandDetailAnalysingCard
            host={host}
            brandName={brandName}
            thumbUrls={thumbUrls}
            crawlPages={crawlPages}
          />
        ) : null}

        {status === "failed" ? (
          <AnalysisProgressBanner
            brandId={brandId}
            initialStatus={status}
            initialCrawlPages={crawlPages}
            errorMessage={profile._error}
          />
        ) : null}

        {hasDna && !analysing ? (
          <div className={styles.chipRow}>
            {weakestType ? (
              <EvidenceDialog
                triggerLabel={`Improve ${scoreLabel(weakestType)} score`}
                triggerClassName={styles.chip}
                evidence={buildPillarEvidence(
                  brandName,
                  weakestType,
                  baseScores.find((s) => s.score_type === weakestType)!.score,
                )}
              />
            ) : null}
            <Link href={`/app/shoots/new?brand=${brandId}`} className={styles.chipPrimary}>
              <Calendar size={14} aria-hidden />
              Plan a Shoot
            </Link>
            <Link href={`/app/assets?brand=${brandId}`} className={styles.chip}>
              Review assets
            </Link>
          </div>
        ) : null}

        {!hasDna && !analysing ? (
          <button
            type="button"
            className={styles.chipPrimary}
            disabled={startingAnalysis}
            onClick={startAnalysis}
          >
            <Zap size={15} aria-hidden />
            {startingAnalysis ? "Starting…" : "Start analysis"}
          </button>
        ) : null}

        {status === "draft_ready" && draftProfile ? (
          workflowRunId ? (
            <BrandDetailDraftCard
              brandId={brandId}
              runId={workflowRunId}
              draft={draftProfile}
            />
          ) : (
            <DraftBanner brandId={brandId} draft={draftProfile} />
          )
        ) : null}

        {hasDna && baseScores.length > 0 ? (
          <div className={styles.card}>
            <div className={styles.cardEyebrow}>
              <span className={styles.cardEyebrowLabel}>DNA pillars</span>
            </div>
            <div className={styles.pillarGrid}>
              {baseScores.map((row) => (
                <div key={row.score_type}>
                  <EvidenceDialog
                    triggerLabel={`${scoreLabel(row.score_type)} — ${Math.round(row.score)}`}
                    triggerClassName={styles.pillarBtn}
                    evidence={buildPillarEvidence(brandName, row.score_type, row.score)}
                  />
                  <div className={styles.pillarTrack} aria-hidden>
                    <span
                      className={pillarBarClass(row.score)}
                      style={{ width: `${Math.min(100, row.score)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {hasDna ? (
          <section className={styles.assetSection} aria-label="Brand assets">
            <div className={styles.assetHeader}>
              <span className={styles.assetTitle}>Assets ({assetUrls.length})</span>
              <Link href={`/app/assets?brand=${brandId}`} className={styles.assetLink}>
                Review →
              </Link>
            </div>
            <div className={styles.assetGrid}>
              {assetUrls.map((src) => (
                <div key={src} className={styles.assetTile}>
                  <Image src={src} alt="" fill sizes="80px" className={styles.assetImage} />
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

export function BrandDetailSkeleton() {
  return (
    <div className={styles.workspace} aria-busy="true" aria-label="Loading brand">
      <div className={styles.workspaceInner}>
        <div className={styles.skeletonChip} />
        <div className={styles.skeletonHero} />
        <div className={styles.skeletonCard} />
        <div className={styles.chipRow}>
          <div className={styles.skeletonChip} />
          <div className={styles.skeletonChip} />
        </div>
      </div>
    </div>
  );
}
