// @vitest-environment jsdom
import { describe, expect, it, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import type { ShootRow } from "./ShootCard";

vi.mock("./shoots-list-intel.module.css", () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
// ShootsListIntelDetail → ShootCard imports the base module too.
vi.mock("./shoots-list.module.css", () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock("next/image", () => ({
  default: () => null,
}));

import { ShootsListIntelDetail } from "./shoots-list-intel-detail";

const SHOOT: ShootRow = {
  id: "42",
  name: "Spring Campaign",
  type: "Lookbook",
  status: "active",
  dna_score: 87,
  target_channels: ["instagram"],
  estimated_budget: 12000,
  updated_at: "2026-05-01T00:00:00.000Z",
};

afterEach(() => cleanup());

describe("ShootsListIntelDetail", () => {
  it("shows the prompt when nothing is selected", () => {
    render(<ShootsListIntelDetail selected={null} />);
    expect(screen.getByTestId("shoots-intel-prompt")).toBeTruthy();
  });

  it("renders the selected preview with an Open shoot link to the detail route", () => {
    render(<ShootsListIntelDetail selected={SHOOT} />);
    expect(screen.getByTestId("shoots-intel-selected")).toBeTruthy();
    expect(screen.getByText("Spring Campaign")).toBeTruthy();
    const open = screen.getByRole("link", { name: "Open shoot" });
    expect(open.getAttribute("href")).toBe("/app/shoots/42");
  });
});
