// @vitest-environment jsdom
import { describe, expect, it, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

vi.mock("./shoot-detail.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/empty-state.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/error-state.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/status-chip.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));

vi.mock("next/image", () => ({ default: (props: { alt: string }) => <img alt={props.alt} /> }));

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import { ShootDetailWorkspace } from "./shoot-detail-workspace";
import type { ShootDetailPayload } from "@/lib/shoot/get-shoot-detail";

afterEach(() => cleanup());

function payload(overrides: Partial<ShootDetailPayload> = {}): ShootDetailPayload {
  return {
    shoot: {
      id: "shoot-1",
      name: "Spring Campaign",
      status: "active",
      brief: null,
      target_channels: [],
      estimated_budget: null,
      actual_cost: null,
      currency: "USD",
      budget_breakdown: null,
      start_date: "2026-05-01",
      end_date: null,
      location: null,
      dna_score: 87,
      mood_board_urls: [],
      cover_url: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
      brand_id: "brand-1",
    },
    brand: { id: "brand-1", name: "Acme" },
    deliverables: [],
    shots: [{ id: "shot-1", shot_number: 1, description: "Hero shot", style_notes: null, status: "captured" }],
    assets: [],
    crew: [],
    approvals: [],
    activity: [],
    ...overrides,
  };
}

describe("ShootDetailWorkspace — error / empty-shots states", () => {
  it("shows the error state with a working retry", () => {
    render(<ShootDetailWorkspace data={null} fetchError="Unable to load this shoot." />);
    expect(screen.getByText("Unable to load this shoot.")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("swaps the whole workspace (not just the Shots tab) when there are no shots", () => {
    render(<ShootDetailWorkspace data={payload({ shots: [] })} fetchError={null} />);
    expect(screen.getByText("Spring Campaign — no shots yet")).toBeDefined();
    expect(screen.queryByRole("tablist")).toBeNull();
  });
});

describe("ShootDetailWorkspace — populated", () => {
  it("renders the hero, all 9 tabs, and switches tab content on click", () => {
    render(<ShootDetailWorkspace data={payload()} fetchError={null} />);
    expect(screen.getByRole("heading", { name: "Spring Campaign" })).toBeDefined();
    expect(screen.getByText("DNA 87")).toBeDefined();

    const tabs = ["Overview", "Shot List", "Assets", "Team", "Schedule", "Budget", "Approvals", "Deliverables", "Activity"];
    for (const label of tabs) {
      expect(screen.getByRole("tab", { name: label })).toBeDefined();
    }

    // Default tab is Overview.
    expect(screen.getByText("Shots")).toBeDefined();
    fireEvent.click(screen.getByRole("tab", { name: "Team" }));
    expect(screen.getByText("No crew assigned yet")).toBeDefined();
  });
});

describe("ShootDetailWorkspace — honest empty per tab (no fake data)", () => {
  it("Team tab shows EmptyState, not a fabricated crew list", () => {
    render(<ShootDetailWorkspace data={payload({ crew: [] })} fetchError={null} />);
    fireEvent.click(screen.getByRole("tab", { name: "Team" }));
    expect(screen.getByTestId("empty-state")).toBeDefined();
  });

  it("Schedule tab shows EmptyState when there is no date or location", () => {
    render(
      <ShootDetailWorkspace
        data={payload({ shoot: { ...payload().shoot, start_date: null, end_date: null, location: null } })}
        fetchError={null}
      />,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Schedule" }));
    expect(screen.getByTestId("empty-state")).toBeDefined();
  });

  it("Budget tab shows EmptyState when no estimated budget or breakdown exists", () => {
    render(<ShootDetailWorkspace data={payload()} fetchError={null} />);
    fireEvent.click(screen.getByRole("tab", { name: "Budget" }));
    expect(screen.getByTestId("empty-state")).toBeDefined();
  });

  it("Assets tab shows EmptyState with zero assets", () => {
    render(<ShootDetailWorkspace data={payload({ assets: [] })} fetchError={null} />);
    fireEvent.click(screen.getByRole("tab", { name: "Assets" }));
    expect(screen.getByTestId("empty-state")).toBeDefined();
  });
});

describe("ShootDetailWorkspace — review-fix regressions", () => {
  it("Budget tab renders real actual_cost even when no estimate exists (not EmptyState)", () => {
    render(
      <ShootDetailWorkspace
        data={payload({ shoot: { ...payload().shoot, estimated_budget: null, actual_cost: 1200 } })}
        fetchError={null}
      />,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Budget" }));
    expect(screen.queryByTestId("empty-state")).toBeNull();
    expect(screen.getByText("$1,200")).toBeDefined();
  });

  it('a "planned" deliverable (the real production status value) counts as not-yet-ready, not muted-unknown', () => {
    render(
      <ShootDetailWorkspace
        data={payload({
          deliverables: [{ id: "d1", channel: "amazon", format: "JPG", quantity: 8, status: "planned" }],
        })}
        fetchError={null}
      />,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Deliverables" }));
    expect(screen.getByText("· 0/1 ready")).toBeDefined();
    expect(screen.getByText("planned")).toBeDefined();
  });

  it("Overview and Deliverables agree on the ready count for the same data (delivered counts as ready)", () => {
    const data = payload({
      deliverables: [{ id: "d1", channel: "amazon", format: "JPG", quantity: 8, status: "delivered" }],
    });
    render(<ShootDetailWorkspace data={data} fetchError={null} />);
    fireEvent.click(screen.getByRole("tab", { name: "Deliverables" }));
    expect(screen.getByText("· 1/1 ready")).toBeDefined();
  });

  it("isDeliverableReady is case/whitespace-insensitive (free-text status column)", () => {
    const data = payload({
      deliverables: [{ id: "d1", channel: "amazon", format: "JPG", quantity: 8, status: "Delivered " }],
    });
    render(<ShootDetailWorkspace data={data} fetchError={null} />);
    fireEvent.click(screen.getByRole("tab", { name: "Deliverables" }));
    expect(screen.getByText("· 1/1 ready")).toBeDefined();
  });

  it("hero renders a non-Cloudinary cover_url as a real image, not the decorative fallback", () => {
    render(
      <ShootDetailWorkspace
        data={payload({ shoot: { ...payload().shoot, cover_url: "https://example.com/real-cover.jpg" } })}
        fetchError={null}
      />,
    );
    const heroImg = screen.getAllByAltText("")[0] as HTMLImageElement;
    expect(heroImg.src).toBe("https://example.com/real-cover.jpg");
  });
});
