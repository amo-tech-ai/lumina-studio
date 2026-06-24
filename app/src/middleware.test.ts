import { describe, expect, it } from "vitest";
import { config, middleware } from "./middleware";
import { config as proxyConfig, proxy } from "./proxy";

describe("middleware wiring (IPI2-127)", () => {
  it("re-exports proxy as the Next.js middleware handler", () => {
    expect(middleware).toBe(proxy);
  });

  it("re-exports the /app/* matcher from proxy config", () => {
    expect(config).toBe(proxyConfig);
    expect(config.matcher).toEqual(["/app/:path*"]);
  });
});
