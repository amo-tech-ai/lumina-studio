import { afterEach, describe, expect, it, vi } from "vitest";

import { isDevSkipMode } from "./dev-skip-fixture";

describe("isDevSkipMode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns false in production regardless of skip param", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(isDevSkipMode("1")).toBe(false);
    expect(isDevSkipMode("approval")).toBe(false);
  });

  it("returns true for dev skip params outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(isDevSkipMode("1")).toBe(true);
    expect(isDevSkipMode("approval")).toBe(true);
    expect(isDevSkipMode(null)).toBe(false);
    expect(isDevSkipMode("true")).toBe(false);
  });
});
