// @vitest-environment jsdom
import { describe, expect, it, afterEach, vi } from "vitest";
import { useEffect } from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

vi.mock("./shoot-detail.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/empty-state.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/error-state.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/status-chip.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));

vi.mock("next/image", () => ({ default: (props: { alt: string }) => <img alt={props.alt} /> }));

const mockUseAgentContext = vi.fn();
vi.mock("@copilotkit/react-core/v2", () => ({
  useAgentContext: (...args: unknown[]) => mockUseAgentContext(...args),
}));

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import { ShootDetailWorkspace } from "./shoot-detail-workspace";
import { ShootLoadStateProvider, useShootLoadState } from "./shoot-load-state";
import { ActiveBrandProvider, useActiveBrand } from "@/context/active-brand-context";
import type { ShootDetailPayload } from "@/lib/shoot/get-shoot-detail";
import type { ShootLoadState } from "./shoot-load-state";

afterEach(() => {
  cleanup();
  mockUseAgentContext.mockClear();
});

function renderWorkspace(data: ShootDetailPayload | null, fetchError: string | null) {
  return render(
    <ShootLoadStateProvider>
      <ActiveBrandProvider>
        <ShootDetailWorkspace data={data} fetchError={fetchError} />
      </ActiveBrandProvider>
    </ShootLoadStateProvider>,
  );
}

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
    renderWorkspace(null, "Unable to load this shoot.");
    expect(screen.getByText("Unable to load this shoot.")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("swaps the whole workspace (not just the Shots tab) when there are no shots", () => {
    renderWorkspace(payload({ shots: [] }), null);
    expect(screen.getByText("Spring Campaign — no shots yet")).toBeDefined();
    expect(screen.queryByRole("tablist")).toBeNull();
  });
});

describe("ShootDetailWorkspace — agent context contract", () => {
  it("forwards shoot/brand ids on populated and empty shot-list branches", () => {
    const { unmount } = renderWorkspace(payload(), null);
    expect(mockUseAgentContext).toHaveBeenCalled();
    const populated = mockUseAgentContext.mock.calls.at(-1)?.[0] as {
      value: Record<string, unknown>;
    };
    expect(populated.value).toMatchObject({
      surface: "shoot-detail",
      shoot_id: "shoot-1",
      brand_id: "brand-1",
      shot_count: 1,
      deliverable_count: 0,
    });
    unmount();
    mockUseAgentContext.mockClear();

    renderWorkspace(payload({ shots: [] }), null);
    const empty = mockUseAgentContext.mock.calls.at(-1)?.[0] as {
      description: string;
      value: { suggested_next_actions: string[]; shot_count: number };
    };
    expect(empty.value).toMatchObject({
      shoot_id: "shoot-1",
      brand_id: "brand-1",
      shot_count: 0,
    });
    expect(empty.description).toMatch(/Shot list is empty/i);
    expect(empty.value.suggested_next_actions.some((a) => /plan this shoot/i.test(a))).toBe(true);
  });

  it("does not inject context when shoot data failed to load", () => {
    renderWorkspace(null, "Unable to load this shoot.");
    expect(mockUseAgentContext).not.toHaveBeenCalled();
  });
});

describe("ShootDetailWorkspace — populated", () => {
  it("renders the hero, all 9 tabs, and switches tab content on click", () => {
    renderWorkspace(payload(), null);
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
    renderWorkspace(payload({ crew: [] }), null);
    fireEvent.click(screen.getByRole("tab", { name: "Team" }));
    expect(screen.getByTestId("empty-state")).toBeDefined();
  });

  it("Schedule tab shows EmptyState when there is no date or location", () => {
    renderWorkspace(
      payload({ shoot: { ...payload().shoot, start_date: null, end_date: null, location: null } }),
      null,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Schedule" }));
    expect(screen.getByTestId("empty-state")).toBeDefined();
  });

  it("Budget tab shows EmptyState when no estimated budget or breakdown exists", () => {
    renderWorkspace(payload(), null);
    fireEvent.click(screen.getByRole("tab", { name: "Budget" }));
    expect(screen.getByTestId("empty-state")).toBeDefined();
  });

  it("Assets tab shows EmptyState with zero assets", () => {
    renderWorkspace(payload({ assets: [] }), null);
    fireEvent.click(screen.getByRole("tab", { name: "Assets" }));
    expect(screen.getByTestId("empty-state")).toBeDefined();
  });
});

describe("ShootDetailWorkspace — review-fix regressions", () => {
  it("Budget tab renders real actual_cost even when no estimate exists (not EmptyState)", () => {
    renderWorkspace(
      payload({ shoot: { ...payload().shoot, estimated_budget: null, actual_cost: 1200 } }),
      null,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Budget" }));
    expect(screen.queryByTestId("empty-state")).toBeNull();
    expect(screen.getByText("$1,200")).toBeDefined();
  });

  it('a "planned" deliverable (the real production status value) counts as not-yet-ready, not muted-unknown', () => {
    renderWorkspace(
      payload({
        deliverables: [{ id: "d1", channel: "amazon", format: "JPG", quantity: 8, status: "planned" }],
      }),
      null,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Deliverables" }));
    expect(screen.getByText("· 0/1 ready")).toBeDefined();
    expect(screen.getByText("planned")).toBeDefined();
  });

  it("Overview and Deliverables agree on the ready count for the same data (delivered counts as ready)", () => {
    const data = payload({
      deliverables: [{ id: "d1", channel: "amazon", format: "JPG", quantity: 8, status: "delivered" }],
    });
    renderWorkspace(data, null);
    fireEvent.click(screen.getByRole("tab", { name: "Deliverables" }));
    expect(screen.getByText("· 1/1 ready")).toBeDefined();
  });

  it("isDeliverableReady is case/whitespace-insensitive (free-text status column)", () => {
    const data = payload({
      deliverables: [{ id: "d1", channel: "amazon", format: "JPG", quantity: 8, status: "Delivered " }],
    });
    renderWorkspace(data, null);
    fireEvent.click(screen.getByRole("tab", { name: "Deliverables" }));
    expect(screen.getByText("· 1/1 ready")).toBeDefined();
  });

  it("hero renders a non-Cloudinary cover_url as a real image, not the decorative fallback", () => {
    renderWorkspace(
      payload({ shoot: { ...payload().shoot, cover_url: "https://example.com/real-cover.jpg" } }),
      null,
    );
    const heroImg = screen.getAllByAltText("")[0] as HTMLImageElement;
    expect(heroImg.src).toBe("https://example.com/real-cover.jpg");
  });
});

describe("ShootDetailWorkspace — reports real load state to the operator shell (IPI-921)", () => {
  function renderWithProbe(data: ShootDetailPayload | null, fetchError: string | null) {
    let state: ShootLoadState | null = null;
    function Probe() {
      state = useShootLoadState().shootLoad;
      return null;
    }
    const view = render(
      <ShootLoadStateProvider>
        <ActiveBrandProvider>
          <Probe />
          <ShootDetailWorkspace data={data} fetchError={fetchError} />
        </ActiveBrandProvider>
      </ShootLoadStateProvider>,
    );
    return { ...view, readState: () => state };
  }

  it("marks the shoot loaded when data arrives", () => {
    const { readState } = renderWithProbe(payload(), null);
    expect(readState()).toEqual({ loaded: true, failed: false });
  });

  it("marks the shoot failed when fetchError is set (no fake loaded state)", () => {
    const { readState } = renderWithProbe(null, "Unable to load this shoot.");
    expect(readState()).toEqual({ loaded: false, failed: true });
  });

  it("keeps the shoot unloaded when stale data and fetchError are both present", () => {
    const { readState } = renderWithProbe(payload(), "Unable to load this shoot.");
    expect(readState()).toEqual({ loaded: false, failed: true });
  });

  it("resets the load state when the workspace unmounts (provider outlives it)", () => {
    let state: ShootLoadState | null = null;
    function Probe() {
      state = useShootLoadState().shootLoad;
      return null;
    }
    function Host({ mounted }: { mounted: boolean }) {
      return (
        <ShootLoadStateProvider>
          <ActiveBrandProvider>
            <Probe />
            {mounted && <ShootDetailWorkspace data={payload()} fetchError={null} />}
          </ActiveBrandProvider>
        </ShootLoadStateProvider>
      );
    }
    const { rerender } = render(<Host mounted />);
    expect(state).toEqual({ loaded: true, failed: false });
    rerender(<Host mounted={false} />);
    expect(state).toEqual({ loaded: false, failed: false });
  });
});

describe("ShootDetailWorkspace — active brand follows the open shoot (IPI-927 review)", () => {
  function renderWithBrandProbe(
    data: ShootDetailPayload | null,
    fetchError: string | null,
    seedStaleBrand = false,
  ) {
    let current: string | null = null;
    function Probe() {
      const { activeBrandId, setActiveBrandId } = useActiveBrand();
      current = activeBrandId;
      useEffect(() => {
        if (seedStaleBrand) setActiveBrandId("stale-brand");
      }, [setActiveBrandId]);
      return null;
    }
    const view = render(
      <ShootLoadStateProvider>
        <ActiveBrandProvider>
          <Probe />
          <ShootDetailWorkspace data={data} fetchError={fetchError} />
        </ActiveBrandProvider>
      </ShootLoadStateProvider>,
    );
    return { ...view, readBrand: () => current };
  }

  it("aligns the active brand with the shoot's brand when data loads", () => {
    const { readBrand } = renderWithBrandProbe(payload(), null);
    expect(readBrand()).toBe("brand-1");
  });

  it("overrides a stale global brand when a shoot loads (no contradiction for agents)", () => {
    const { readBrand } = renderWithBrandProbe(payload(), null, true);
    expect(readBrand()).toBe("brand-1");
  });

  it("does not touch the active brand when the shoot failed to load", () => {
    const { readBrand } = renderWithBrandProbe(null, "Unable to load this shoot.", true);
    expect(readBrand()).toBe("stale-brand");
  });
});
