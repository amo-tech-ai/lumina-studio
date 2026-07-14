// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

const captureException = vi.fn();
vi.mock("@sentry/nextjs", () => ({
  captureException: (...args: unknown[]) => captureException(...args),
}));

import { PlannerErrorBoundary } from "./planner-error-boundary";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("PlannerErrorBoundary", () => {
  it("reports the error to Sentry — QA scenario 9: this is the deterministic substitute for a live-forced route error, since triggering a real Supabase/RLS failure mid E2E-run would require mutating a shared dev server's env/DB state", () => {
    const error = Object.assign(new Error("relation planner.assignments does not exist"), {
      digest: "abc123",
    });
    render(<PlannerErrorBoundary error={error} reset={() => {}} />);

    expect(captureException).toHaveBeenCalledTimes(1);
    expect(captureException).toHaveBeenCalledWith(error);
  });

  it("never renders the raw error message — driver-internal text must not reach the user", () => {
    const error = new Error("relation planner.assignments does not exist");
    render(<PlannerErrorBoundary error={error} reset={() => {}} />);

    expect(screen.queryByText(error.message)).toBeNull();
    expect(screen.getByText("Please try again in a moment.")).toBeDefined();
  });

  it("renders inside an alert role so assistive tech announces it", () => {
    render(<PlannerErrorBoundary error={new Error("boom")} reset={() => {}} />);
    expect(screen.getByRole("alert")).toBeDefined();
  });

  it("Try again button calls reset()", () => {
    const reset = vi.fn();
    render(<PlannerErrorBoundary error={new Error("boom")} reset={reset} />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
