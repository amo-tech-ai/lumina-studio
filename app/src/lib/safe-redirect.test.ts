import { describe, it, expect } from "vitest";
import { safeRedirect } from "./safe-redirect";

describe("safeRedirect", () => {
  it("keeps /app and /app/* paths (with query)", () => {
    expect(safeRedirect("/app")).toBe("/app");
    expect(safeRedirect("/app/brand")).toBe("/app/brand");
    expect(safeRedirect("/app/assets?tab=review")).toBe("/app/assets?tab=review");
    expect(safeRedirect("/app?tab=overview")).toBe("/app?tab=overview");
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

  it("rejects same-origin paths outside /app", () => {
    expect(safeRedirect("/")).toBe("/app");
    expect(safeRedirect("/login")).toBe("/app");
    expect(safeRedirect("/services/clothing")).toBe("/app");
    expect(safeRedirect("/application")).toBe("/app"); // must not match the /app prefix
  });
});
