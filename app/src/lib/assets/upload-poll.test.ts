import { describe, expect, it } from "vitest";

import { uploadPollDelayMs } from "./upload-poll";

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
