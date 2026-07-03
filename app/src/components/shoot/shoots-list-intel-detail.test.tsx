// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

vi.mock("./shoots-list-intel.module.css", () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
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

import { IntelligenceDetailProvider, useIntelligenceDetail } from "@/context/intelligence-detail-context";
import { useShootsListIntelDetail } from "./shoots-list-intel-detail";
import type { ShootListItem } from "./ShootCard";

const SHOOT: ShootListItem = {
  id: "s1",
  name: "Spring Campaign",
  status: "active",
  dna_score: 92,
  updated_at: "2026-04-01T00:00:00Z",
  start_date: "2026-04-12",
  brandName: "Nike",
  shot_count: 12,
};

function DetailReader() {
  const { detail } = useIntelligenceDetail();
  return <div data-testid="detail-slot">{detail}</div>;
}

function IntelHarness({ selected }: { selected: ShootListItem | null }) {
  useShootsListIntelDetail(selected);
  return <DetailReader />;
}

afterEach(() => cleanup());

describe("useShootsListIntelDetail", () => {
  it("shows empty prompt when no shoot selected", () => {
    render(
      <IntelligenceDetailProvider>
        <IntelHarness selected={null} />
      </IntelligenceDetailProvider>,
    );
    expect(screen.getByTestId("shoots-intel-prompt")).toBeTruthy();
    expect(screen.getByText("Select a shoot to preview its cover and shot list.")).toBeTruthy();
  });

  it("shows selected shoot preview with open link", () => {
    render(
      <IntelligenceDetailProvider>
        <IntelHarness selected={SHOOT} />
      </IntelligenceDetailProvider>,
    );
    expect(screen.getByTestId("shoots-intel-selected")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Spring Campaign" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Open shoot" }).getAttribute("href")).toBe("/app/shoots/s1");
  });
});
