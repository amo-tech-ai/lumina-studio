import { describe, it, expect } from "vitest";
import { safeRedirect } from "./safe-redirect";

describe("safeRedirect", () => {
  it("keeps same-origin absolute paths (with query)", () => {
    expect(safeRedirect("/app/brand")).toBe("/app/brand");
    expect(safeRedirect("/app/assets?tab=review")).toBe("/app/assets?tab=review");
  });

  it("falls back to /app for empty/null", () => {
    expect(safeRedirect(null)).toBe("/app");
    expect(safeRedirect(undefined)).toBe("/app");
    expect(safeRedirect("")).toBe("/app");
  });

  it("rejects external + protocol-relative + scheme URLs", () => {
    expect(safeRedirect("//evil.com")).toBe("/app");
    expect(safeRedirect("https://evil.com")).toBe("/app");
    expect(safeRedirect("javascript:alert(1)")).toBe("/app");
  });
});
