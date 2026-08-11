// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { RestartAnalysisButton } from "./restart-analysis-button";

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

const BRAND_ID = "11111111-2222-3333-4444-555555555555";
const ENDPOINT = `/api/brands/${BRAND_ID}/restart-analysis`;

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const clickRestart = () =>
  fireEvent.click(screen.getByRole("button", { name: /Restart analysis/i }));

describe("RestartAnalysisButton", () => {
  it("POSTs once to the restart route with same-origin credentials", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, { ok: true, mode: "crawl_restarted", intakeStatus: "crawl_running" }),
    );

    render(<RestartAnalysisButton brandId={BRAND_ID} />);
    clickRestart();

    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(ENDPOINT);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "POST",
      credentials: "same-origin",
    });
  });

  it("disables the button while the restart is pending", async () => {
    let release: (r: Response) => void = () => {};
    fetchMock.mockReturnValue(
      new Promise<Response>((resolve) => {
        release = resolve;
      }),
    );

    render(<RestartAnalysisButton brandId={BRAND_ID} />);
    clickRestart();

    const button = await screen.findByRole("button", { name: /Restarting/i });
    expect((button as HTMLButtonElement).disabled).toBe(true);

    release(jsonResponse(200, { ok: true }));
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it("sends only one request when clicked twice in a row", async () => {
    fetchMock.mockReturnValue(new Promise<Response>(() => {}));

    render(<RestartAnalysisButton brandId={BRAND_ID} />);
    clickRestart();
    fireEvent.click(screen.getByRole("button", { name: /Restarting/i }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shows operator copy for already_running (409) without refreshing", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(409, {
        ok: false,
        code: "already_running",
        message: "Analysis is already in progress.",
      }),
    );

    render(<RestartAnalysisButton brandId={BRAND_ID} />);
    clickRestart();

    expect(await screen.findByText(/Analysis is already running/i)).toBeTruthy();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("shows access copy for unauthorized (403)", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(403, { ok: false, code: "unauthorized", message: "Unauthorized" }),
    );

    render(<RestartAnalysisButton brandId={BRAND_ID} />);
    clickRestart();

    expect(
      await screen.findByText(/need owner or editor access to restart/i),
    ).toBeTruthy();
  });

  it("shows retry copy for provider_unavailable (503)", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(503, { ok: false, code: "provider_unavailable", message: "x" }),
    );

    render(<RestartAnalysisButton brandId={BRAND_ID} />);
    clickRestart();

    expect(await screen.findByText(/Try again in a minute/i)).toBeTruthy();
  });

  it("never renders a raw provider error body — unknown shapes get generic copy", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(500, {
        error: 'Firecrawl 402: {"details":"insufficient credits for team abc"}',
      }),
    );

    render(<RestartAnalysisButton brandId={BRAND_ID} />);
    clickRestart();

    expect(await screen.findByText(/Try again in a minute/i)).toBeTruthy();
    expect(screen.queryByText(/Firecrawl/i)).toBeNull();
  });

  it("never renders an inherited Object.prototype member as error copy", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(500, { ok: false, code: "constructor" }),
    );

    render(<RestartAnalysisButton brandId={BRAND_ID} />);
    clickRestart();

    expect(await screen.findByText(/Try again in a minute/i)).toBeTruthy();
  });

  it("re-enables the button after a successful restart (onRestart reset)", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, { ok: true, mode: "crawl_restarted", intakeStatus: "crawl_running" }),
    );

    render(<RestartAnalysisButton brandId={BRAND_ID} />);
    clickRestart();

    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Restart analysis/i })).toBeTruthy(),
    );
    expect((screen.getByRole("button", { name: /Restart analysis/i }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("calls onRestart after a successful restart (for client-only callers)", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, { ok: true, mode: "bi_restarted", intakeStatus: "analysis_running" }),
    );

    const onRestart = vi.fn();
    render(<RestartAnalysisButton brandId={BRAND_ID} onRestart={onRestart} />);
    clickRestart();

    await waitFor(() => expect(onRestart).toHaveBeenCalledTimes(1));
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Restart analysis/i })).toBeTruthy(),
    );
  });

  it("allows a second retry after a missed Realtime event (button stays clickable)", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, { ok: true, mode: "bi_restarted", intakeStatus: "analysis_running" }),
    );

    render(<RestartAnalysisButton brandId={BRAND_ID} onRestart={vi.fn()} />);
    clickRestart();

    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1));

    const button = await screen.findByRole("button", { name: /Restart analysis/i });
    expect((button as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(button);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not call onRestart when restart fails (409 already_running)", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(409, { ok: false, code: "already_running", message: "in progress" }),
    );

    const onRestart = vi.fn();
    render(<RestartAnalysisButton brandId={BRAND_ID} onRestart={onRestart} />);
    clickRestart();

    expect(await screen.findByText(/Analysis is already running/i)).toBeTruthy();
    expect(onRestart).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Restart analysis/i })).toBeTruthy();
  });

  it("renders error text with role=alert when errorRole is set", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(503, { ok: false, code: "provider_unavailable", message: "x" }),
    );

    render(<RestartAnalysisButton brandId={BRAND_ID} errorRole="alert" />);
    clickRestart();

    const errorEl = await screen.findByText(/Try again in a minute/i);
    expect(errorEl.getAttribute("role")).toBe("alert");
    expect(errorEl.getAttribute("aria-live")).toBe("assertive");
  });

  it("renders error text without live-region semantics when errorRole is omitted (Brand Hub default)", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(503, { ok: false, code: "provider_unavailable", message: "x" }),
    );

    render(<RestartAnalysisButton brandId={BRAND_ID} />);
    clickRestart();

    const errorEl = await screen.findByText(/Try again in a minute/i);
    expect(errorEl.getAttribute("role")).toBeNull();
  });

  it("recovers to an enabled button after a network failure", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));

    render(<RestartAnalysisButton brandId={BRAND_ID} />);
    clickRestart();

    expect(await screen.findByText(/Try again in a minute/i)).toBeTruthy();
    const button = screen.getByRole("button", { name: /Restart analysis/i });
    expect((button as HTMLButtonElement).disabled).toBe(false);
    expect(screen.queryByText(/network down/i)).toBeNull();
  });
});
