// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import {
  mapMutationFailure,
  mapPlannerMutationError,
  mapRefreshAfterCommitFailure,
  mapThrownPlannerFailure,
  restorePlannerFocus,
} from "./mutation-recovery";

describe("mapPlannerMutationError", () => {
  it("maps STALE_VERSION to review/reload, never blind retry", () => {
    const recovery = mapPlannerMutationError({
      code: "STALE_VERSION",
      message: "This task changed since you last viewed it. Refresh and try again.",
    });
    expect(recovery.kind).toBe("stale");
    expect(recovery.retrySafe).toBe(false);
    expect(recovery.reviewLatest).toBe(true);
    expect(recovery.reloadLatest).toBe(true);
    expect(recovery.title).toMatch(/plan changed/i);
  });

  it("maps DEPENDENCY_CHANGED with the adapter's affected-task message", () => {
    const message =
      'Cannot shift "Fitting" before predecessor "Casting" (requires 0-day lag after 2026-03-06).';
    const recovery = mapPlannerMutationError({ code: "DEPENDENCY_CHANGED", message });
    expect(recovery.kind).toBe("dependency");
    expect(recovery.retrySafe).toBe(false);
    expect(recovery.reviewLatest).toBe(true);
    expect(recovery.message).toBe(message);
  });

  it("maps FORBIDDEN / UNAUTHENTICATED with no retry", () => {
    for (const code of ["FORBIDDEN", "UNAUTHENTICATED"] as const) {
      const recovery = mapPlannerMutationError({
        code,
        message: "You don't have permission to edit this task.",
      });
      expect(recovery.kind).toBe("unauthorized");
      expect(recovery.retrySafe).toBe(false);
      expect(recovery.reloadLatest).toBe(false);
    }
  });

  it("maps INVALID_INPUT to validation and infers a date field", () => {
    const recovery = mapPlannerMutationError({
      code: "INVALID_INPUT",
      message: "That request wasn't valid.",
    });
    expect(recovery.kind).toBe("validation");
    expect(recovery.retrySafe).toBe(false);
    expect(recovery.field).toBeUndefined();

    const dated = mapPlannerMutationError({
      code: "INVALID_INPUT",
      message: "Start date is required.",
    });
    expect(dated.field).toBe("startDate");
  });

  it("maps transport throws to network retry, without a new error code", () => {
    const recovery = mapThrownPlannerFailure(new Error("network down"));
    expect(recovery.kind).toBe("network");
    expect(recovery.code).toBe("UNKNOWN_ERROR");
    expect(recovery.retrySafe).toBe(true);
    expect(recovery.reloadLatest).toBe(false);
  });

  it("maps UNKNOWN_ERROR from the server as unknown — Retry keeps the uncommitted proposal", () => {
    const recovery = mapMutationFailure({
      ok: false,
      error: { code: "UNKNOWN_ERROR", message: "The request could not be completed." },
    });
    expect(recovery.kind).toBe("unknown");
    expect(recovery.retrySafe).toBe(true);
    expect(recovery.reloadLatest).toBe(false);
    expect(recovery.dismissSelection).toBe(false);
  });

  it("maps NOT_FOUND to close the stale selection, not review/reload", () => {
    const recovery = mapPlannerMutationError({
      code: "NOT_FOUND",
      message: "This task is no longer available.",
    });
    expect(recovery.kind).toBe("not_found");
    expect(recovery.retrySafe).toBe(false);
    expect(recovery.reviewLatest).toBe(false);
    expect(recovery.reloadLatest).toBe(false);
    expect(recovery.dismissSelection).toBe(true);
  });

  it("maps a post-commit refresh failure as refresh, never another write", () => {
    const recovery = mapRefreshAfterCommitFailure();
    expect(recovery.kind).toBe("refresh");
    expect(recovery.retrySafe).toBe(false);
    expect(recovery.reviewLatest).toBe(true);
    expect(recovery.reloadLatest).toBe(true);
    expect(recovery.dismissSelection).toBe(false);
  });

  it("maps IDEMPOTENCY_CONFLICT to review, not retry", () => {
    const recovery = mapPlannerMutationError({
      code: "IDEMPOTENCY_CONFLICT",
      message: "This request conflicts with one already in progress. Refresh and try again.",
    });
    expect(recovery.kind).toBe("idempotency");
    expect(recovery.retrySafe).toBe(false);
    expect(recovery.reviewLatest).toBe(true);
  });
});

describe("restorePlannerFocus", () => {
  it("focuses a connected element and skips a detached one", () => {
    const connected = document.createElement("button");
    document.body.appendChild(connected);
    restorePlannerFocus(connected);
    expect(document.activeElement).toBe(connected);

    connected.remove();
    expect(() => restorePlannerFocus(connected)).not.toThrow();
  });
});
