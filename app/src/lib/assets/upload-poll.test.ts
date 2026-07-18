import { describe, expect, it, vi } from "vitest";

import { pollUntilMirrorTerminal, uploadPollDelayMs } from "./upload-poll";

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
});
