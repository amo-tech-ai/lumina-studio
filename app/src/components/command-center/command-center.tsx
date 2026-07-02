import {
  deriveWorkspaceView,
  showRecentWorkRow,
} from "@/lib/command-center/derive-view-state";
import { resolveRecentWorkItems } from "@/lib/command-center/recent-work-fallbacks";
import type { CommandCenterData } from "@/lib/command-center/types";
import { EMPTY_COMMAND_CENTER_DATA } from "@/lib/command-center/types";

import { CommandCenterApprovals } from "./command-center-approvals";
import { CommandCenterEmpty } from "./command-center-empty";
import { CommandCenterErrorBanner } from "./command-center-error-banner";
import styles from "./command-center.module.css";
import { PortfolioHeroCard } from "./portfolio-hero-card";
import { QuickActionChips } from "./quick-action-chips";
import { RealtimeStatusStrip } from "./realtime-status-strip";
import { RecentWorkRow } from "./recent-work-row";

type Props = Partial<CommandCenterData> & {
  /** Dev bypass — render shell without KPI data (`?skip=1`) */
  devPreview?: boolean;
  /** Dev bypass — approval stub layout (`?skip=approval`) */
  devPreviewApproval?: boolean;
};

export function CommandCenter(props: Props = {}) {
  const data: CommandCenterData = {
    ...EMPTY_COMMAND_CENTER_DATA,
    ...props,
  };

  const view = deriveWorkspaceView(data, {
    devPreview: props.devPreview,
    devPreviewApproval: props.devPreviewApproval,
  });
  const recentShootName = data.recentShoots[0]?.name ?? null;
  const showMain =
    (view === "normal" || view === "populated" || view === "approval") &&
    data.heroBrand;

  const recentWork = resolveRecentWorkItems(
    data.recentShoots,
    data.heroBrand?.id,
  );

  return (
    <div className={styles.commandCenter}>
      <RealtimeStatusStrip
        status={data.realtimeStatus}
        detail={
          data.fetchError
            ? "Dashboard data could not be refreshed."
            : undefined
        }
      />

      {view === "empty" && <CommandCenterEmpty />}

      {view === "error" && data.fetchError && (
        <CommandCenterErrorBanner message={data.fetchError} />
      )}

      {showMain && data.heroBrand && (
        <>
          <PortfolioHeroCard
            heroBrand={data.heroBrand}
            pendingApprovalCount={data.pendingApprovalCount}
            recentShootName={recentShootName}
          />

          <QuickActionChips
            heroBrandId={data.heroBrand.id}
            pendingApprovalCount={data.pendingApprovalCount}
          />

          {showRecentWorkRow(view, data) && (
            <RecentWorkRow shoots={recentWork} />
          )}

          {view === "approval" && (
            <CommandCenterApprovals
              pendingCount={data.pendingApprovalCount}
              featured={data.featuredApproval}
            />
          )}
        </>
      )}
    </div>
  );
}
