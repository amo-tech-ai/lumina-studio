import type { IntelligencePanelData } from "@/lib/intelligence/panel-contract";
import { resolveHealthPillars, resolveDetailPillars } from "@/lib/intelligence/panel-helpers";
import { resolveBrandDetailExtras } from "@/lib/intelligence/panel-detail-fallbacks";
import { resolvePanelApprovals } from "@/lib/intelligence/resolve-panel-approvals";
import { resolvePanelScores } from "@/lib/intelligence/panel-scores-fallback";

import {
  BrandDetailNoDnaBlock,
  BrandDetailPanelExtras,
} from "./brand-detail-panel-extras";
import { HealthSection } from "./health-section";
import { IntelApprovalQueueSection } from "./intel-approval-queue-section";
import { PortfolioPanelSection } from "./portfolio-panel-section";
import { RecentActivitySection } from "./recent-activity-section";
import styles from "./intelligence-panel.module.css";

type Props = {
  data: IntelligencePanelData;
  tab: "overview" | "approvals" | "activity";
  activeBrandId: string | null;
  loading: boolean;
  commandCenterMode: boolean;
  commandCenterPopulated: boolean;
  brandListMode: boolean;
  brandDetailMode: boolean;
  onReviewApprovals: () => void;
};

export function IntelligencePanelSections({
  data,
  tab,
  activeBrandId,
  loading,
  commandCenterMode,
  commandCenterPopulated,
  brandListMode,
  brandDetailMode,
  onReviewApprovals,
}: Props) {
  const showOverview = tab === "overview";
  const showApprovals = tab === "approvals" || (showOverview && !brandListMode && !brandDetailMode);
  const showActivity = tab === "activity";
  const brandId = activeBrandId ?? data.brand?.id ?? null;
  const scores = resolvePanelScores(data.scores, commandCenterMode);
  const health = scores
    ? brandDetailMode
      ? resolveDetailPillars({ ...data, scores })
      : resolveHealthPillars({ ...data, scores })
    : null;
  const approvals = resolvePanelApprovals(
    data.approvals,
    brandId,
    commandCenterMode && showOverview,
  );
  const detailExtras =
    brandDetailMode && brandId && showOverview && scores
      ? resolveBrandDetailExtras(data, brandId)
      : null;

  if (brandListMode && showOverview && data.portfolio) {
    return (
      <>
        <PortfolioPanelSection
          portfolio={data.portfolio}
          approvals={approvals}
          onReviewApprovals={onReviewApprovals}
        />
        {showActivity && data.activity?.length ? (
          <>
            <div className={styles.sectionDivider} aria-hidden />
            <RecentActivitySection groups={data.activity} />
          </>
        ) : null}
      </>
    );
  }

  if (brandListMode && showApprovals) {
    return (
      <>
        <IntelApprovalQueueSection approvals={approvals} />
        {tab === "approvals" && !approvals.items.length ? (
          <p className={styles.mutedCopyInline}>No pending brand drafts.</p>
        ) : null}
      </>
    );
  }

  if (brandListMode && showActivity) {
    return data.activity?.length ? (
      <RecentActivitySection groups={data.activity} />
    ) : (
      <p className={styles.mutedCopyInline}>No recent portfolio activity.</p>
    );
  }

  return (
    <>
      {showOverview && brandDetailMode && !scores ? (
        <BrandDetailNoDnaBlock brandName={data.brand?.name ?? "This brand"} />
      ) : null}

      {showOverview && health && scores ? (
        <HealthSection
          dna={scores.dna}
          pillars={health}
          dnaEvidence={data.dnaEvidence}
          variant={brandDetailMode ? "detail" : "command"}
        />
      ) : null}

      {showOverview && brandDetailMode && detailExtras ? (
        <BrandDetailPanelExtras
          extras={detailExtras}
          onReviewApprovals={onReviewApprovals}
          pendingCount={approvals.pendingCount}
        />
      ) : null}

      {showApprovals && !brandDetailMode ? (
        <>
          {showOverview && health && scores ? (
            <div className={styles.sectionDivider} aria-hidden />
          ) : null}
          <IntelApprovalQueueSection
            approvals={approvals}
            hideEmpty={commandCenterMode && showOverview}
          />
        </>
      ) : null}

      {showApprovals && brandDetailMode ? (
        <IntelApprovalQueueSection approvals={approvals} />
      ) : null}

      {showActivity && data.activity?.length ? (
        <RecentActivitySection groups={data.activity} />
      ) : null}

      {tab === "approvals" && !approvals.items.length ? (
        <p className={styles.mutedCopyInline}>No pending brand drafts.</p>
      ) : null}

      {!loading &&
      showOverview &&
      !scores &&
      !approvals.items.length &&
      !commandCenterPopulated &&
      !brandListMode &&
      !brandDetailMode ? (
        <p className={styles.mutedCopyInline}>
          {activeBrandId
            ? "DNA scores appear after brand analysis completes."
            : "Select a brand to view intelligence."}
        </p>
      ) : null}
    </>
  );
}
