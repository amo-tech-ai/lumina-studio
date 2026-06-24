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
  it("proxy.ts exists as the Next.js 16 middleware entry (no middleware.ts — dual-file causes build error)", () => {
    expect(existsSync(PROXY)).toBe(true);
    expect(existsSync(MIDDLEWARE)).toBe(false);
  });

  it("proxy.ts exports the /app/* matcher and a handler", () => {
    const src = readFileSync(PROXY, "utf8");
    expect(src).toMatch(/export function proxy/);
    expect(src).toMatch(/matcher:\s*\["\/app\/:path\*"\]/);
  });
});
