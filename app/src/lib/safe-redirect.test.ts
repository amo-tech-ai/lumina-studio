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

  // IPI-833 — /onboarding is a sibling route group, so it carries no /app
  // prefix. The middleware gates it; without it here, signing in would drop the
  // user on /app instead of the flow they were sent to log in for.
  it("keeps /onboarding and /onboarding/* paths (with query and hash)", () => {
    expect(safeRedirect("/onboarding")).toBe("/onboarding");
    expect(safeRedirect("/onboarding/")).toBe("/onboarding/");
    expect(safeRedirect("/onboarding?source=email")).toBe("/onboarding?source=email");
  });

  it("rejects same-origin paths outside the protected routes", () => {
    expect(safeRedirect("/")).toBe("/app");
    expect(safeRedirect("/login")).toBe("/app");
    expect(safeRedirect("/services/clothing")).toBe("/app");
    expect(safeRedirect("/application")).toBe("/app"); // must not match the /app prefix
    expect(safeRedirect("/onboardingx")).toBe("/app"); // nor the /onboarding prefix
  });

  it("stays in sync with the middleware's protected-route list", () => {
    // A route the middleware gates but this rejects sends the user somewhere
    // they never asked for, with no error to explain it.
    for (const gated of ["/app", "/app/brand", "/onboarding"]) {
      expect(safeRedirect(gated), gated).toBe(gated);
    }
  });
});
