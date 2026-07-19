// @vitest-environment jsdom
// No @testing-library/jest-dom in this repo — assert with plain DOM/vitest, not toBeInTheDocument().
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

vi.mock("./inbox.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));

import type { NotificationItem } from "@/lib/notifications/notification-service";
import { NotificationRow } from "./notification-row";

afterEach(cleanup);

function item(overrides: Partial<NotificationItem> = {}): NotificationItem {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    kind: "booking_confirmed",
    payload: { status: "confirmed", booking_id: "22222222-2222-4222-8222-222222222222" },
    created_at: new Date().toISOString(),
    read: false,
    deep_link: null,
    ...overrides,
  };
}

describe("NotificationRow", () => {
  it("renders the kind-derived title and an unread dot when unread", () => {
    render(<NotificationRow item={item({ read: false })} onOpen={() => {}} />);
    expect(screen.getByText("Booking confirmed")).toBeTruthy();
    expect(screen.getByLabelText("Unread")).toBeTruthy();
  });

  it("dims (no unread dot) once read", () => {
    render(<NotificationRow item={item({ read: true })} onOpen={() => {}} />);
    expect(screen.queryByLabelText("Unread")).toBeNull();
  });

  it("shows payload.message as the preview line when present", () => {
    render(
      <NotificationRow item={item({ kind: "deal_update", payload: { message: "Deal moved to Won" } })} onOpen={() => {}} />,
    );
    expect(screen.getByText("Deal moved to Won")).toBeTruthy();
  });

  it("renders no preview line when the payload carries no message (never invents one)", () => {
    const { container } = render(
      <NotificationRow
        item={item({ kind: "booking_confirmed", payload: { status: "confirmed" } })}
        onOpen={() => {}}
      />,
    );
    expect(container.querySelector(".rowPreview")).toBeNull();
  });

  it("falls back to a humanized label for an unmapped kind", () => {
    render(<NotificationRow item={item({ kind: "shoot_wrapped" })} onOpen={() => {}} />);
    expect(screen.getByText("Shoot Wrapped")).toBeTruthy();
  });

  it("calls onOpen with the item on click", () => {
    const onOpen = vi.fn();
    const n = item();
    render(<NotificationRow item={n} onOpen={onOpen} />);
    fireEvent.click(screen.getByTestId("notification-row"));
    expect(onOpen).toHaveBeenCalledWith(n);
  });

  it("disables the row while pending (marking-read in flight)", () => {
    render(<NotificationRow item={item()} pending onOpen={() => {}} />);
    expect((screen.getByTestId("notification-row") as HTMLButtonElement).disabled).toBe(true);
  });
});
