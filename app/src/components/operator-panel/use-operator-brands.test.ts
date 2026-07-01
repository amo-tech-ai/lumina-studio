/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

import { DEV_PREVIEW_BRANDS } from "./dev-skip-fixture";
import { useOperatorBrands } from "./use-operator-brands";

describe("useOperatorBrands", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("loads dev fixture brands when devSkip is true", () => {
    const { result } = renderHook(() => useOperatorBrands(true));
    expect(result.current.brands).toEqual([...DEV_PREVIEW_BRANDS]);
    expect(result.current.brandsLoading).toBe(false);
  });

  it("refetches when devSkip toggles from true to false", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: "live-1", name: "Live Brand", status: "active" }],
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result, rerender } = renderHook(({ devSkip }) => useOperatorBrands(devSkip), {
      initialProps: { devSkip: true },
    });

    rerender({ devSkip: false });

    await waitFor(() => {
      expect(result.current.brandsLoading).toBe(false);
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/brands");
    expect(result.current.brands).toEqual([
      { id: "live-1", name: "Live Brand", status: "active" },
    ]);
  });
});
