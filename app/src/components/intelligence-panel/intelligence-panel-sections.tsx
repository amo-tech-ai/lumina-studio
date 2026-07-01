import type { IntelligencePanelData } from "@/lib/intelligence/panel-contract";
import { resolveHealthPillars } from "@/lib/intelligence/panel-helpers";

import { AiInsightsSection } from "./ai-insights-section";
import { HealthSection } from "./health-section";
import { IntelApprovalQueueSection } from "./intel-approval-queue-section";
import { RecentActivitySection } from "./recent-activity-section";
import { RecommendedActionsSection } from "./recommended-actions-section";
import styles from "./intelligence-panel.module.css";

type Props = {
  data: IntelligencePanelData;
  tab: "overview" | "approvals" | "activity";
  activeBrandId: string | null;
  loading: boolean;
};

export function IntelligencePanelSections({
  data,
  tab,
  activeBrandId,
  loading,
}: Props) {
  const showOverview = tab === "overview";
  const showApprovals = tab === "approvals" || showOverview;
  const showActivity = tab === "activity" || showOverview;
  const health = resolveHealthPillars(data);

  return (
    <>
      {showOverview && health && data.scores ? (
        <HealthSection
          dna={data.scores.dna}
          pillars={health}
          dnaEvidence={data.dnaEvidence}
        />
      ) : null}

      {showOverview && data.insights?.length ? (
        <AiInsightsSection insights={data.insights} />
      ) : null}

      {showApprovals && data.approvals ? (
        <IntelApprovalQueueSection approvals={data.approvals} />
      ) : null}

      {showOverview && data.recommendedActions?.length ? (
        <RecommendedActionsSection actions={data.recommendedActions} />
      ) : null}

      {showActivity && data.activity?.length ? (
        <RecentActivitySection groups={data.activity} />
      ) : null}

      {!loading &&
      showOverview &&
      !data.scores &&
      !data.insights?.length &&
      !data.approvals?.items.length ? (
        <p className={styles.mutedCopy}>
          {activeBrandId
            ? "DNA scores appear after brand analysis completes."
            : "Select a brand to view intelligence."}
        </p>
      ) : null}
    </>
  );
}
