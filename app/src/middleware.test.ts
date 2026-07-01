import { describe, expect, it } from "vitest";
import { config, proxy } from "./proxy";

describe("proxy wiring (IPI2-127)", () => {
  it("proxy exports a handler function", () => {
    expect(typeof proxy).toBe("function");
  });

  it("proxy config matches all non-static routes for session refresh", () => {
    expect(config.matcher).toEqual([
      "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ]);
  });
});
