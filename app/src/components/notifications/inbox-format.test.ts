import { describe, expect, it } from "vitest";

import { isSafeInternalDeepLink } from "./inbox-format";

describe("isSafeInternalDeepLink", () => {
  it("accepts a real in-app path", () => {
    expect(isSafeInternalDeepLink("/app/shoots/123")).toBe(true);
  });

  it("rejects null", () => {
    expect(isSafeInternalDeepLink(null)).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isSafeInternalDeepLink("")).toBe(false);
  });

  it("rejects a path outside /app/", () => {
    expect(isSafeInternalDeepLink("/login")).toBe(false);
  });

  it("rejects an absolute external URL", () => {
    expect(isSafeInternalDeepLink("https://evil.example/app/shoots/123")).toBe(false);
  });

  it("rejects a protocol-relative URL (browser treats // as external)", () => {
    expect(isSafeInternalDeepLink("//evil.example/app/shoots/123")).toBe(false);
  });

  it("rejects a javascript: scheme", () => {
    expect(isSafeInternalDeepLink("javascript:alert(1)")).toBe(false);
  });
});
