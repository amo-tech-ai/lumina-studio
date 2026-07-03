// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

vi.mock("./shoots-list.module.css", () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock("./shoots-list-intel.module.css", () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock("next/image", () => ({
  default: () => null,
}));
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { IntelligenceDetailProvider } from "@/context/intelligence-detail-context";
import { ShootsListUiProvider } from "@/context/shoots-list-ui-context";
import { ShootsListWorkspace } from "./shoots-list-workspace";

const SAMPLE_SHOOTS = [
  {
    id: "s1",
    name: "Spring Campaign",
    status: "active",
    dna_score: 92,
    updated_at: "2026-04-01T00:00:00Z",
    start_date: "2026-04-12",
    brandName: "Nike",
  },
  {
    id: "s2",
    name: "Air Max Lookbook",
    status: "post_production",
    dna_score: 88,
    updated_at: "2026-04-02T00:00:00Z",
    start_date: "2026-04-18",
    brandName: "Nike",
  },
  {
    id: "s3",
    name: "Studio Editorial",
    status: "complete",
    dna_score: 95,
    updated_at: "2026-03-01T00:00:00Z",
    start_date: "2026-03-30",
    brandName: "Nike",
  },
];

function renderWorkspace(props: React.ComponentProps<typeof ShootsListWorkspace>) {
  return render(
    <IntelligenceDetailProvider>
      <ShootsListUiProvider>
        <ShootsListWorkspace {...props} />
      </ShootsListUiProvider>
    </IntelligenceDetailProvider>,
  );
}

afterEach(() => cleanup());

describe("ShootsListWorkspace", () => {
  it("renders grid cards for populated list", () => {
    renderWorkspace({ shoots: SAMPLE_SHOOTS, isAuthenticated: true });
    expect(screen.getByTestId("shoots-list-grid")).toBeTruthy();
    expect(screen.getAllByTestId("shoot-list-card")).toHaveLength(3);
  });

  it("filters by search query", () => {
    renderWorkspace({ shoots: SAMPLE_SHOOTS, isAuthenticated: true });
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "air max" } });
    expect(screen.getAllByTestId("shoot-list-card")).toHaveLength(1);
  });

  it("keeps header and grid shell when no shoots (no full-page empty)", () => {
    renderWorkspace({ shoots: [], isAuthenticated: true });
    expect(screen.queryByTestId("shoots-list-empty")).toBeNull();
    expect(screen.getByRole("heading", { name: "Shoots" })).toBeTruthy();
    expect(screen.getByText("No shoots planned")).toBeTruthy();
    expect(screen.getByTestId("shoots-list-grid")).toBeTruthy();
  });

  it("highlights selected card", () => {
    renderWorkspace({ shoots: SAMPLE_SHOOTS, isAuthenticated: true });
    fireEvent.click(screen.getAllByTestId("shoot-list-card")[0]);
    expect(screen.getAllByTestId("shoot-list-card")[0].getAttribute("data-selected")).toBe("true");
  });
});
