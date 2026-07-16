// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";

vi.mock("./hub-workspace.module.css", () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock("next/image", () => ({
  default: () => null,
}));

import type { PlannerInstanceSummary } from "@/lib/planner/queries";

import { parseHubSearchParams } from "./hub-params";
import { PlannerHubWorkspace } from "./hub-workspace";

afterEach(() => cleanup());

function makeItem(overrides: Partial<PlannerInstanceSummary> = {}): PlannerInstanceSummary {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    orgId: "org-1",
    workflowId: "wf-1",
    entityType: "shoot",
    entityId: "entity-1",
    name: "Summer Lookbook",
    status: "active",
    plannedStart: "2026-07-01",
    plannedEnd: "2026-08-01",
    ownerUserId: "user-1",
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    progress: 42,
    atRisk: false,
    ...overrides,
  };
}

describe("PlannerHubWorkspace — states", () => {
  it("renders the empty-portfolio state when no filters are active and there are zero results", () => {
    render(<PlannerHubWorkspace filters={parseHubSearchParams({})} items={[]} nextCursor={null} />);
    expect(screen.getByTestId("hub-empty")).toBeDefined();
    expect(screen.queryByTestId("hub-no-match")).toBeNull();
  });

  it("renders the no-match state when filters are active and there are zero results", () => {
    render(
      <PlannerHubWorkspace
        filters={parseHubSearchParams({ search: "nonexistent" })}
        items={[]}
        nextCursor={null}
      />,
    );
    expect(screen.getByTestId("hub-no-match")).toBeDefined();
    expect(screen.queryByTestId("hub-empty")).toBeNull();
  });

  it("renders active cards for a populated page", () => {
    render(
      <PlannerHubWorkspace filters={parseHubSearchParams({})} items={[makeItem()]} nextCursor={null} />,
    );
    expect(screen.getAllByTestId("hub-card")).toHaveLength(1);
  });

  it("renders archived cards when includeArchived returned an archived plan", () => {
    const archived = makeItem({ status: "archived", name: "Old Lookbook" });
    render(
      <PlannerHubWorkspace
        filters={parseHubSearchParams({ includeArchived: "true" })}
        items={[archived]}
        nextCursor={null}
      />,
    );
    const card = screen.getByRole("link", { name: "Open Old Lookbook planner" });
    expect(card).toBeDefined();
    expect(within(card).getByText("Archived")).toBeDefined();
  });

  it("renders a no-match style state (not empty-portfolio) for a zero-result page past the first", () => {
    render(
      <PlannerHubWorkspace
        filters={parseHubSearchParams({ cursor: "x".repeat(20) })}
        items={[]}
        nextCursor={null}
      />,
    );
    expect(screen.getByTestId("hub-no-match")).toBeDefined();
    expect(screen.queryByTestId("hub-empty")).toBeNull();
  });

  it("offers Start over (not a dead end) on a zero-result page past the first", () => {
    render(
      <PlannerHubWorkspace
        filters={parseHubSearchParams({ cursor: "x".repeat(20) })}
        items={[]}
        nextCursor={null}
      />,
    );
    const link = screen.getByRole("link", { name: "Start over" });
    expect(link.getAttribute("href")).toBe("/app/planner");
  });
});

describe("PlannerHubWorkspace — page-scoped attention", () => {
  it("does not render the attention band when nothing on the page is at risk", () => {
    render(
      <PlannerHubWorkspace filters={parseHubSearchParams({})} items={[makeItem()]} nextCursor={null} />,
    );
    expect(screen.queryByTestId("hub-attention-band")).toBeNull();
  });

  it("says 'On this page' rather than implying portfolio-global risk", () => {
    const atRisk = makeItem({ atRisk: true, status: "blocked" });
    render(
      <PlannerHubWorkspace filters={parseHubSearchParams({})} items={[atRisk]} nextCursor={null} />,
    );
    expect(screen.getByText("On this page: 1 plan needs attention")).toBeDefined();
  });

  it("pluralizes for more than one at-risk plan", () => {
    const items = [
      makeItem({ id: "a", name: "A", atRisk: true }),
      makeItem({ id: "b", name: "B", atRisk: true }),
    ];
    render(<PlannerHubWorkspace filters={parseHubSearchParams({})} items={items} nextCursor={null} />);
    expect(screen.getByText("On this page: 2 plans need attention")).toBeDefined();
  });

  it("shows a +N more indicator instead of silently dropping at-risk items past the first 3", () => {
    const items = [1, 2, 3, 4, 5].map((n) =>
      makeItem({ id: String(n), name: `Plan ${n}`, atRisk: true }),
    );
    render(<PlannerHubWorkspace filters={parseHubSearchParams({})} items={items} nextCursor={null} />);
    expect(screen.getByText("On this page: 5 plans need attention")).toBeDefined();
    const band = screen.getByTestId("hub-attention-band");
    expect(within(band).getAllByRole("link", { name: /^Open Plan \d planner$/ })).toHaveLength(3);
    expect(within(band).getByText("+2 more")).toBeDefined();
  });
});

describe("PlannerHubWorkspace — returned formulas and links", () => {
  it("renders the returned progress percentage unchanged, without recalculating", () => {
    render(
      <PlannerHubWorkspace
        filters={parseHubSearchParams({})}
        items={[makeItem({ progress: 73 })]}
        nextCursor={null}
      />,
    );
    const track = screen.getByTestId("hub-card").querySelector('[style*="width"]');
    expect(track?.getAttribute("style")).toContain("73%");
  });

  it("renders the returned atRisk flag via data-at-risk, unchanged", () => {
    render(
      <PlannerHubWorkspace
        filters={parseHubSearchParams({})}
        items={[makeItem({ atRisk: true, status: "blocked" })]}
        nextCursor={null}
      />,
    );
    expect(screen.getByTestId("hub-card").getAttribute("data-at-risk")).toBe("true");
  });

  it("gives each card a semantic, destination-describing link name", () => {
    render(
      <PlannerHubWorkspace
        filters={parseHubSearchParams({})}
        items={[makeItem({ name: "Q3 Retail Push" })]}
        nextCursor={null}
      />,
    );
    const link = screen.getByRole("link", { name: "Open Q3 Retail Push planner" });
    expect(link.getAttribute("href")).toBe(`/app/planner/${makeItem().id}`);
  });

  it("never renders a New Plan control", () => {
    render(
      <PlannerHubWorkspace filters={parseHubSearchParams({})} items={[makeItem()]} nextCursor={null} />,
    );
    expect(screen.queryByText(/new plan/i)).toBeNull();
  });

  it("falls back to generic entity metadata instead of crashing on an unmapped entityType", () => {
    // entityType is cast (`as EntityType`) from a raw DB column in
    // queries.ts, not runtime-validated — simulates a value outside the
    // three known entity types reaching the card.
    const unknownEntity = makeItem({
      name: "Odd Plan",
      entityType: "webinar" as unknown as PlannerInstanceSummary["entityType"],
    });
    render(
      <PlannerHubWorkspace
        filters={parseHubSearchParams({})}
        items={[unknownEntity]}
        nextCursor={null}
      />,
    );
    const card = screen.getByRole("link", { name: "Open Odd Plan planner" });
    expect(within(card).getByText("Plan")).toBeDefined();
  });
});

describe("PlannerHubWorkspace — pagination", () => {
  it("renders no pagination controls on a single, complete first page", () => {
    render(
      <PlannerHubWorkspace filters={parseHubSearchParams({})} items={[makeItem()]} nextCursor={null} />,
    );
    expect(screen.queryByTestId("hub-pagination")).toBeNull();
  });

  it("shows Next page (not Load more) when a cursor is returned, since navigation replaces the page", () => {
    render(
      <PlannerHubWorkspace
        filters={parseHubSearchParams({})}
        items={[makeItem()]}
        nextCursor="next-cursor-value"
      />,
    );
    const link = screen.getByRole("link", { name: "Next page" });
    expect(link.getAttribute("href")).toBe("/app/planner?cursor=next-cursor-value");
    expect(screen.queryByText("Load more")).toBeNull();
  });

  it("shows Start over only once past the first page, and it clears the cursor", () => {
    render(
      <PlannerHubWorkspace
        filters={parseHubSearchParams({ cursor: "x".repeat(20), search: "Summer" })}
        items={[makeItem()]}
        nextCursor={null}
      />,
    );
    const link = screen.getByRole("link", { name: "Start over" });
    expect(link.getAttribute("href")).toBe("/app/planner?search=Summer");
  });

  it("preserves active filters on the Next page link", () => {
    render(
      <PlannerHubWorkspace
        filters={parseHubSearchParams({ search: "Summer", entityType: "shoot" })}
        items={[makeItem()]}
        nextCursor="cur-2"
      />,
    );
    const link = screen.getByRole("link", { name: "Next page" });
    const href = link.getAttribute("href") ?? "";
    expect(href).toContain("search=Summer");
    expect(href).toContain("entityType=shoot");
    expect(href).toContain("cursor=cur-2");
  });
});

describe("PlannerHubWorkspace — accessibility", () => {
  it("announces the result count via a polite, atomic live region", () => {
    render(
      <PlannerHubWorkspace
        filters={parseHubSearchParams({})}
        items={[makeItem(), makeItem({ id: "2" })]}
        nextCursor={null}
      />,
    );
    const status = screen.getByRole("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(status.getAttribute("aria-atomic")).toBe("true");
    expect(status.textContent).toBe("Showing 2 plans on this page");
  });

  it("singularizes the live region for exactly one plan", () => {
    render(
      <PlannerHubWorkspace filters={parseHubSearchParams({})} items={[makeItem()]} nextCursor={null} />,
    );
    expect(screen.getByRole("status").textContent).toBe("Showing 1 plan on this page");
  });

  it("labels the search input and status select", () => {
    render(
      <PlannerHubWorkspace filters={parseHubSearchParams({})} items={[makeItem()]} nextCursor={null} />,
    );
    expect(screen.getByLabelText("Search plans")).toBeDefined();
    expect(screen.getByLabelText("Status")).toBeDefined();
  });

  it("does not issue a second query — no-match state renders directly from the passed-in items array", () => {
    // No network/query mocks exist in this test file at all; if the workspace
    // (a pure presentational component) tried to issue one, this would throw.
    render(
      <PlannerHubWorkspace
        filters={parseHubSearchParams({ status: "blocked" })}
        items={[]}
        nextCursor={null}
      />,
    );
    expect(screen.getByTestId("hub-no-match")).toBeDefined();
  });
});
