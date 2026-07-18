import type { CSSProperties } from "react";

/**
 * IPI-304 — Approve/Reject action pair. Brand-only for v1 (see IPI-304's
 * correction): the 3 shoot HITL cards have no approve/reject UI today, so
 * this primitive is not wired into them — inventing one is out of scope.
 */
export function ApprovalActions({
  state,
  onApprove,
  onReject,
  disabled,
  className,
  approveClassName,
  approveStyle,
  rejectClassName,
  approveLabel = "Approve",
  approvingLabel = "Approving…",
  rejectLabel = "Reject",
  rejectingLabel = "Rejecting…",
}: {
  state: "idle" | "approving" | "rejecting";
  onApprove: () => void;
  onReject: () => void;
  disabled?: boolean;
  className?: string;
  approveClassName?: string;
  approveStyle?: CSSProperties;
  rejectClassName?: string;
  approveLabel?: string;
  approvingLabel?: string;
  rejectLabel?: string;
  rejectingLabel?: string;
}) {
  return (
    <div className={className}>
      <button type="button" disabled={disabled} onClick={onReject} className={rejectClassName}>
        {state === "rejecting" ? rejectingLabel : rejectLabel}
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onApprove}
        className={approveClassName}
        style={approveStyle}
      >
        {state === "approving" ? approvingLabel : approveLabel}
      </button>
    </div>
  );
}
