import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// IPI2-127 — proxy.ts is tested in isolation, but it only protects /app/* when
// wired into Next.js middleware. This contract test fails if the gate is
// implemented but not deployed.

const APP_ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const MIDDLEWARE = resolve(APP_ROOT, "middleware.ts");
const PROXY = resolve(APP_ROOT, "proxy.ts");

describe("operator middleware — wiring contract (IPI2-127)", () => {
  it("middleware.ts exists and re-exports proxy + config", () => {
    expect(existsSync(MIDDLEWARE)).toBe(true);
    const src = readFileSync(MIDDLEWARE, "utf8");
    expect(src).toMatch(/proxy\s+as\s+middleware/);
    expect(src).toMatch(/from\s+["']\.\/proxy["']/);
    expect(src).toMatch(/config/);
  });

  it("proxy.ts exports the /app/* matcher expected by middleware", () => {
    const src = readFileSync(PROXY, "utf8");
    expect(src).toMatch(/matcher:\s*\["\/app\/:path\*"\]/);
  });
});
