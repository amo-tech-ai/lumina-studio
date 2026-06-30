import { describe, expect, it } from "vitest";
import { config as middlewareConfig } from "../middleware";
import { config, proxy } from "./proxy";

describe("middleware wiring (IPI2-127)", () => {
  it("proxy exports a handler function", () => {
    expect(typeof proxy).toBe("function");
  });

  it("middleware.ts config stays in sync with src/proxy.ts (Next.js 16 requires inline config)", () => {
    expect(middlewareConfig.matcher).toEqual(config.matcher);
  });

  it("proxy config matches all non-static routes for session refresh", () => {
    expect(config.matcher).toEqual([
      "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ]);
  });
});
