// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { ScoresTab } from "./scores-tab";

afterEach(() => {
  cleanup();
});

describe("ScoresTab", () => {
  it("shows state-neutral empty copy (IPI-919 — no unconditional Restart analysis)", () => {
    render(<ScoresTab scores={[]} />);

    expect(
      screen.getByText(/No scores yet\. Scores appear here once brand analysis completes\./),
    ).toBeTruthy();
    expect(screen.queryByText(/Restart analysis/i)).toBeNull();
  });
});
