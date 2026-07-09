// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("./booking-wizard-workspace.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/error-state.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/status-chip.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

vi.mock("@copilotkit/react-core/v2", () => ({ useAgentContext: () => {} }));

const rpc = vi.fn();
vi.mock("@/lib/supabase/client", () => ({ createSupabaseBrowserClient: () => ({ rpc }) }));

import { BookingWizardWorkspace } from "./booking-wizard-workspace";
import type { TalentResult } from "@/lib/talent/types";

const TALENT: TalentResult = {
  id: "11111111-1111-4111-8111-111111111111",
  display_name: "Maria Rossi",
  bio: null,
  measurements: {},
  languages: ["en"],
  travel_ready: true,
  verification_status: "verified",
  ai_tags: {},
  is_agency_represented: false,
  rate_tier: "$$",
  is_available: true,
};

const ORG_ID = "22222222-2222-4222-8222-222222222222";

function fetchMock() {
  return vi.fn();
}

function draftFetch() {
  return fetchMock().mockResolvedValue({
    ok: true,
    json: async () => ({ suggestedRate: 1000, messageDraft: "Hi Maria Rossi, ..." }),
  });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  rpc.mockReset();
  rpc.mockResolvedValue({ data: { is_available: true }, error: null });
});

function clickNext() {
  fireEvent.click(screen.getByRole("button", { name: /Continue|Send booking request/ }));
}

async function goToDatesStep() {
  clickNext(); // talent & shoot -> dates
}

async function goToRateStep() {
  await goToDatesStep();
  fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2026-08-01" } });
  fireEvent.change(screen.getByLabelText("End date"), { target: { value: "2026-08-03" } });
  await waitFor(() => expect(rpc).toHaveBeenCalled());
  clickNext(); // dates -> rate
  await waitFor(() => expect(screen.getByRole("heading", { name: "Rate" })).toBeDefined());
}

async function approveRateAndGoToMessage(fetchFn: ReturnType<typeof fetchMock>) {
  await goToRateStep();
  await waitFor(() => expect(fetchFn).toHaveBeenCalledWith("/api/bookings/quote-draft", expect.anything()));
  await waitFor(() => expect(screen.getByText("Approve")).toBeDefined());
  fireEvent.click(screen.getByText("Approve"));
  clickNext(); // rate -> message
  await waitFor(() => expect(screen.getByLabelText("Message draft")).toBeDefined());
}

async function goToReviewStep(fetchFn: ReturnType<typeof fetchMock>) {
  await approveRateAndGoToMessage(fetchFn);
  clickNext(); // message -> review
  await waitFor(() => expect(screen.getByRole("heading", { name: "Review & send" })).toBeDefined());
}

describe("BookingWizardWorkspace", () => {
  it("shows an ErrorState instead of the wizard when the fetch failed", () => {
    render(<BookingWizardWorkspace talent={null} talentId={TALENT.id} orgId={null} fetchError="Unable to load." />);
    expect(screen.getByRole("alert")).toBeDefined();
    fireEvent.click(screen.getByText("Try again"));
    expect(refresh).toHaveBeenCalled();
  });

  it("renders the talent name in the topbar and starts on Talent & shoot with Standalone pre-selected", () => {
    render(<BookingWizardWorkspace talent={TALENT} talentId={TALENT.id} orgId={ORG_ID} fetchError={null} />);
    expect(screen.getAllByText("Maria Rossi").length).toBeGreaterThan(0);
    expect(screen.getByText(/Step 1 of 5/)).toBeDefined();
    const standalone = screen.getByText("Standalone booking").closest("button");
    expect(standalone?.getAttribute("data-selected")).toBe("true");
    const existing = screen.getByText("Link to an existing shoot").closest("button");
    expect(existing?.hasAttribute("disabled")).toBe(true);
  });

  it("disables Continue on the Dates step until a valid date range is set", async () => {
    render(<BookingWizardWorkspace talent={TALENT} talentId={TALENT.id} orgId={ORG_ID} fetchError={null} />);
    await goToDatesStep();
    const nextBtn = screen.getByRole("button", { name: "Continue" });
    expect(nextBtn.hasAttribute("disabled")).toBe(true);

    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2026-08-01" } });
    fireEvent.change(screen.getByLabelText("End date"), { target: { value: "2026-08-03" } });
    await waitFor(() => expect(nextBtn.hasAttribute("disabled")).toBe(false));
  });

  it("checks live availability via check_talent_availability once both dates are valid", async () => {
    render(<BookingWizardWorkspace talent={TALENT} talentId={TALENT.id} orgId={ORG_ID} fetchError={null} />);
    await goToDatesStep();
    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2026-08-01" } });
    fireEvent.change(screen.getByLabelText("End date"), { target: { value: "2026-08-03" } });
    await waitFor(() =>
      expect(rpc).toHaveBeenCalledWith("check_talent_availability", {
        p_talent_profile_id: TALENT.id,
        p_date_start: "2026-08-01",
        p_date_end: "2026-08-03",
      }),
    );
    expect(await screen.findByText(/available/)).toBeDefined();
  });

  it("does not retry forever when /api/bookings/quote-draft fails", async () => {
    const fetchFn = fetchMock().mockResolvedValue({
      ok: false,
      json: async () => ({ error: { message: "boom" } }),
    });
    vi.stubGlobal("fetch", fetchFn);
    render(<BookingWizardWorkspace talent={TALENT} talentId={TALENT.id} orgId={ORG_ID} fetchError={null} />);
    await goToDatesStep();
    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2026-08-01" } });
    fireEvent.change(screen.getByLabelText("End date"), { target: { value: "2026-08-03" } });
    await waitFor(() => expect(rpc).toHaveBeenCalled());
    clickNext(); // dates -> rate
    await waitFor(() => expect(screen.getByRole("alert")).toBeDefined());

    // Give any runaway retry loop a chance to fire before asserting it didn't.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("auto-drafts a rate on arriving at the Rate step, and gates Continue until Approved", async () => {
    const fetchFn = draftFetch();
    vi.stubGlobal("fetch", fetchFn);
    render(<BookingWizardWorkspace talent={TALENT} talentId={TALENT.id} orgId={ORG_ID} fetchError={null} />);
    await goToRateStep();

    expect(fetchFn).toHaveBeenCalledWith(
      "/api/bookings/quote-draft",
      expect.objectContaining({ method: "POST" }),
    );
    const [, options] = fetchFn.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body).toMatchObject({ displayName: "Maria Rossi", dateStart: "2026-08-01", dateEnd: "2026-08-03", rateTier: "$$" });

    await waitFor(() => expect(screen.getByText("$1,000")).toBeDefined());
    const nextBtn = screen.getByRole("button", { name: "Continue" });
    expect(nextBtn.hasAttribute("disabled")).toBe(true);

    fireEvent.click(screen.getByText("Approve"));
    expect(nextBtn.hasAttribute("disabled")).toBe(false);
    expect(screen.getByText("✓ Approved")).toBeDefined();
  });

  it("lets the operator edit the rate, which also counts as approval", async () => {
    const fetchFn = draftFetch();
    vi.stubGlobal("fetch", fetchFn);
    render(<BookingWizardWorkspace talent={TALENT} talentId={TALENT.id} orgId={ORG_ID} fetchError={null} />);
    await goToRateStep();
    await waitFor(() => expect(screen.getByText("Approve")).toBeDefined());

    fireEvent.click(screen.getByText("Edit"));
    fireEvent.change(screen.getByLabelText("Day rate override"), { target: { value: "1500" } });
    fireEvent.click(screen.getByText("Save"));

    expect(screen.getByText("✓ Approved")).toBeDefined();
    expect(screen.getByRole("button", { name: "Continue" }).hasAttribute("disabled")).toBe(false);
  });

  it("rejects an out-of-range rate override on Save instead of silently approving it", async () => {
    const fetchFn = draftFetch();
    vi.stubGlobal("fetch", fetchFn);
    render(<BookingWizardWorkspace talent={TALENT} talentId={TALENT.id} orgId={ORG_ID} fetchError={null} />);
    await goToRateStep();
    await waitFor(() => expect(screen.getByText("Approve")).toBeDefined());

    fireEvent.click(screen.getByText("Edit"));
    fireEvent.change(screen.getByLabelText("Day rate override"), { target: { value: "-5" } });
    fireEvent.click(screen.getByText("Save"));

    // Still in edit mode, not approved — Continue must stay gated.
    expect(screen.getByLabelText("Day rate override")).toBeDefined();
    expect(screen.queryByText("✓ Approved")).toBeNull();
    expect(screen.getByRole("button", { name: "Continue" }).hasAttribute("disabled")).toBe(true);
  });

  it("Cancel restores the rate to its pre-edit value instead of leaving the typed amount", async () => {
    const fetchFn = draftFetch();
    vi.stubGlobal("fetch", fetchFn);
    render(<BookingWizardWorkspace talent={TALENT} talentId={TALENT.id} orgId={ORG_ID} fetchError={null} />);
    await goToRateStep();
    await waitFor(() => expect(screen.getByText("$1,000")).toBeDefined());

    fireEvent.click(screen.getByText("Edit"));
    fireEvent.change(screen.getByLabelText("Day rate override"), { target: { value: "9999" } });
    fireEvent.click(screen.getByText("Cancel"));

    expect(screen.getByText("$1,000")).toBeDefined();
    expect(screen.queryByText("$9,999")).toBeNull();
  });

  it("pre-fills the Message step with the drafted message", async () => {
    const fetchFn = draftFetch();
    vi.stubGlobal("fetch", fetchFn);
    render(<BookingWizardWorkspace talent={TALENT} talentId={TALENT.id} orgId={ORG_ID} fetchError={null} />);
    await approveRateAndGoToMessage(fetchFn);
    expect((screen.getByLabelText("Message draft") as HTMLTextAreaElement).value).toBe("Hi Maria Rossi, ...");
  });

  it("never calls POST /api/bookings before the operator explicitly clicks Send", async () => {
    const fetchFn = fetchMock().mockImplementation((url: string) => {
      if (url === "/api/bookings/quote-draft") {
        return Promise.resolve({ ok: true, json: async () => ({ suggestedRate: 1000, messageDraft: "Draft text" }) });
      }
      throw new Error(`Unexpected fetch to ${url}`);
    });
    vi.stubGlobal("fetch", fetchFn);
    render(<BookingWizardWorkspace talent={TALENT} talentId={TALENT.id} orgId={ORG_ID} fetchError={null} />);
    await goToReviewStep(fetchFn);

    const bookingsCalls = fetchFn.mock.calls.filter(([url]: [string]) => url === "/api/bookings");
    expect(bookingsCalls).toHaveLength(0);
  });

  it("sends the booking via live POST /api/bookings only after Send, with the correct payload", async () => {
    const fetchFn = fetchMock().mockImplementation((url: string) => {
      if (url === "/api/bookings/quote-draft") {
        return Promise.resolve({ ok: true, json: async () => ({ suggestedRate: 1000, messageDraft: "Draft text" }) });
      }
      if (url === "/api/bookings") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            booking_id: "33333333-3333-4333-8333-333333333333",
            status: "requested",
            version: 1,
            expires_at: "2026-08-10T00:00:00.000Z",
          }),
        });
      }
      throw new Error(`Unexpected fetch to ${url}`);
    });
    vi.stubGlobal("fetch", fetchFn);
    render(<BookingWizardWorkspace talent={TALENT} talentId={TALENT.id} orgId={ORG_ID} fetchError={null} />);
    await goToReviewStep(fetchFn);

    fireEvent.click(screen.getByRole("button", { name: "Send booking request" }));
    await waitFor(() => expect(screen.getByText("Booking requested")).toBeDefined());

    const bookingsCall = fetchFn.mock.calls.find(([url]: [string]) => url === "/api/bookings");
    expect(bookingsCall).toBeDefined();
    const [, options] = bookingsCall!;
    const body = JSON.parse(options.body);
    expect(body).toMatchObject({
      brand_org_id: ORG_ID,
      talent_profile_id: TALENT.id,
      date_start: "2026-08-01",
      date_end: "2026-08-03",
      rate_quoted: 1000,
      message: "Draft text",
      shoot_id: null,
    });
    expect(screen.getByText("33333333-3333-4333-8333-333333333333")).toBeDefined();
  });

  it("ignores a second Send click while the first request is still in flight", async () => {
    let resolveBookingsPost: (value: unknown) => void = () => {};
    const bookingsPostPromise = new Promise((resolve) => {
      resolveBookingsPost = resolve;
    });
    const fetchFn = fetchMock().mockImplementation((url: string) => {
      if (url === "/api/bookings/quote-draft") {
        return Promise.resolve({ ok: true, json: async () => ({ suggestedRate: 1000, messageDraft: "Draft text" }) });
      }
      if (url === "/api/bookings") {
        return bookingsPostPromise;
      }
      throw new Error(`Unexpected fetch to ${url}`);
    });
    vi.stubGlobal("fetch", fetchFn);
    render(<BookingWizardWorkspace talent={TALENT} talentId={TALENT.id} orgId={ORG_ID} fetchError={null} />);
    await goToReviewStep(fetchFn);

    const sendBtn = screen.getByRole("button", { name: "Send booking request" });
    fireEvent.click(sendBtn);
    fireEvent.click(sendBtn); // double-click before the first response resolves
    fireEvent.click(sendBtn);

    const bookingsCallsSoFar = fetchFn.mock.calls.filter(([url]: [string]) => url === "/api/bookings");
    expect(bookingsCallsSoFar).toHaveLength(1);

    resolveBookingsPost({
      ok: true,
      json: async () => ({ booking_id: "44444444-4444-4444-8444-444444444444", status: "requested", version: 1, expires_at: null }),
    });
    await waitFor(() => expect(screen.getByText("Booking requested")).toBeDefined());
  });

  it("disables 'Don't send — cancel' while Send is in flight, so a real request can't be masked as cancelled", async () => {
    let resolveBookingsPost: (value: unknown) => void = () => {};
    const bookingsPostPromise = new Promise((resolve) => {
      resolveBookingsPost = resolve;
    });
    const fetchFn = fetchMock().mockImplementation((url: string) => {
      if (url === "/api/bookings/quote-draft") {
        return Promise.resolve({ ok: true, json: async () => ({ suggestedRate: 1000, messageDraft: "Draft text" }) });
      }
      if (url === "/api/bookings") {
        return bookingsPostPromise;
      }
      throw new Error(`Unexpected fetch to ${url}`);
    });
    vi.stubGlobal("fetch", fetchFn);
    render(<BookingWizardWorkspace talent={TALENT} talentId={TALENT.id} orgId={ORG_ID} fetchError={null} />);
    await goToReviewStep(fetchFn);

    fireEvent.click(screen.getByRole("button", { name: "Send booking request" }));
    const cancelBtn = screen.getByText("Don't send — cancel");
    expect(cancelBtn.hasAttribute("disabled")).toBe(true);

    fireEvent.click(cancelBtn);
    // Still mid-send — must not have jumped to the misleading "nothing was sent" screen.
    expect(screen.queryByText("Request not sent")).toBeNull();

    resolveBookingsPost({
      ok: true,
      json: async () => ({ booking_id: "55555555-5555-4555-8555-555555555555", status: "requested", version: 1, expires_at: null }),
    });
    await waitFor(() => expect(screen.getByText("Booking requested")).toBeDefined());
  });

  it("'Don't send — cancel' shows a clean cancelled state without ever calling POST /api/bookings", async () => {
    const fetchFn = draftFetch();
    vi.stubGlobal("fetch", fetchFn);
    render(<BookingWizardWorkspace talent={TALENT} talentId={TALENT.id} orgId={ORG_ID} fetchError={null} />);
    await goToReviewStep(fetchFn);

    fireEvent.click(screen.getByText("Don't send — cancel"));
    expect(screen.getByText("Request not sent")).toBeDefined();
    expect(fetchFn.mock.calls.some(([url]: [string]) => url === "/api/bookings")).toBe(false);
  });

  it("Start over clears prior dates, rate, and message instead of returning to step 0 pre-filled", async () => {
    const fetchFn = draftFetch();
    vi.stubGlobal("fetch", fetchFn);
    render(<BookingWizardWorkspace talent={TALENT} talentId={TALENT.id} orgId={ORG_ID} fetchError={null} />);
    await goToReviewStep(fetchFn);
    fireEvent.click(screen.getByText("Don't send — cancel"));
    fireEvent.click(screen.getByText("Start over"));

    expect(screen.getByText(/Step 1 of 5/)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Continue" })); // talent & shoot -> dates
    expect((screen.getByLabelText("Start date") as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText("End date") as HTMLInputElement).value).toBe("");

    // Continue must be gated again — a prior approved rate must not carry over.
    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2026-08-01" } });
    fireEvent.change(screen.getByLabelText("End date"), { target: { value: "2026-08-03" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" })); // dates -> rate
    await waitFor(() => expect(screen.getByText("AI draft")).toBeDefined());
    expect(screen.queryByText("✓ Approved")).toBeNull();
  });

  it("Back preserves rate approval and message edits when returning to Review", async () => {
    const fetchFn = draftFetch();
    vi.stubGlobal("fetch", fetchFn);
    render(<BookingWizardWorkspace talent={TALENT} talentId={TALENT.id} orgId={ORG_ID} fetchError={null} />);
    await goToReviewStep(fetchFn);

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText(/Step 4 of 5/)).toBeDefined();
    fireEvent.change(screen.getByLabelText("Message draft"), { target: { value: "Edited message" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByText("Edited message")).toBeDefined();
  });
});
