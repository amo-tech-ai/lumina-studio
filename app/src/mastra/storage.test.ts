import { InMemoryStore } from "@mastra/core/storage";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertPostgresStoreModule,
  getMastraStorage,
  getMastraStorageLazy,
  isCloudflareWorkersRuntime,
  isVercelRuntime,
  shouldSkipMastraPostgresStorage,
} from "./storage";

describe("shouldSkipMastraPostgresStorage", () => {
  it("skips when MASTRA_STORAGE_MODE=noop", () => {
    expect(shouldSkipMastraPostgresStorage({ MASTRA_STORAGE_MODE: "noop" }, false)).toBe(
      true,
    );
  });

  it("does not skip on Node when mode unset", () => {
    expect(shouldSkipMastraPostgresStorage({}, false)).toBe(false);
  });

  it("skips on Workers by default", () => {
    expect(shouldSkipMastraPostgresStorage({}, true)).toBe(true);
  });

  it("routes to Postgres path when MASTRA_STORAGE_MODE=pg (Node keeps real @mastra/pg)", () => {
    expect(shouldSkipMastraPostgresStorage({ MASTRA_STORAGE_MODE: "pg" }, true)).toBe(
      false,
    );
  });
});

describe("isCloudflareWorkersRuntime", () => {
  it("is false under vitest/Node", () => {
    expect(isCloudflareWorkersRuntime()).toBe(false);
  });
});

describe("isVercelRuntime", () => {
  it("detects Vercel via VERCEL=1", () => {
    expect(isVercelRuntime({ VERCEL: "1" })).toBe(true);
    expect(isVercelRuntime({})).toBe(false);
  });
});

describe("getMastraStorage (noop mode)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns InMemoryStore with getStore when MASTRA_STORAGE_MODE=noop", async () => {
    vi.stubEnv("MASTRA_STORAGE_MODE", "noop");
    const store = getMastraStorage();
    expect(store).toBeInstanceOf(InMemoryStore);
    const memory = await store.getStore("memory");
    expect(memory).toBeTruthy();
  });

  it("reuses the same InMemoryStore instance on repeated calls", async () => {
    vi.stubEnv("MASTRA_STORAGE_MODE", "noop");
    vi.resetModules();
    const { getMastraStorage: freshGetMastraStorage } = await import("./storage");
    const first = freshGetMastraStorage();
    const second = freshGetMastraStorage();
    expect(first).toBe(second);
  });

  it("does not initialize storage when getMastraStorageLazy is called", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("DATABASE_URL", "");
    vi.resetModules();
    const { getMastraStorageLazy: freshLazy } = await import("./storage");
    expect(() => freshLazy()).not.toThrow();
  });

  it("throws MastraStorageUnavailableError on Vercel prod when DATABASE_URL is unset", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    // GitHub Actions / vitest set CI=true; prod Vercel runtime does not — clear it
    // so requireProductionDatabaseUrl exercises the hard-fail path (IPI-703).
    vi.stubEnv("CI", "");
    vi.stubEnv("DATABASE_URL", "");
    vi.resetModules();
    const { getMastraStorage: freshGetMastraStorage, MastraStorageUnavailableError } =
      await import("./storage");
    expect(() => freshGetMastraStorage()).toThrow(MastraStorageUnavailableError);
    expect(() => freshGetMastraStorage()).toThrow(/Vercel production/);
  });

  it("caches MastraStorageUnavailableError so prod init is not re-run each call", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("CI", "");
    vi.stubEnv("DATABASE_URL", "");
    vi.resetModules();
    const { getMastraStorage: freshGetMastraStorage, MastraStorageUnavailableError } =
      await import("./storage");
    let first: unknown;
    let second: unknown;
    try {
      freshGetMastraStorage();
    } catch (err) {
      first = err;
    }
    try {
      freshGetMastraStorage();
    } catch (err) {
      second = err;
    }
    expect(first).toBeInstanceOf(MastraStorageUnavailableError);
    expect(second).toBe(first);
  });

  it("sets degraded signal when Vercel prod storage is unavailable", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("CI", "");
    vi.stubEnv("DATABASE_URL", "");
    vi.resetModules();
    const mod = await import("./storage");
    expect(() => mod.getMastraStorage()).toThrow(/Vercel production/);
    expect(mod.isMastraStorageDegraded()).toBe(true);
  });

  it("uses InMemoryStore in CI builds when DATABASE_URL is unset", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CI", "true");
    vi.stubEnv("DATABASE_URL", "");
    vi.resetModules();
    const { getMastraStorage: freshGetMastraStorage } = await import("./storage");
    const store = freshGetMastraStorage();
    expect(store).toBeInstanceOf(InMemoryStore);
  });
});

describe("Cloudflare @mastra/pg stub (IPI-490)", () => {
  it("throws a clear config error — never a silent fake PostgresStore", async () => {
    const { PostgresStore } = await import("../../scripts/cf-mastra-pg-stub.mjs");
    expect(() => new PostgresStore()).toThrow(
      /PostgresStore is unavailable in this Worker bundle/,
    );
    expect(() => new PostgresStore()).toThrow(/MASTRA_STORAGE_MODE=noop/);
  });

  it("rejects MASTRA_STORAGE_MODE=pg when the Worker stub is what resolved", async () => {
    const mod = await import("../../scripts/cf-mastra-pg-stub.mjs");
    expect(mod.IPIX_CF_MASTRA_PG_STUB).toBe(true);
    expect(() => assertPostgresStoreModule(mod)).toThrow(
      /MASTRA_STORAGE_MODE=pg is unavailable in this Worker bundle/,
    );
  });

  it("allows a real PostgresStore module shape (no stub marker)", () => {
    class FakePostgresStore {}
    expect(() =>
      assertPostgresStoreModule({ PostgresStore: FakePostgresStore }),
    ).not.toThrow();
  });

  it("OpenNext buildCommand sets noop alongside stubs (Node build is not Workers)", async () => {
    // Regression for Bugbot: IPIX_CF_BUNDLE_STUBS alone stubs PostgresStore to throw,
    // but Node next build keeps shouldSkipMastraPostgresStorage=false when mode unset.
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const src = readFileSync(resolve(__dirname, "../../open-next.config.ts"), "utf8");
    expect(src).toMatch(/IPIX_CF_BUNDLE_STUBS=1/);
    expect(src).toMatch(/MASTRA_STORAGE_MODE=noop/);
  });

  it("release scripts run check:worker-bundle before deploy/upload", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const pkg = JSON.parse(
      readFileSync(resolve(__dirname, "../../package.json"), "utf8"),
    ) as { scripts: Record<string, string> };
    expect(pkg.scripts["build:cf"]).toMatch(/check:worker-bundle/);
    expect(pkg.scripts.deploy).toMatch(/npm run build:cf/);
    expect(pkg.scripts.upload).toMatch(/npm run build:cf/);
    expect(pkg.scripts.preview).toMatch(/npm run build:cf/);
  });
});

describe("IPI-718 · ESM-safe Postgres loading", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("storage.ts does not use createRequire / require('@mastra/pg')", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const src = readFileSync(resolve(__dirname, "./storage.ts"), "utf8");
    expect(src).not.toMatch(/from ["']node:module["']/);
    expect(src).not.toMatch(/createRequire\s*\(/);
    expect(src).not.toMatch(/require\(["']@mastra\/pg["']\)/);
    expect(src).toMatch(/import \* as MastraPg from ["']@mastra\/pg["']/);
  });

  it("next.config does not externalize @mastra/pg (native require → ERR_REQUIRE_ESM)", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const src = readFileSync(resolve(__dirname, "../../next.config.ts"), "utf8");
    expect(src).toMatch(/serverExternalPackages/);
    // Must not appear as a list entry (commented mentions OK if quoted carefully).
    expect(src).not.toMatch(/^\s*"@mastra\/pg",?\s*$/m);
    expect(src).toMatch(/"pg"/);
  });

  it("constructs PostgresStore under Vercel prod when DATABASE_URL is set (no ERR_REQUIRE_ESM)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("CI", "");
    // Unreachable host — constructor must not throw ERR_REQUIRE_ESM; no live DB required.
    vi.stubEnv(
      "DATABASE_URL",
      "postgresql://postgres:postgres@127.0.0.1:1/postgres?sslmode=disable",
    );
    vi.resetModules();
    const { getMastraStorage: freshGet } = await import("./storage");
    let store: unknown;
    expect(() => {
      store = freshGet();
    }).not.toThrow(/ERR_REQUIRE_ESM|require\(\) of ES Module/);
    expect(store).toBeTruthy();
    expect((store as { constructor: { name: string } }).constructor.name).toMatch(
      /PostgresStore/,
    );
  });
});
