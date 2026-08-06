// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { ProfileTab } from "./profile-tab";

afterEach(() => {
  cleanup();
});

describe("ProfileTab", () => {
  it("shows state-neutral empty copy (IPI-919 — no unconditional Restart analysis)", () => {
    render(<ProfileTab profile={{}} />);

    expect(
      screen.getByText(/Brand profile not analyzed yet\. Fields populate once brand analysis completes\./),
    ).toBeTruthy();
    expect(screen.queryByText(/Restart analysis/i)).toBeNull();
  });
});
