import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { config } from "../middleware";

// IPI2-127 + CF-MIG-210 — Edge middleware for Supabase session refresh + operator gate.
// OpenNext on Cloudflare does not support proxy.ts (Node runtime); use src/middleware.ts only.
// Do not add app/middleware.ts: dual entry breaks Turbopack NFT tracing.

const APP_DIR = resolve(fileURLToPath(new URL(".", import.meta.url)), "../..");
const APP_MIDDLEWARE = resolve(APP_DIR, "middleware.ts");
const SRC_MIDDLEWARE = resolve(APP_DIR, "src/middleware.ts");
const PROXY = resolve(APP_DIR, "src/proxy.ts");

const MATCHER = [
  "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
];

describe("operator middleware — wiring contract (IPI2-127 / CF-MIG-210)", () => {
  it("src/middleware.ts is the sole network gate (no app/middleware.ts or proxy.ts)", () => {
    expect(existsSync(SRC_MIDDLEWARE)).toBe(true);
    expect(existsSync(PROXY)).toBe(false);
    expect(existsSync(APP_MIDDLEWARE)).toBe(false);
  });

  it("middleware.ts declares config inline (Next.js static analysis)", () => {
    const src = readFileSync(SRC_MIDDLEWARE, "utf8");
    expect(src).toMatch(/export\s+const\s+config\s*=\s*\{/);
    expect(src).not.toMatch(/export\s*\{\s*config\s*\}\s*from/);
    expect(config.matcher).toEqual(MATCHER);
  });

  it("middleware.ts exports a broad matcher and an async handler", () => {
    const src = readFileSync(SRC_MIDDLEWARE, "utf8");
    expect(src).toMatch(/export async function middleware/);
    expect(src).toMatch(
      /const\s+sessionResponse\s*=\s*await\s+updateSession\s*\(\s*request\s*\)/,
    );
  });
});
