// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("./booking-detail-workspace.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/empty-state.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/error-state.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/status-chip.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

vi.mock("@copilotkit/react-core/v2", () => ({ useAgentContext: () => {} }));

const rpc = vi.fn();
vi.mock("@/lib/supabase/client", () => ({ createSupabaseBrowserClient: () => ({ rpc }) }));

import { BookingDetailWorkspace } from "./booking-detail-workspace";

const BOOKING_ID = "11111111-1111-4111-8111-111111111111";
const TALENT_ID = "22222222-2222-4222-8222-222222222222";

function booking(overrides: Record<string, unknown> = {}) {
  return {
    id: BOOKING_ID,
    status: "requested",
    version: 1,
    date_start: "2026-09-10",
    date_end: "2026-09-12",
    rate_quoted: 1200,
    message: "Hi there!",
    talent_profile_id: TALENT_ID,
    expires_at: "2026-09-13T00:00:00.000Z",
    cancellation_reason: null,
    ...overrides,
  };
}

const TALENT = {
  id: TALENT_ID,
  display_name: "Aria Chen",
  verification_status: "verified",
  is_agency_represented: true,
  travel_ready: true,
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  rpc.mockReset();
  rpc.mockResolvedValue({ data: { is_available: true }, error: null });
  refresh.mockReset();
});

describe("BookingDetailWorkspace", () => {
  it("shows an ErrorState with a retry when the fetch failed", () => {
    render(
      <BookingDetailWorkspace
        bookingId={BOOKING_ID}
        booking={null}
        talent={null}
        history={[]}
        viewerRole={null}
        fetchError="Unable to load this booking. Try again in a moment."
      />,
    );
    expect(screen.getByTestId("error-state")).toBeDefined();
    fireEvent.click(screen.getByText("Try again"));
    expect(refresh).toHaveBeenCalled();
  });

  it("renders the hero and status stepper for a requested booking", () => {
    render(
      <BookingDetailWorkspace
        bookingId={BOOKING_ID}
        booking={booking()}
        talent={TALENT}
        history={[]}
        viewerRole="brand"
        fetchError={null}
      />,
    );
    expect(screen.getByRole("heading", { name: "Aria Chen" })).toBeDefined();
    expect(screen.getAllByText("Requested").length).toBeGreaterThanOrEqual(2); // status chip + stepper label
    expect(screen.getByText("Booking status")).toBeDefined();
  });

  it("shows Approve/Decline/Cancel for a brand viewer on a requested booking", () => {
    render(
      <BookingDetailWorkspace
        bookingId={BOOKING_ID}
        booking={booking()}
        talent={TALENT}
        history={[]}
        viewerRole="brand"
        fetchError={null}
      />,
    );
    expect(screen.getByText("Approve")).toBeDefined();
    expect(screen.getByText("Decline")).toBeDefined();
    expect(screen.getByText("Cancel booking")).toBeDefined();
  });

  it("shows no actions and the cancellation reason for a cancelled booking", () => {
    render(
      <BookingDetailWorkspace
        bookingId={BOOKING_ID}
        booking={booking({ status: "cancelled", cancellation_reason: "Talent unavailable" })}
        talent={TALENT}
        history={[]}
        viewerRole="brand"
        fetchError={null}
      />,
    );
    expect(screen.queryByText("Approve")).toBeNull();
    expect(screen.getByText(/This booking is cancelled: Talent unavailable/)).toBeDefined();
  });

  it("approves via PATCH with expected_version and refreshes on success", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <BookingDetailWorkspace
        bookingId={BOOKING_ID}
        booking={booking()}
        talent={TALENT}
        history={[]}
        viewerRole="brand"
        fetchError={null}
      />,
    );

    fireEvent.click(screen.getByText("Approve"));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/bookings/${BOOKING_ID}`,
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ expected_version: 1, to_status: "approved" }),
        }),
      ),
    );
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("confirms via POST /approve for an approved brand-viewed booking", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <BookingDetailWorkspace
        bookingId={BOOKING_ID}
        booking={booking({ status: "approved" })}
        talent={TALENT}
        history={[]}
        viewerRole="brand"
        fetchError={null}
      />,
    );

    fireEvent.click(screen.getByText("Confirm booking"));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(`/api/bookings/${BOOKING_ID}/approve`, expect.objectContaining({ method: "POST" })),
    );
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("shows a friendly error and re-enables the button when fetch itself rejects (network failure)", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <BookingDetailWorkspace
        bookingId={BOOKING_ID}
        booking={booking()}
        talent={TALENT}
        history={[]}
        viewerRole="brand"
        fetchError={null}
      />,
    );

    const approveBtn = screen.getByText("Approve");
    fireEvent.click(approveBtn);

    await waitFor(() => expect(screen.getByText(/Couldn't reach the server/)).toBeDefined());
    expect(approveBtn).toHaveProperty("disabled", false);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("clears a stale error from a previous action when opening the cancel dialog", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <BookingDetailWorkspace
        bookingId={BOOKING_ID}
        booking={booking()}
        talent={TALENT}
        history={[]}
        viewerRole="brand"
        fetchError={null}
      />,
    );

    fireEvent.click(screen.getByText("Approve"));
    await waitFor(() => expect(screen.getByText(/Couldn't reach the server/)).toBeDefined());

    fireEvent.click(screen.getByText("Cancel booking"));
    expect(screen.queryByText(/Couldn't reach the server/)).toBeNull();
  });

  it("requires a reason before submitting a cancellation, then PATCHes it", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <BookingDetailWorkspace
        bookingId={BOOKING_ID}
        booking={booking()}
        talent={TALENT}
        history={[]}
        viewerRole="brand"
        fetchError={null}
      />,
    );

    fireEvent.click(screen.getByText("Cancel booking"));
    const confirmBtn = screen.getByText("Confirm cancellation");
    expect(confirmBtn).toHaveProperty("disabled", true);

    fireEvent.change(screen.getByLabelText("Cancellation reason"), { target: { value: "Client changed plans" } });
    expect(confirmBtn).toHaveProperty("disabled", false);
    fireEvent.click(confirmBtn);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/bookings/${BOOKING_ID}`,
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            expected_version: 1,
            to_status: "cancelled",
            cancellation_reason: "Client changed plans",
          }),
        }),
      ),
    );
  });

  it("surfaces a STALE_BOOKING error message without crashing", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: { code: "STALE_BOOKING", message: "This booking was updated elsewhere. Refresh and try again." } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <BookingDetailWorkspace
        bookingId={BOOKING_ID}
        booking={booking()}
        talent={TALENT}
        history={[]}
        viewerRole="brand"
        fetchError={null}
      />,
    );

    fireEvent.click(screen.getByText("Approve"));
    await waitFor(() => expect(screen.getByText(/updated elsewhere/)).toBeDefined());
  });

  it("switches tabs to show talent info, availability, and activity", async () => {
    render(
      <BookingDetailWorkspace
        bookingId={BOOKING_ID}
        booking={booking()}
        talent={TALENT}
        history={[
          { id: "1", event_type: "status_change", to_status: "requested", created_at: "2026-07-08T10:00:00.000Z" },
        ]}
        viewerRole="brand"
        fetchError={null}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Talent" }));
    expect(screen.getByText("View full profile")).toBeDefined();

    fireEvent.click(screen.getByRole("tab", { name: "Availability" }));
    await waitFor(() => expect(rpc).toHaveBeenCalledWith("check_talent_availability", expect.anything()));

    fireEvent.click(screen.getByRole("tab", { name: "Activity" }));
    expect(screen.getByText(/Status changed: Requested → Requested|Status set to Requested/)).toBeDefined();
  });

  it("shows an EmptyState on the Activity tab when there is no history", () => {
    render(
      <BookingDetailWorkspace
        bookingId={BOOKING_ID}
        booking={booking()}
        talent={TALENT}
        history={[]}
        viewerRole="brand"
        fetchError={null}
      />,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Activity" }));
    expect(screen.getByTestId("empty-state")).toBeDefined();
  });
});
