// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";

import { useUnreadNotifications } from "./use-unread-notifications";

function mockFetchOnce(body: { items?: unknown[]; next_cursor?: string | null }) {
  (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: true,
    json: async () => body,
  });
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("useUnreadNotifications", () => {
  it("count is the page size, hasMore is false when next_cursor is null", async () => {
    mockFetchOnce({ items: new Array(12).fill({}), next_cursor: null });

    const { result } = renderHook(() => useUnreadNotifications());

    await waitFor(() => expect(result.current.count).toBe(12));
    expect(result.current.hasMore).toBe(false);
  });

  it("hasMore is true when next_cursor is present — this is the real '50+' signal, not count > 50", async () => {
    mockFetchOnce({ items: new Array(50).fill({}), next_cursor: "some-cursor" });

    const { result } = renderHook(() => useUnreadNotifications());

    await waitFor(() => expect(result.current.count).toBe(50));
    expect(result.current.hasMore).toBe(true);
  });

  it("refetches when the tab becomes visible", async () => {
    mockFetchOnce({ items: [], next_cursor: null });
    renderHook(() => useUnreadNotifications());
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

    mockFetchOnce({ items: [{}], next_cursor: null });
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  });

  it("does not refetch on visibilitychange while hidden", async () => {
    mockFetchOnce({ items: [], next_cursor: null });
    renderHook(() => useUnreadNotifications());
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("cleans up both the focus and visibilitychange listeners on unmount", async () => {
    mockFetchOnce({ items: [], next_cursor: null });
    const removeWindowSpy = vi.spyOn(window, "removeEventListener");
    const removeDocSpy = vi.spyOn(document, "removeEventListener");

    const { unmount } = renderHook(() => useUnreadNotifications());
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    unmount();

    expect(removeWindowSpy).toHaveBeenCalledWith("focus", expect.any(Function));
    expect(removeDocSpy).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
  });
});
