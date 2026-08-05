import { afterEach, describe, expect, it, vi } from "vitest";

import {
  UPLOAD_POLL_MAX_MS,
  fetchMirrorStatus,
  pollUntilMirrorTerminal,
  uploadPollDelayMs,
  type MirrorPollResponse,
} from "./upload-poll";

const ASSET_ID = "cloudinary-asset-1";

function mirror(overrides: Partial<MirrorPollResponse> = {}): MirrorPollResponse {
  return {
    status: "processing",
    cloudinary_asset_id: ASSET_ID,
    version: null,
    public_id: null,
    ...overrides,
  };
}

function jsonResponse(body: MirrorPollResponse) {
  return { ok: true, status: 200, json: async () => body } as unknown as Response;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("uploadPollDelayMs", () => {
  it("uses 1s delay for the first 10 seconds", () => {
    expect(uploadPollDelayMs(0)).toBe(1000);
    expect(uploadPollDelayMs(9_999)).toBe(1000);
  });

  it("uses 2s delay between 10s and 30s", () => {
    expect(uploadPollDelayMs(10_000)).toBe(2000);
    expect(uploadPollDelayMs(29_999)).toBe(2000);
  });

  it("uses 5s delay after 30s", () => {
    expect(uploadPollDelayMs(30_000)).toBe(5000);
    expect(uploadPollDelayMs(59_000)).toBe(5000);
  });

  it("polls within a one minute window outside e2e runs", () => {
    expect(UPLOAD_POLL_MAX_MS).toBe(60_000);
  });
});

describe("fetchMirrorStatus", () => {
  it("requests the status route with the asset id and credentials", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(mirror({ status: "ready", version: 3 })));

    const result = await fetchMirrorStatus(ASSET_ID);

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/assets/status?cloudinaryAssetId=${ASSET_ID}`,
      expect.objectContaining({ credentials: "include" }),
    );
    expect(result).toEqual(mirror({ status: "ready", version: 3 }));
  });

  it("maps a 404 to a synthetic not_found response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as unknown as Response);

    await expect(fetchMirrorStatus(ASSET_ID)).resolves.toEqual({
      status: "not_found",
      cloudinary_asset_id: ASSET_ID,
      version: null,
      public_id: null,
    });
  });

  it("throws on any other non-ok response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as unknown as Response);

    await expect(fetchMirrorStatus(ASSET_ID)).rejects.toThrow("status poll failed: HTTP 500");
  });
});

describe("pollUntilMirrorTerminal", () => {
  it("returns aborted when fetch is rejected with AbortError", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new DOMException("Aborted", "AbortError"),
    );
    const controller = new AbortController();

    const result = await pollUntilMirrorTerminal("abcdef0123456789abcdef0123456789", controller.signal);

    expect(result.outcome).toBe("aborted");
    fetchMock.mockRestore();
  });

  it("resolves ready and reports every tick", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(mirror({ status: "processing" })))
      .mockResolvedValueOnce(jsonResponse(mirror({ status: "ready", version: 9 })));
    const onTick = vi.fn();

    vi.useFakeTimers();
    const pending = pollUntilMirrorTerminal(ASSET_ID, new AbortController().signal, onTick);
    await vi.runAllTimersAsync();

    await expect(pending).resolves.toEqual({
      outcome: "ready",
      response: mirror({ status: "ready", version: 9 }),
    });
    expect(onTick).toHaveBeenCalledTimes(2);
    expect(onTick).toHaveBeenLastCalledWith(mirror({ status: "ready", version: 9 }));
  });

  it.each(["failed", "archived"] as const)("treats %s as a failed outcome", async (status) => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(jsonResponse(mirror({ status })));

    await expect(pollUntilMirrorTerminal(ASSET_ID, new AbortController().signal)).resolves.toEqual({
      outcome: "failed",
      response: mirror({ status }),
    });
  });

  it("returns aborted without polling when the signal is already aborted", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");

    await expect(pollUntilMirrorTerminal(ASSET_ID, AbortSignal.abort())).resolves.toEqual({
      outcome: "aborted",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns aborted when the signal fires while waiting between polls", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(mirror()));
    const controller = new AbortController();

    vi.useFakeTimers();
    const pending = pollUntilMirrorTerminal(ASSET_ID, controller.signal);
    await vi.advanceTimersByTimeAsync(1);
    controller.abort();
    await vi.advanceTimersByTimeAsync(2_000);

    await expect(pending).resolves.toEqual({ outcome: "aborted" });
  });

  it("propagates non-abort fetch failures", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("network down"));

    await expect(
      pollUntilMirrorTerminal(ASSET_ID, new AbortController().signal),
    ).rejects.toThrow("network down");
  });

  it("times out with the last response once the window elapses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(mirror()));

    vi.useFakeTimers();
    const pending = pollUntilMirrorTerminal(ASSET_ID, new AbortController().signal);
    await vi.advanceTimersByTimeAsync(UPLOAD_POLL_MAX_MS + 5_000);

    await expect(pending).resolves.toEqual({ outcome: "timed_out", last: mirror() });
  });
});
