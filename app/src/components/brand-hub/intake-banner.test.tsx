// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { IntakeBanner } from "./intake-banner";

afterEach(() => {
  cleanup();
});

describe("IntakeBanner", () => {
  it("shows state-neutral copy for brand_created (IPI-919 — no Restart analysis)", () => {
    render(<IntakeBanner status="brand_created" />);

    expect(screen.getByText("Analysis not started yet.")).toBeTruthy();
    expect(screen.queryByText(/Restart analysis/i)).toBeNull();
  });

  it("keeps the failed-state alert without a restart imperative", () => {
    render(<IntakeBanner status="failed" errorMessage="crawl timed out" />);

    expect(screen.getByText("Analysis failed")).toBeTruthy();
    expect(screen.getByText("crawl timed out")).toBeTruthy();
    expect(screen.queryByText(/Restart analysis/i)).toBeNull();
  });
});
