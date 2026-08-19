// IPI-906 · PLN-UX-002 — map existing MutationResult codes onto recovery UX.
// Does not invent a second error taxonomy or mutation API. Codes come from
// mutations.ts (STALE_VERSION, DEPENDENCY_CHANGED, FORBIDDEN, …).

import type { MutationResult, PlannerMutationError } from "./types";

export type PlannerRecoveryKind =
  | "stale"
  | "dependency"
  | "unauthorized"
  | "validation"
  | "network"
  | "unknown"
  | "not_found"
  | "terminal"
  | "idempotency"
  | "refresh";

export type PlannerRecoveryField = "title" | "startDate" | "endDate";

export type PlannerRecoveryState = {
  kind: PlannerRecoveryKind;
  code: string;
  title: string;
  message: string;
  /** Uncommitted write — retry with the same idempotency key (transport or UNKNOWN_ERROR). */
  retrySafe: boolean;
  /** Refresh last successful query data; keep unsaved draft fields. */
  reviewLatest: boolean;
  /** Accept server values (replace draft with authoritative row). */
  reloadLatest: boolean;
  /** Task is gone — close the stale detail instead of advertising refresh. */
  dismissSelection: boolean;
  field?: PlannerRecoveryField;
};

const TITLES: Record<PlannerRecoveryKind, string> = {
  stale: "This plan changed.",
  dependency: "This move couldn't be saved.",
  unauthorized: "You don't have permission.",
  validation: "Check the highlighted field.",
  network: "Connection lost before this saved.",
  unknown: "This change didn't save.",
  not_found: "This task is no longer available.",
  terminal: "This plan can no longer be edited.",
  idempotency: "This request is already in progress.",
  refresh: "The change saved, but this view is out of date.",
};

function kindForCode(code: string, transport: boolean): PlannerRecoveryKind {
  if (transport) return "network";
  switch (code) {
    case "STALE_VERSION":
      return "stale";
    case "DEPENDENCY_CHANGED":
      return "dependency";
    case "FORBIDDEN":
    case "UNAUTHENTICATED":
      return "unauthorized";
    case "INVALID_INPUT":
      return "validation";
    case "NOT_FOUND":
      return "not_found";
    case "INSTANCE_TERMINAL":
      return "terminal";
    case "IDEMPOTENCY_CONFLICT":
      return "idempotency";
    default:
      return "unknown";
  }
}

function inferField(message: string): PlannerRecoveryField | undefined {
  if (/title/i.test(message)) return "title";
  if (/end date|endDate/i.test(message)) return "endDate";
  if (/start date|startDate|date/i.test(message)) return "startDate";
  return undefined;
}

export function mapPlannerMutationError(
  error: PlannerMutationError,
  opts?: { transport?: boolean },
): PlannerRecoveryState {
  const kind = kindForCode(error.code, opts?.transport === true);
  const reviewLatest =
    kind === "stale" || kind === "dependency" || kind === "idempotency";
  return {
    kind,
    code: error.code,
    title: TITLES[kind],
    message: error.message,
    // UNKNOWN_ERROR from an uncommitted RPC is the same class as transport:
    // Retry must keep the in-flight proposal / idempotency key.
    retrySafe: kind === "network" || kind === "unknown",
    reviewLatest,
    reloadLatest: reviewLatest,
    dismissSelection: kind === "not_found",
    field: kind === "validation" ? inferField(error.message) : undefined,
  };
}

/** Write already committed; only the follow-up selection refresh failed. */
export function mapRefreshAfterCommitFailure(): PlannerRecoveryState {
  return {
    kind: "refresh",
    code: "UNKNOWN_ERROR",
    title: TITLES.refresh,
    message: "Reload to see the latest plan. The save already completed.",
    retrySafe: false,
    reviewLatest: true,
    reloadLatest: true,
    dismissSelection: false,
  };
}

/** Transport / abort before the server committed — safe to retry. */
export function mapThrownPlannerFailure(_err?: unknown): PlannerRecoveryState {
  return mapPlannerMutationError(
    { code: "UNKNOWN_ERROR", message: "The request could not be completed." },
    { transport: true },
  );
}

export function mapMutationFailure<T>(result: Extract<MutationResult<T>, { ok: false }>): PlannerRecoveryState {
  return mapPlannerMutationError(result.error);
}

/** Same opener-ref idea as usePlannerSelection: restore only if still connected. */
export function restorePlannerFocus(target: HTMLElement | null | undefined) {
  if (target && target.isConnected) target.focus();
}
