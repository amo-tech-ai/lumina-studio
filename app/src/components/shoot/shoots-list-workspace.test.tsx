// @vitest-environment jsdom
import { describe, expect, it, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

import type { ShootRow } from "./ShootCard";

vi.mock("./shoots-list.module.css", () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock("next/image", () => ({
  default: () => null,
}));

import { ShootsListWorkspace } from "./shoots-list-workspace";

const SAMPLE_SHOOTS: ShootRow[] = [
  {
    id: "1",
    name: "Spring Campaign",
    type: "Lookbook",
    status: "active",
    dna_score: 87,
    target_channels: ["instagram"],
    estimated_budget: 12000,
    updated_at: "2026-05-01T00:00:00.000Z",
  },
  {
    id: "2",
    name: "Fall Preview",
    type: "Editorial",
    status: "planning",
    dna_score: null,
    target_channels: null,
    estimated_budget: null,
    updated_at: "2026-05-02T00:00:00.000Z",
  },
  {
    id: "3",
    name: "Archive Shoot",
    type: "Product",
    status: "archived",
    dna_score: 45,
    target_channels: [],
    estimated_budget: 0,
    updated_at: "2026-04-01T00:00:00.000Z",
  },
];

afterEach(() => cleanup());

describe("ShootsListWorkspace", () => {
  it("renders sign-in prompt when unauthenticated", () => {
    render(<ShootsListWorkspace shoots={[]} isAuthenticated={false} />);
    expect(screen.getByRole("link", { name: "Sign in" })).toBeTruthy();
  });

  it("renders the empty state when there are no shoots", () => {
    render(<ShootsListWorkspace shoots={[]} isAuthenticated />);
    expect(screen.getByTestId("shoots-list-empty")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Plan shoot/ })).toBeTruthy();
  });

  it("hides search + filter controls in the empty state (DC parity)", () => {
    render(<ShootsListWorkspace shoots={[]} isAuthenticated />);
    expect(screen.queryByRole("searchbox")).toBeNull();
    expect(screen.queryByRole("group", { name: "Filter shoots" })).toBeNull();
  });

  it("renders the error state when fetchError is set", () => {
    render(<ShootsListWorkspace shoots={[]} isAuthenticated fetchError="Unable to load shoots." />);
    expect(screen.getByTestId("shoots-list-error")).toBeTruthy();
    expect(screen.getByText("Unable to load shoots.")).toBeTruthy();
    expect(screen.queryByRole("searchbox")).toBeNull();
  });

  it("renders a grid card per shoot when populated", () => {
    render(<ShootsListWorkspace shoots={SAMPLE_SHOOTS} isAuthenticated />);
    expect(screen.getByTestId("shoots-list-grid")).toBeTruthy();
    expect(screen.getAllByTestId("shoot-card")).toHaveLength(3);
  });

  it("filters by search query", () => {
    render(<ShootsListWorkspace shoots={SAMPLE_SHOOTS} isAuthenticated />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "spring" } });
    expect(screen.getAllByTestId("shoot-card")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Open Spring Campaign" })).toBeTruthy();
  });

  it("shows no-match when search has no results", () => {
    render(<ShootsListWorkspace shoots={SAMPLE_SHOOTS} isAuthenticated />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "nonexistent" } });
    expect(screen.getByTestId("shoots-list-no-match")).toBeTruthy();
  });

  it("filters by status chip", () => {
    render(<ShootsListWorkspace shoots={SAMPLE_SHOOTS} isAuthenticated />);
    fireEvent.click(screen.getByRole("button", { name: "Archived" }));
    expect(screen.getAllByTestId("shoot-card")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Open Archive Shoot" })).toBeTruthy();
  });
});
