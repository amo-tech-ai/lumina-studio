import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { config as middlewareConfig } from "../../middleware";
import { config as proxyConfig } from "../proxy";

// IPI2-127 — proxy.ts holds the auth gate; app/middleware.ts wires it for Next.js.
// Next.js 16 requires export const config inline in middleware.ts (no re-export).

const APP_DIR = resolve(fileURLToPath(new URL(".", import.meta.url)), "../..");
const MIDDLEWARE = resolve(APP_DIR, "middleware.ts");
const PROXY = resolve(APP_DIR, "src/proxy.ts");

const MATCHER = [
  "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
];

describe("operator middleware — wiring contract (IPI2-127)", () => {
  it("middleware.ts and proxy.ts exist at expected paths", () => {
    expect(existsSync(MIDDLEWARE)).toBe(true);
    expect(existsSync(PROXY)).toBe(true);
  });

  it("middleware.ts wires proxy default and declares config inline (Next.js 16)", () => {
    const src = readFileSync(MIDDLEWARE, "utf8");
    expect(src).toMatch(
      /export\s*\{\s*proxy\s+as\s+default\s*\}\s*from\s*["']\.\/src\/proxy["']/,
    );
    expect(src).toMatch(/export\s+const\s+config\s*=\s*\{/);
    expect(src).not.toMatch(/export\s*\{\s*config\s*\}\s*from/);
    expect(src).not.toMatch(
      /import\s*\{\s*config\s*\}\s*from\s*["']\.\/src\/proxy["']/,
    );
  });

  it("middleware config matcher stays in sync with proxy.ts", () => {
    expect(middlewareConfig.matcher).toEqual(proxyConfig.matcher);
    expect(middlewareConfig.matcher).toEqual(MATCHER);
  });

  it("proxy.ts exports a broad matcher and an async handler", () => {
    const src = readFileSync(PROXY, "utf8");
    expect(src).toMatch(/export async function proxy/);
    expect(src).toMatch(
      /const\s+sessionResponse\s*=\s*await\s+updateSession\s*\(\s*request\s*\)/,
    );
    expect(proxyConfig.matcher).toEqual(MATCHER);
  });
});
