// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import {
  phaseForStatus,
  useBrandAnalysisProgress,
} from "./use-brand-analysis-progress";

type RealtimeCallback = (payload: { new: Record<string, unknown> | null }) => void;
type StatusCallback = (status: string) => void;

const capturedCallbacks: RealtimeCallback[] = [];
let statusCallback: StatusCallback | null = null;

const mockRemoveChannel = vi.fn();
const mockSubscribe = vi.fn((cb?: StatusCallback) => {
  statusCallback = cb ?? null;
  return { unsubscribe: vi.fn() };
});
const mockChannel = {
  on: (_event: string, _filter: unknown, cb: RealtimeCallback) => {
    capturedCallbacks.push(cb);
    return mockChannel;
  },
  subscribe: mockSubscribe,
};
const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({
    channel: () => mockChannel,
    removeChannel: mockRemoveChannel,
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: mockMaybeSingle }),
      }),
    }),
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  capturedCallbacks.length = 0;
  statusCallback = null;
});

afterEach(() => {
  cleanup();
});

describe("phaseForStatus", () => {
  it("server failed wins over connection_lost", () => {
    expect(phaseForStatus("failed", true, true)).toBe("failed");
  });

  it("ready wins over still_working", () => {
    expect(phaseForStatus("ready", false, true)).toBe("ready");
  });

  it("draft_ready is idle", () => {
    expect(phaseForStatus("draft_ready", false, false)).toBe("idle");
  });

  it("connection_lost before still_working", () => {
    expect(phaseForStatus("analysis_running", true, true)).toBe("connection_lost");
  });

  it("still_working when quiet and connected", () => {
    expect(phaseForStatus("crawl_running", false, true)).toBe("still_working");
  });

  it("live when in flight and healthy", () => {
    expect(phaseForStatus("analysis_running", false, false)).toBe("live");
  });
});

describe("useBrandAnalysisProgress", () => {
  const brandId = "brand-1";
  // Disable quiet-gap timers so the vitest worker can exit.
  const noQuiet = { quietGapMs: 0 } as const;

  it("starts live for an in-flight status", () => {
    const { result, unmount } = renderHook(() =>
      useBrandAnalysisProgress({ brandId, initialStatus: "crawl_running", ...noQuiet }),
    );
    expect(result.current.phase).toBe("live");
    expect(result.current.intakeStatus).toBe("crawl_running");
    unmount();
  });

  it("maps server failed to failed phase", () => {
    const { result, unmount } = renderHook(() =>
      useBrandAnalysisProgress({ brandId, initialStatus: "failed", ...noQuiet }),
    );
    expect(result.current.phase).toBe("failed");
    unmount();
  });

  it("CHANNEL_ERROR → connection_lost (not failed)", () => {
    const { result, unmount } = renderHook(() =>
      useBrandAnalysisProgress({ brandId, initialStatus: "analysis_running", ...noQuiet }),
    );
    act(() => {
      statusCallback?.("CHANNEL_ERROR");
    });
    expect(result.current.phase).toBe("connection_lost");
    expect(result.current.intakeStatus).toBe("analysis_running");
    unmount();
  });

  it("TIMED_OUT → connection_lost (not failed)", () => {
    const { result, unmount } = renderHook(() =>
      useBrandAnalysisProgress({ brandId, initialStatus: "crawl_running", ...noQuiet }),
    );
    act(() => {
      statusCallback?.("TIMED_OUT");
    });
    expect(result.current.phase).toBe("connection_lost");
    unmount();
  });

  it("CLOSED → connection_lost (not failed)", () => {
    const { result, unmount } = renderHook(() =>
      useBrandAnalysisProgress({ brandId, initialStatus: "crawl_running", ...noQuiet }),
    );
    act(() => {
      statusCallback?.("CLOSED");
    });
    expect(result.current.phase).toBe("connection_lost");
    unmount();
  });

  it("SUBSCRIBED re-reads intake and fires onReady for ready", async () => {
    const onReady = vi.fn();
    mockMaybeSingle.mockResolvedValueOnce({
      data: { intake_status: "ready" },
      error: null,
    });
    const { result, unmount } = renderHook(() =>
      useBrandAnalysisProgress({
        brandId,
        initialStatus: "analysis_running",
        onReady,
        ...noQuiet,
      }),
    );
    await act(async () => {
      statusCallback?.("SUBSCRIBED");
      await Promise.resolve();
    });
    expect(result.current.intakeStatus).toBe("ready");
    expect(result.current.phase).toBe("ready");
    expect(onReady).toHaveBeenCalledTimes(1);
    unmount();
  });

  it("onReady fires for ready only — not scores_complete", () => {
    const onReady = vi.fn();
    const { result, unmount } = renderHook(() =>
      useBrandAnalysisProgress({
        brandId,
        initialStatus: "analysis_running",
        onReady,
        ...noQuiet,
      }),
    );
    act(() => {
      capturedCallbacks[0]?.({ new: { intake_status: "scores_complete" } });
    });
    expect(onReady).not.toHaveBeenCalled();
    expect(result.current.intakeStatus).toBe("scores_complete");
    expect(result.current.phase).toBe("live");

    act(() => {
      capturedCallbacks[0]?.({ new: { intake_status: "ready" } });
    });
    expect(onReady).toHaveBeenCalledTimes(1);
    expect(result.current.phase).toBe("ready");
    unmount();
  });

  it("reconnect clears connection_lost and re-subscribes", () => {
    const { result, unmount } = renderHook(() =>
      useBrandAnalysisProgress({ brandId, initialStatus: "crawl_running", ...noQuiet }),
    );
    act(() => {
      statusCallback?.("CHANNEL_ERROR");
    });
    expect(result.current.phase).toBe("connection_lost");
    const subsBefore = mockSubscribe.mock.calls.length;
    act(() => {
      result.current.reconnect();
    });
    expect(result.current.phase).toBe("live");
    expect(mockSubscribe.mock.calls.length).toBeGreaterThan(subsBefore);
    unmount();
  });

});
