import { describe, expect, it } from "vitest";

const dashboardRoutes = [
  "/dashboard",
  "/dashboard/brand",
  "/dashboard/brand/intake",
  "/dashboard/assets",
  "/dashboard/products",
  "/dashboard/analytics",
  "/dashboard/settings",
] as const;

describe("operator hub routes", () => {
  it("defines all canonical MVP dashboard paths", () => {
    expect(dashboardRoutes).toHaveLength(7);
    expect(dashboardRoutes).toContain("/dashboard/brand/intake");
  });
});
