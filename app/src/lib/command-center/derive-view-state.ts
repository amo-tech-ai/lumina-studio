import type { CommandCenterData, WorkspaceView } from "./types";

type DeriveOptions = {
  loading?: boolean;
  devPreview?: boolean;
  devPreviewApproval?: boolean;
};

/**
 * Maps KPI snapshot → workspace view (DC: wsLoading / wsEmpty / wsNormal / wsPopulated / wsApproval).
 * Error is a production extension (inline banner + Retry per IPI-17 spec).
 */
export function deriveWorkspaceView(
  data: CommandCenterData,
  options: DeriveOptions = {},
): WorkspaceView {
  if (options.loading) return "loading";
  if (options.devPreviewApproval) return "approval";
  if (options.devPreview) return "populated";

  if (data.fetchError) return "error";
  if (data.brandCount === 0) return "empty";

  if (data.recentShoots.length > 0) return "populated";
  if (data.heroBrand) return "normal";

  return "empty";
}

/** Whether the recent-work row should render (DC wsPopulated / normal with fallbacks). */
export function showRecentWorkRow(view: WorkspaceView, data: CommandCenterData): boolean {
  if (view === "loading" || view === "empty" || view === "error" || view === "approval") {
    return false;
  }
  return Boolean(data.heroBrand);
}

/** Whether hero + chips render (DC wsNormal). */
export function showPortfolioHero(view: WorkspaceView): boolean {
  return view === "normal" || view === "populated" || view === "approval" || view === "error";
}

/** Prominent approval block (DC wsApproval). */
export function showApprovalBlock(view: WorkspaceView, data: CommandCenterData): boolean {
  return view === "approval" && data.pendingApprovalCount > 0;
}
