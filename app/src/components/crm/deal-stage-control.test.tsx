// @vitest-environment jsdom
import { describe, expect, it, afterEach, beforeEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";

vi.mock("./deal-stage-control.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("./status-chip.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/status-chip.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));

const toastError = vi.fn();
vi.mock("sonner", () => ({ toast: { error: (...args: unknown[]) => toastError(...args) } }));

const routerRefresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: routerRefresh }) }));

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

  it("Approve on Won POSTs /convert and calls onStageChange + router.refresh on a server-confirmed success", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, dealId: DEAL_ID, stage: "won", brandId: "brand-1" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const onStageChange = vi.fn();
    render(<DealStageControl dealId={DEAL_ID} stage="negotiation" onStageChange={onStageChange} />);
    fireEvent.click(screen.getByText("Won"));
    fireEvent.click(screen.getByText(/Approve · Mark Won/));

    await waitFor(() => expect(onStageChange).toHaveBeenCalledWith("won"));
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/crm/deals/${DEAL_ID}/convert`,
      expect.objectContaining({ method: "POST", body: JSON.stringify({ decision: "won" }) }),
    );
    expect(routerRefresh).toHaveBeenCalled();
    expect(toastError).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("Approve on Won never optimistically succeeds — a failed convert shows an honest error and reverts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: { code: "INTERNAL_ERROR", message: "Failed to convert the deal." } }),
      }),
    );
    const onStageChange = vi.fn();
    render(<DealStageControl dealId={DEAL_ID} stage="negotiation" onStageChange={onStageChange} />);
    fireEvent.click(screen.getByText("Won"));
    fireEvent.click(screen.getByText(/Approve · Mark Won/));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Failed to convert the deal."));
    expect(onStageChange).not.toHaveBeenCalled();
    expect(routerRefresh).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("disables Cancel and Approve while the convert POST is in flight", async () => {
    let resolveFetch: (v: unknown) => void = () => {};
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(new Promise((resolve) => { resolveFetch = resolve; })),
    );
    render(<DealStageControl dealId={DEAL_ID} stage="negotiation" onStageChange={vi.fn()} />);
    fireEvent.click(screen.getByText("Won"));
    fireEvent.click(screen.getByText(/Approve · Mark Won/));

    await waitFor(() => expect(screen.getByText("Cancel")).toHaveProperty("disabled", true));
    expect(screen.getByText("Approving…")).toBeDefined();

    resolveFetch({ ok: true, json: async () => ({ ok: true, dealId: DEAL_ID, stage: "won", brandId: "b1" }) });
  });

  it("opens the approval gate for Lost and Cancel reverts with no write", () => {
    render(<DealStageControl dealId={DEAL_ID} stage="negotiation" onStageChange={vi.fn()} />);
    fireEvent.click(screen.getByText("Lost"));
    expect(screen.getByRole("dialog", { name: /Mark this deal as Lost/ })).toBeDefined();
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("Approve on Lost calls onStageChange('lost') and never touches a brand on success", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, dealId: DEAL_ID, stage: "lost", brandId: null }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const onStageChange = vi.fn();
    render(<DealStageControl dealId={DEAL_ID} stage="negotiation" onStageChange={onStageChange} />);
    fireEvent.click(screen.getByText("Lost"));
    fireEvent.click(screen.getByText(/Approve · Mark Lost/));

    await waitFor(() => expect(onStageChange).toHaveBeenCalledWith("lost"));
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/crm/deals/${DEAL_ID}/convert`,
      expect.objectContaining({ body: JSON.stringify({ decision: "lost" }) }),
    );
  });

  it("Approve on Lost also shows an honest error on failure, never a fake success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: { code: "INVALID_TRANSITION", message: "Already terminal." } }),
      }),
    );
    const onStageChange = vi.fn();
    render(<DealStageControl dealId={DEAL_ID} stage="negotiation" onStageChange={onStageChange} />);
    fireEvent.click(screen.getByText("Lost"));
    fireEvent.click(screen.getByText(/Approve · Mark Lost/));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Already terminal."));
    expect(onStageChange).not.toHaveBeenCalled();
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
