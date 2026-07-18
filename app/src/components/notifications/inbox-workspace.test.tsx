// @vitest-environment jsdom
// No @testing-library/jest-dom in this repo — assert with plain DOM/vitest, not toBeInTheDocument().
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("./inbox.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/empty-state.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/error-state.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import type { NotificationItem } from "@/lib/notifications/notification-service";
import { InboxSkeleton, InboxWorkspace } from "./inbox-workspace";

function item(overrides: Partial<NotificationItem> = {}): NotificationItem {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    kind: "booking_confirmed",
    payload: { status: "confirmed" },
    created_at: new Date().toISOString(),
    read: false,
    deep_link: null,
    ...overrides,
  };
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

beforeEach(() => {
  refresh.mockReset();
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("InboxWorkspace", () => {
  it("Error state: renders ErrorState with retry calling router.refresh()", () => {
    render(<InboxWorkspace initialItems={null} fetchError="Unable to load notifications." />);
    expect(screen.getByTestId("error-state")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("Empty state: renders EmptyState when there are zero notifications", () => {
    render(<InboxWorkspace initialItems={[]} fetchError={null} />);
    expect(screen.getByTestId("empty-state")).toBeTruthy();
    expect(screen.getByText("No notifications yet")).toBeTruthy();
  });

  it("Populated state: groups rows under Today/Yesterday/This week/Earlier headers", () => {
    render(
      <InboxWorkspace
        initialItems={[
          item({ id: "n-today", kind: "booking_confirmed", created_at: daysAgoIso(0) }),
          item({ id: "n-yesterday", kind: "booking_approved", created_at: daysAgoIso(1) }),
          item({ id: "n-week", kind: "booking_quoted", created_at: daysAgoIso(4) }),
          item({ id: "n-earlier", kind: "booking_expired", created_at: daysAgoIso(30) }),
        ]}
        fetchError={null}
      />,
    );
    expect(screen.getByText("Today")).toBeTruthy();
    expect(screen.getByText("Yesterday")).toBeTruthy();
    expect(screen.getByText("This week")).toBeTruthy();
    expect(screen.getByText("Earlier")).toBeTruthy();
    expect(screen.getAllByTestId("notification-row")).toHaveLength(4);
  });

  it("Marking-read: click removes the dot, dims the row, and persists via POST /api/notifications/read", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({ ok: true });

    render(<InboxWorkspace initialItems={[item({ id: "n1", read: false })]} fetchError={null} />);

    const row = screen.getByTestId("notification-row") as HTMLButtonElement;
    expect(screen.getByLabelText("Unread")).toBeTruthy();

    fireEvent.click(row);

    // Optimistic: dot gone immediately, row disabled while pending.
    expect(screen.queryByLabelText("Unread")).toBeNull();
    expect(row.disabled).toBe(true);

    await waitFor(() => expect(row.disabled).toBe(false));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/notifications/read",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ notification_ids: ["n1"] }),
      }),
    );
  });

  it("Marking-read: rolls back the optimistic update if the POST fails", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({ ok: false, status: 500 });

    render(<InboxWorkspace initialItems={[item({ id: "n1", read: false })]} fetchError={null} />);
    fireEvent.click(screen.getByTestId("notification-row"));

    await waitFor(() => expect(screen.getByLabelText("Unread")).toBeTruthy());
  });

  it("Loading state: InboxSkeleton renders 5 shimmer rows", () => {
    render(<InboxSkeleton />);
    const skeleton = screen.getByTestId("inbox-skeleton");
    expect(skeleton.children).toHaveLength(5);
  });
});
