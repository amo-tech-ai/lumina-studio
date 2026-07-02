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
  onApprovalAction?: () => void;
};

type ResolvedContext = {
  brandId: string | null;
  scores: NonNullable<ReturnType<typeof resolvePanelScores>>;
  health: ReturnType<typeof resolveHealthPillars> | ReturnType<typeof resolveDetailPillars>;
  approvals: IntelligencePanelData["approvals"];
  detailExtras: ReturnType<typeof resolveBrandDetailExtras> | null;
};

function resolvePanelContext(props: Props): ResolvedContext | null {
  const { data, activeBrandId, commandCenterMode, brandDetailMode, showOverview } = {
    ...props,
    showOverview: props.tab === "overview",
  };
  const brandId = activeBrandId ?? data.brand?.id ?? null;
  const scores = resolvePanelScores(data.scores, commandCenterMode);
  if (!scores) return null;

  const health = brandDetailMode
    ? resolveDetailPillars({ ...data, scores })
    : resolveHealthPillars({ ...data, scores });
  const approvals = resolvePanelApprovals(
    data.approvals,
    brandId,
    commandCenterMode && showOverview,
  );
  const detailExtras =
    brandDetailMode && brandId && showOverview
      ? resolveBrandDetailExtras(data, brandId)
      : null;

  return { brandId, scores, health, approvals, detailExtras };
}

function PortfolioOverviewSections({
  data,
  approvals,
  showActivity,
  onReviewApprovals,
}: {
  data: IntelligencePanelData;
  approvals: IntelligencePanelData["approvals"];
  showActivity: boolean;
  onReviewApprovals: () => void;
}) {
  if (!data.portfolio) return null;
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

function BrandListTabSections({
  tab,
  data,
  approvals,
  onApprovalAction,
}: {
  tab: Props["tab"];
  data: IntelligencePanelData;
  approvals: IntelligencePanelData["approvals"];
  onApprovalAction?: () => void;
}) {
  if (tab === "approvals") {
    return (
      <>
        <IntelApprovalQueueSection approvals={approvals} onApproved={onApprovalAction} />
        {!approvals.items.length ? (
          <p className={styles.mutedCopyInline}>No pending brand drafts.</p>
        ) : null}
      </>
    );
  }
  if (tab === "activity") {
    return data.activity?.length ? (
      <RecentActivitySection groups={data.activity} />
    ) : (
      <p className={styles.mutedCopyInline}>No recent portfolio activity.</p>
    );
  }
  return null;
}

function CommandCenterAndDetailSections({
  props,
  ctx,
}: {
  props: Props;
  ctx: ResolvedContext;
}) {
  const {
    data,
    tab,
    activeBrandId,
    loading,
    commandCenterMode,
    commandCenterPopulated,
    brandDetailMode,
    onReviewApprovals,
    onApprovalAction,
  } = props;
  const showOverview = tab === "overview";
  const showApprovals =
    tab === "approvals" || (showOverview && !brandDetailMode);
  const showActivity = tab === "activity";
  const { scores, health, approvals, detailExtras } = ctx;

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
            onApproved={onApprovalAction}
          />
        </>
      ) : null}

      {showApprovals && brandDetailMode ? (
        <IntelApprovalQueueSection approvals={approvals} onApproved={onApprovalAction} />
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

export function IntelligencePanelSections(props: Props) {
  const { data, tab, brandListMode, activeBrandId, onReviewApprovals, onApprovalAction } = props;
  const showOverview = tab === "overview";
  const showActivity = tab === "activity";
  const brandId = activeBrandId ?? data.brand?.id ?? null;

  if (brandListMode && showOverview && data.portfolio) {
    const approvals = resolvePanelApprovals(data.approvals, brandId, false);
    return (
      <PortfolioOverviewSections
        data={data}
        approvals={approvals}
        showActivity={showActivity}
        onReviewApprovals={onReviewApprovals}
      />
    );
  }

  if (brandListMode && (tab === "approvals" || tab === "activity")) {
    const approvals = resolvePanelApprovals(data.approvals, brandId, false);
    return (
      <BrandListTabSections
        tab={tab}
        data={data}
        approvals={approvals}
        onApprovalAction={onApprovalAction}
      />
    );
  }

  const ctx = resolvePanelContext(props);
  if (!ctx) return null;
  return <CommandCenterAndDetailSections props={props} ctx={ctx} />;
}
