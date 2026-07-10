import { describe, expect, it } from "vitest";
import { config, middleware } from "./middleware";

describe("middleware wiring (IPI2-127 / CF-MIG-210)", () => {
  it("middleware exports a handler function", () => {
    expect(typeof middleware).toBe("function");
  });

  it("middleware config matches all non-static routes for session refresh", () => {
    expect(config.matcher).toEqual([
      "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ]);
  });
});
