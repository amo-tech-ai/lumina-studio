import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { config } from "../proxy";

// IPI2-127 — Next.js 16 uses src/proxy.ts as the sole network gate entry.
// Do not add app/middleware.ts: dual entry breaks Turbopack NFT tracing on Vercel.

const APP_DIR = resolve(fileURLToPath(new URL(".", import.meta.url)), "../..");
const MIDDLEWARE = resolve(APP_DIR, "middleware.ts");
const PROXY = resolve(APP_DIR, "src/proxy.ts");

const MATCHER = [
  "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
];

describe("operator middleware — wiring contract (IPI2-127)", () => {
  it("src/proxy.ts is the sole Next.js 16 entry (no app/middleware.ts)", () => {
    expect(existsSync(PROXY)).toBe(true);
    expect(existsSync(MIDDLEWARE)).toBe(false);
  });

  it("proxy.ts declares config inline (Next.js 16 static analysis)", () => {
    const src = readFileSync(PROXY, "utf8");
    expect(src).toMatch(/export\s+const\s+config\s*=\s*\{/);
    expect(src).not.toMatch(/export\s*\{\s*config\s*\}\s*from/);
    expect(config.matcher).toEqual(MATCHER);
  });

  it("proxy.ts exports a broad matcher and an async handler", () => {
    const src = readFileSync(PROXY, "utf8");
    expect(src).toMatch(/export async function proxy/);
    expect(src).toMatch(
      /const\s+sessionResponse\s*=\s*await\s+updateSession\s*\(\s*request\s*\)/,
    );
  });
});
