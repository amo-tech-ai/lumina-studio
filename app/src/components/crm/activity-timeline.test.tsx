// @vitest-environment jsdom
import { describe, expect, it, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

vi.mock("./activity-timeline.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/empty-state.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));

import { ActivityTimeline } from "./activity-timeline";
import type { ActivityRow } from "@/lib/crm/queries";

afterEach(() => cleanup());

function activity(overrides: Partial<ActivityRow> = {}): ActivityRow {
  return {
    id: "a1",
    org_id: "org-1",
    company_id: "c1",
    contact_id: null,
    deal_id: null,
    type: "note",
    body: "Sent the proposal",
    due_at: null,
    completed_at: null,
    created_by: null,
    created_at: "2026-07-01T12:00:00.000Z",
    updated_at: "2026-07-01T12:00:00.000Z",
    ...overrides,
  };
}

describe("ActivityTimeline", () => {
  it("renders one row per activity with its type label", () => {
    render(
      <ActivityTimeline
        activities={[
          activity({ id: "a1", type: "call", body: "Scoping call" }),
          activity({ id: "a2", type: "email", body: "Sent follow-up" }),
        ]}
      />,
    );
    expect(screen.getByText("Call")).toBeDefined();
    expect(screen.getByText("Email")).toBeDefined();
    expect(screen.getByText("Scoping call")).toBeDefined();
    expect(screen.getByText("Sent follow-up")).toBeDefined();
  });

  it("falls back to a neutral label for an unrecognized type instead of crashing", () => {
    render(<ActivityTimeline activities={[activity({ type: "some_future_type" })]} />);
    expect(screen.getByText("Activity")).toBeDefined();
  });

  it("shows the derived task state (overdue/upcoming/done) only for task-type rows", () => {
    render(
      <ActivityTimeline
        activities={[
          activity({ id: "a1", type: "task", due_at: "2020-01-01T00:00:00.000Z", completed_at: null }),
          activity({ id: "a2", type: "note", due_at: "2020-01-01T00:00:00.000Z", completed_at: null }),
        ]}
      />,
    );
    expect(screen.getByText("overdue")).toBeDefined();
  });

  it("renders an honest EmptyState with no fake rows when there is no activity", () => {
    render(<ActivityTimeline activities={[]} />);
    expect(screen.getByText("No activity yet")).toBeDefined();
    expect(screen.queryByTestId("activity-timeline")).toBeNull();
  });

  it("renders as a semantic ordered list, not a custom interactive widget", () => {
    render(<ActivityTimeline activities={[activity()]} />);
    expect(screen.getByRole("list")).toBeDefined();
  });
});
