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

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  rpc.mockReset();
  rpc.mockResolvedValue({ data: { is_available: true }, error: null });
});

async function goToDraftStep() {
  fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2026-08-01" } });
  fireEvent.change(screen.getByLabelText("End date"), { target: { value: "2026-08-03" } });
  await waitFor(() => expect(rpc).toHaveBeenCalled());
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
}

async function goToReviewStep(fetchImpl: ReturnType<typeof fetchMock>) {
  await goToDraftStep();
  fireEvent.click(screen.getByRole("button", { name: "Generate draft" }));
  await waitFor(() => expect(screen.getByLabelText("Message draft")).toBeDefined());
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
}

describe("BookingWizardWorkspace", () => {
  it("shows an ErrorState instead of the wizard when the fetch failed", () => {
    render(<BookingWizardWorkspace talent={null} talentId={TALENT.id} orgId={null} fetchError="Unable to load." />);
    expect(screen.getByRole("alert")).toBeDefined();
    fireEvent.click(screen.getByText("Try again"));
    expect(refresh).toHaveBeenCalled();
  });

  it("renders the talent name/rate tier and starts on the Dates & rate step", () => {
    render(<BookingWizardWorkspace talent={TALENT} talentId={TALENT.id} orgId={ORG_ID} fetchError={null} />);
    expect(screen.getByText("Maria Rossi")).toBeDefined();
    expect(screen.getByText("$$ rate tier")).toBeDefined();
    expect(screen.getByText(/Step 1 of 3/)).toBeDefined();
  });

  it("disables Continue on step 0 until a valid date range is set", () => {
    render(<BookingWizardWorkspace talent={TALENT} talentId={TALENT.id} orgId={ORG_ID} fetchError={null} />);
    const continueBtn = screen.getByRole("button", { name: "Continue" });
    expect(continueBtn.hasAttribute("disabled")).toBe(true);

    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2026-08-05" } });
    fireEvent.change(screen.getByLabelText("End date"), { target: { value: "2026-08-01" } });
    expect(continueBtn.hasAttribute("disabled")).toBe(true);
  });

  it("checks live availability via check_talent_availability once both dates are valid", async () => {
    render(<BookingWizardWorkspace talent={TALENT} talentId={TALENT.id} orgId={ORG_ID} fetchError={null} />);
    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2026-08-01" } });
    fireEvent.change(screen.getByLabelText("End date"), { target: { value: "2026-08-03" } });
    await waitFor(() =>
      expect(rpc).toHaveBeenCalledWith("check_talent_availability", {
        p_talent_profile_id: TALENT.id,
        p_date_start: "2026-08-01",
        p_date_end: "2026-08-03",
      }),
    );
    expect(await screen.findByText("✓ Available")).toBeDefined();
  });

  it("generates an AI draft via /api/bookings/quote-draft and pre-fills the message", async () => {
    const fetchFn = fetchMock().mockResolvedValue({
      ok: true,
      json: async () => ({ suggestedRate: 1000, messageDraft: "Hi Maria Rossi, ..." }),
    });
    vi.stubGlobal("fetch", fetchFn);

    render(<BookingWizardWorkspace talent={TALENT} talentId={TALENT.id} orgId={ORG_ID} fetchError={null} />);
    await goToDraftStep();

    fireEvent.click(screen.getByRole("button", { name: "Generate draft" }));
    await waitFor(() => expect(screen.getByLabelText("Message draft")).toBeDefined());

    expect(fetchFn).toHaveBeenCalledWith(
      "/api/bookings/quote-draft",
      expect.objectContaining({ method: "POST" }),
    );
    const [, options] = fetchFn.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body).toMatchObject({
      displayName: "Maria Rossi",
      dateStart: "2026-08-01",
      dateEnd: "2026-08-03",
      rateTier: "$$",
    });
    expect(screen.getByText("Suggested rate: $1,000")).toBeDefined();
  });

  it("never calls POST /api/bookings before the operator explicitly clicks Send request", async () => {
    const fetchFn = fetchMock().mockImplementation((url: string) => {
      if (url === "/api/bookings/quote-draft") {
        return Promise.resolve({ ok: true, json: async () => ({ suggestedRate: 1000, messageDraft: "Draft text" }) });
      }
      throw new Error(`Unexpected fetch to ${url}`);
    });
    vi.stubGlobal("fetch", fetchFn);

    render(<BookingWizardWorkspace talent={TALENT} talentId={TALENT.id} orgId={ORG_ID} fetchError={null} />);
    await goToReviewStep(fetchFn);

    // Reached the review step — confirm no write RPC/API has fired yet.
    expect(screen.getByRole("heading", { name: "Review & send" })).toBeDefined();
    const bookingsCalls = fetchFn.mock.calls.filter(([url]: [string]) => url === "/api/bookings");
    expect(bookingsCalls).toHaveLength(0);
  });

  it("creates the booking via live POST /api/bookings only after Send request, and shows the requested confirmation", async () => {
    const fetchFn = fetchMock().mockImplementation((url: string) => {
      if (url === "/api/bookings/quote-draft") {
        return Promise.resolve({ ok: true, json: async () => ({ suggestedRate: 1000, messageDraft: "Draft text" }) });
      }
      if (url === "/api/bookings") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ booking_id: "33333333-3333-4333-8333-333333333333", status: "requested", version: 1, expires_at: "2026-08-10T00:00:00.000Z" }),
        });
      }
      throw new Error(`Unexpected fetch to ${url}`);
    });
    vi.stubGlobal("fetch", fetchFn);

    render(<BookingWizardWorkspace talent={TALENT} talentId={TALENT.id} orgId={ORG_ID} fetchError={null} />);
    await goToReviewStep(fetchFn);

    fireEvent.click(screen.getByRole("button", { name: "✓ Send request" }));
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

  it("Reject shows a clean cancelled state without ever calling POST /api/bookings", async () => {
    const fetchFn = fetchMock().mockImplementation((url: string) => {
      if (url === "/api/bookings/quote-draft") {
        return Promise.resolve({ ok: true, json: async () => ({ suggestedRate: 1000, messageDraft: "Draft text" }) });
      }
      throw new Error(`Unexpected fetch to ${url}`);
    });
    vi.stubGlobal("fetch", fetchFn);

    render(<BookingWizardWorkspace talent={TALENT} talentId={TALENT.id} orgId={ORG_ID} fetchError={null} />);
    await goToReviewStep(fetchFn);

    fireEvent.click(screen.getByRole("button", { name: "Reject" }));
    expect(screen.getByText("Request not sent")).toBeDefined();
    expect(fetchFn.mock.calls.some(([url]: [string]) => url === "/api/bookings")).toBe(false);
  });

  it("Edit from the review step returns to Dates & rate with the draft preserved", async () => {
    const fetchFn = fetchMock().mockResolvedValue({
      ok: true,
      json: async () => ({ suggestedRate: 1000, messageDraft: "Draft text" }),
    });
    vi.stubGlobal("fetch", fetchFn);

    render(<BookingWizardWorkspace talent={TALENT} talentId={TALENT.id} orgId={ORG_ID} fetchError={null} />);
    await goToReviewStep(fetchFn);

    fireEvent.click(screen.getByRole("button", { name: "← Edit" }));
    expect(screen.getByText(/Step 1 of 3/)).toBeDefined();

    // Draft state survives the round trip back through step 1.
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText(/Step 2 of 3/)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Draft text")).toBeDefined();
  });
});
