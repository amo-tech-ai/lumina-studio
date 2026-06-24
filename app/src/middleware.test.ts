import { describe, expect, it } from "vitest";
import { config, proxy } from "./proxy";

// Next.js 16 uses proxy.ts directly as middleware — no middleware.ts re-export
// needed (having both causes a build error).
describe("middleware wiring (IPI2-127)", () => {
  it("proxy exports a handler function", () => {
    expect(typeof proxy).toBe("function");
  });

  it("proxy config matches /app/* routes", () => {
    expect(config.matcher).toEqual(["/app/:path*"]);
  });
});
