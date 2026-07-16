import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const LAYOUT = resolve(fileURLToPath(new URL(".", import.meta.url)), "layout.tsx");
const src = readFileSync(LAYOUT, "utf8");

/**
 * IPI-654 · CHAT-RUNTIME-001 — OpenNext keepNames + next-themes FOUC script.
 * Without a preceding `__name` polyfill, every preview page throws
 * `ReferenceError: __name is not defined` in the inline theme IIFE.
 */
describe("RootLayout — OpenNext __name polyfill (IPI-654)", () => {
  it("defines __name before ThemeProvider", () => {
    const polyfillAt = src.indexOf("var __name=");
    const themeAt = src.indexOf("<ThemeProvider");
    expect(polyfillAt).toBeGreaterThan(-1);
    expect(themeAt).toBeGreaterThan(-1);
    expect(polyfillAt).toBeLessThan(themeAt);
  });

  it("polyfill assigns Object.defineProperty name helper", () => {
    expect(src).toMatch(/Object\.defineProperty\(t,\s*["']name["']/);
  });
});
