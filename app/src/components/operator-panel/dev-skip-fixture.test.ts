import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DEV_PREVIEW_HERO_BRAND_ID,
  isDevPreviewBrandId,
  isDevSkipMode,
} from "./dev-skip-fixture";

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

describe("isDevPreviewBrandId", () => {
  it("identifies fixture brand IDs", () => {
    expect(isDevPreviewBrandId(DEV_PREVIEW_HERO_BRAND_ID)).toBe(true);
    expect(isDevPreviewBrandId("00000000-0000-4000-8000-000000000002")).toBe(true);
  });

  it("returns false for null and non-fixture IDs", () => {
    expect(isDevPreviewBrandId(null)).toBe(false);
    expect(isDevPreviewBrandId("00000000-0000-4000-8000-000000009999")).toBe(false);
  });
});
