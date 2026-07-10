// @vitest-environment jsdom
import { describe, expect, it, afterEach, beforeEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";

vi.mock("./deal-stage-control.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("./status-chip.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/status-chip.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));

const toastError = vi.fn();
vi.mock("sonner", () => ({ toast: { error: (...args: unknown[]) => toastError(...args) } }));

import { DealStageControl } from "./deal-stage-control";

const DEAL_ID = "d1";

function mockFetchOk(stage: string) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ ok: true, dealId: DEAL_ID, stage }),
  });
}

function mockFetchError(message: string) {
  return vi.fn().mockResolvedValue({
    ok: false,
    json: async () => ({ error: { code: "VALIDATION_ERROR", message } }),
  });
}

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetchOk("negotiation"));
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("DealStageControl", () => {
  it("renders all 6 stages with the current one active", () => {
    render(<DealStageControl dealId={DEAL_ID} stage="proposal" onStageChange={vi.fn()} />);
    expect(screen.getByRole("group", { name: "Deal stage" })).toBeDefined();
    for (const label of ["Lead", "Qualified", "Proposal", "Negotiation", "Won", "Lost"]) {
      expect(screen.getByText(label)).toBeDefined();
    }
  });

  it("exposes the active stage to assistive tech via aria-pressed, not just styling", () => {
    render(<DealStageControl dealId={DEAL_ID} stage="proposal" onStageChange={vi.fn()} />);
    expect(screen.getByText("Proposal").closest("button")).toHaveProperty("ariaPressed", "true");
    expect(screen.getByText("Lead").closest("button")).toHaveProperty("ariaPressed", "false");
  });

  it("PATCHes /api/crm/deals/:id/stage for a non-terminal move and calls onStageChange with the server-returned stage", async () => {
    const fetchMock = mockFetchOk("negotiation");
    vi.stubGlobal("fetch", fetchMock);
    const onStageChange = vi.fn();
    render(<DealStageControl dealId={DEAL_ID} stage="lead" onStageChange={onStageChange} />);
    fireEvent.click(screen.getByText("Negotiation"));

    await waitFor(() => expect(onStageChange).toHaveBeenCalledWith("negotiation"));
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/crm/deals/${DEAL_ID}/stage`,
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ stage: "negotiation" }),
      }),
    );
    // No approval dialog for a non-terminal move.
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows an honest error and does NOT call onStageChange when the PATCH fails", async () => {
    vi.stubGlobal("fetch", mockFetchError("Could not update the stage."));
    const onStageChange = vi.fn();
    render(<DealStageControl dealId={DEAL_ID} stage="lead" onStageChange={onStageChange} />);
    fireEvent.click(screen.getByText("Negotiation"));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Could not update the stage."));
    expect(onStageChange).not.toHaveBeenCalled();
  });

  it("disables the stage row while a PATCH is in flight", async () => {
    let resolveFetch: (v: unknown) => void = () => {};
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(new Promise((resolve) => { resolveFetch = resolve; })),
    );
    render(<DealStageControl dealId={DEAL_ID} stage="lead" onStageChange={vi.fn()} />);
    fireEvent.click(screen.getByText("Negotiation"));

    await waitFor(() => expect(screen.getByText("Negotiation").closest("button")).toHaveProperty("disabled", true));

    resolveFetch({ ok: true, json: async () => ({ ok: true, dealId: DEAL_ID, stage: "negotiation" }) });
  });

  it("skips the PATCH entirely when clicking the already-active stage", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const onStageChange = vi.fn();
    render(<DealStageControl dealId={DEAL_ID} stage="proposal" onStageChange={onStageChange} />);
    fireEvent.click(screen.getByText("Proposal"));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(onStageChange).not.toHaveBeenCalled();
  });

  it("opens the approval gate for Won instead of writing immediately — never calls fetch for terminal stages", () => {
    const onStageChange = vi.fn();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<DealStageControl dealId={DEAL_ID} stage="negotiation" onStageChange={onStageChange} />);
    fireEvent.click(screen.getByText("Won"));
    expect(onStageChange).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: /Mark this deal as Won/ })).toBeDefined();
  });

  it("Cancel closes the Won approval gate with no write", () => {
    render(<DealStageControl dealId={DEAL_ID} stage="negotiation" onStageChange={vi.fn()} />);
    fireEvent.click(screen.getByText("Won"));
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByRole("dialog")).toBeNull();
    // Back to the stage row.
    expect(screen.getByRole("group", { name: "Deal stage" })).toBeDefined();
  });

  it("Approve on Won never optimistically succeeds — shows an honest error and reverts", () => {
    render(<DealStageControl dealId={DEAL_ID} stage="negotiation" onStageChange={vi.fn()} />);
    fireEvent.click(screen.getByText("Won"));
    fireEvent.click(screen.getByText(/Approve · Mark Won/));
    expect(toastError).toHaveBeenCalledWith(expect.stringContaining("pending IPI-367"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens the approval gate for Lost and Cancel reverts with no write", () => {
    render(<DealStageControl dealId={DEAL_ID} stage="negotiation" onStageChange={vi.fn()} />);
    fireEvent.click(screen.getByText("Lost"));
    expect(screen.getByRole("dialog", { name: /Mark this deal as Lost/ })).toBeDefined();
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("Approve on Lost also shows an honest error, never a fake success", () => {
    render(<DealStageControl dealId={DEAL_ID} stage="negotiation" onStageChange={vi.fn()} />);
    fireEvent.click(screen.getByText("Lost"));
    fireEvent.click(screen.getByText(/Approve · Mark Lost/));
    expect(toastError).toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("Escape closes the approval gate, same as Cancel", () => {
    render(<DealStageControl dealId={DEAL_ID} stage="negotiation" onStageChange={vi.fn()} />);
    fireEvent.click(screen.getByText("Won"));
    const dialog = screen.getByRole("dialog");
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders nothing (no row, no gate) once terminal and settled", () => {
    const { container } = render(<DealStageControl dealId={DEAL_ID} stage="won" onStageChange={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });
});
