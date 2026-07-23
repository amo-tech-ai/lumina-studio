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
    vi.stubEnv("MASTRA_DATABASE_URL", "");
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
    vi.stubEnv("MASTRA_DATABASE_URL", "");
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
    vi.stubEnv("MASTRA_DATABASE_URL", "");
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
    vi.stubEnv("MASTRA_DATABASE_URL", "");
    vi.resetModules();
    const mod = await import("./storage");
    expect(() => mod.getMastraStorage()).toThrow(/Vercel production/);
    expect(mod.isMastraStorageDegraded()).toBe(true);
  });

  it("keeps throwing when URL stays missing after latch trip", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("CI", "");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("MASTRA_DATABASE_URL", "");
    vi.resetModules();
    const { getMastraStorage: freshGetMastraStorage, MastraStorageUnavailableError } =
      await import("./storage");
    expect(() => freshGetMastraStorage()).toThrow(MastraStorageUnavailableError);
    expect(() => freshGetMastraStorage()).toThrow(MastraStorageUnavailableError);
  });

  it("uses InMemoryStore in CI builds when DATABASE_URL is unset", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CI", "true");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("MASTRA_DATABASE_URL", "");
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

describe("IPI-740 · Mastra pool + URL split", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.doUnmock("@mastra/pg");
    delete (globalThis as { __ipixMastraPgStore?: unknown }).__ipixMastraPgStore;
    delete (globalThis as { __ipixMastraSessionPoolWarned?: unknown }).__ipixMastraSessionPoolWarned;
  });

  it("resolveMastraDatabaseUrl prefers MASTRA_DATABASE_URL over DATABASE_URL", async () => {
    const { resolveMastraDatabaseUrl, resolveMastraDatabaseUrlWithSource } = await import("./storage");
    expect(
      resolveMastraDatabaseUrl({
        MASTRA_DATABASE_URL: "postgresql://mastra@host:6543/db",
        DATABASE_URL: "postgresql://session@host:5432/db",
      }),
    ).toBe("postgresql://mastra@host:6543/db");
    expect(resolveMastraDatabaseUrl({ DATABASE_URL: "postgresql://session@host:5432/db" })).toBe(
      "postgresql://session@host:5432/db",
    );
    expect(
      resolveMastraDatabaseUrl({
        MASTRA_DATABASE_URL: "  ",
        DATABASE_URL: "postgresql://session@host:5432/db",
      }),
    ).toBe("postgresql://session@host:5432/db");
    expect(resolveMastraDatabaseUrl({})).toBe("");
    expect(
      resolveMastraDatabaseUrlWithSource({
        DATABASE_URL: "postgresql://session@host:5432/db",
      }),
    ).toEqual({ url: "postgresql://session@host:5432/db", source: "database" });
    expect(
      resolveMastraDatabaseUrlWithSource({
        MASTRA_DATABASE_URL: "postgresql://mastra@host:6543/db",
      }),
    ).toEqual({ url: "postgresql://mastra@host:6543/db", source: "mastra" });
  });

  it("warns once when falling back to session DATABASE_URL (:5432)", async () => {
    const { warnIfMastraSessionPoolFallback, isLikelySessionModePostgresUrl } = await import(
      "./storage"
    );
    expect(isLikelySessionModePostgresUrl("postgresql://u@h:5432/db")).toBe(true);
    expect(isLikelySessionModePostgresUrl("postgresql://u@h:6543/db")).toBe(false);

    const warn = vi.fn();
    warnIfMastraSessionPoolFallback(
      {
        url: "postgresql://session@127.0.0.1:5432/postgres",
        source: "database",
        poolMax: 4,
      },
      {},
      { warn },
    );
    warnIfMastraSessionPoolFallback(
      {
        url: "postgresql://session@127.0.0.1:5432/postgres",
        source: "database",
        poolMax: 4,
      },
      {},
      { warn },
    );
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/MASTRA_DATABASE_URL unset/);
    expect(warn.mock.calls[0][0]).toMatch(/2×4/);
    expect(warn.mock.calls[0][0]).toMatch(/:6543/);
  });

  it("does not warn when MASTRA_DATABASE_URL points at transaction :6543", async () => {
    const { warnIfMastraSessionPoolFallback } = await import("./storage");
    const warn = vi.fn();
    warnIfMastraSessionPoolFallback(
      {
        url: "postgresql://mastra@127.0.0.1:6543/postgres",
        source: "mastra",
        poolMax: 4,
      },
      {},
      { warn },
    );
    expect(warn).not.toHaveBeenCalled();
  });

  it("passes MASTRA_DATABASE_URL (tagged with application_name), max, and idleTimeoutMillis to PostgresStore", async () => {
    const ctor = vi.fn(function FakePostgresStore(this: { id: string }, config: { id: string }) {
      this.id = config.id;
    });
    vi.doMock("@mastra/pg", () => ({
      PostgresStore: ctor,
      IPIX_CF_MASTRA_PG_STUB: undefined,
    }));
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("CI", "");
    vi.stubEnv("MASTRA_DATABASE_URL", "postgresql://mastra@127.0.0.1:6543/postgres");
    vi.stubEnv("DATABASE_URL", "postgresql://session@127.0.0.1:5432/postgres");
    vi.stubEnv("MASTRA_PG_POOL_MAX", "3");
    vi.resetModules();
    const { getMastraStorage: freshGet } = await import("./storage");
    freshGet();
    expect(ctor).toHaveBeenCalledTimes(1);
    expect(ctor).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "mastra-storage",
        connectionString:
          "postgresql://mastra@127.0.0.1:6543/postgres?application_name=ipix-mastra",
        max: 3,
        idleTimeoutMillis: 10_000,
      }),
    );
  });

  it("does not pass an explicit ssl override when DATABASE_SSL is unset (preserves connection-string sslmode)", async () => {
    // IPI-777 regression: @mastra/pg's own buildConnectionStringPoolConfig() spreads
    // config.ssl AFTER parse(connectionString) whenever config.ssl !== undefined — an
    // explicit `ssl: false` would silently downgrade a `?sslmode=require` connection
    // string to plaintext. Only `undefined` here is safe; do not regress to `false`.
    const ctor = vi.fn(function FakePostgresStore() {});
    vi.doMock("@mastra/pg", () => ({
      PostgresStore: ctor,
      IPIX_CF_MASTRA_PG_STUB: undefined,
    }));
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("CI", "");
    vi.stubEnv("MASTRA_DATABASE_URL", "postgresql://mastra@127.0.0.1:6543/postgres");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("DATABASE_SSL", "");
    vi.resetModules();
    const { getMastraStorage: freshGet } = await import("./storage");
    freshGet();
    expect(ctor).toHaveBeenCalledWith(expect.objectContaining({ ssl: undefined }));
  });

  it("passes ssl:{rejectUnauthorized:false} when DATABASE_SSL=true", async () => {
    const ctor = vi.fn(function FakePostgresStore() {});
    vi.doMock("@mastra/pg", () => ({
      PostgresStore: ctor,
      IPIX_CF_MASTRA_PG_STUB: undefined,
    }));
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("CI", "");
    vi.stubEnv("MASTRA_DATABASE_URL", "postgresql://mastra@127.0.0.1:6543/postgres");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("DATABASE_SSL", "true");
    vi.resetModules();
    const { getMastraStorage: freshGet } = await import("./storage");
    freshGet();
    expect(ctor).toHaveBeenCalledWith(
      expect.objectContaining({ ssl: { rejectUnauthorized: false } }),
    );
  });

  it("does not treat DATABASE_SSL=false or any non-'true' value as SSL opt-in", async () => {
    const ctor = vi.fn(function FakePostgresStore() {});
    vi.doMock("@mastra/pg", () => ({
      PostgresStore: ctor,
      IPIX_CF_MASTRA_PG_STUB: undefined,
    }));
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("CI", "");
    vi.stubEnv("MASTRA_DATABASE_URL", "postgresql://mastra@127.0.0.1:6543/postgres");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("DATABASE_SSL", "false");
    vi.resetModules();
    const { getMastraStorage: freshGet } = await import("./storage");
    freshGet();
    expect(ctor).toHaveBeenCalledWith(expect.objectContaining({ ssl: undefined }));
  });

  it("preserves an existing ?sslmode=require on the connection string untouched", async () => {
    const ctor = vi.fn(function FakePostgresStore() {});
    vi.doMock("@mastra/pg", () => ({
      PostgresStore: ctor,
      IPIX_CF_MASTRA_PG_STUB: undefined,
    }));
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("CI", "");
    vi.stubEnv(
      "MASTRA_DATABASE_URL",
      "postgresql://mastra@127.0.0.1:6543/postgres?sslmode=require",
    );
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("DATABASE_SSL", "");
    vi.resetModules();
    const { getMastraStorage: freshGet } = await import("./storage");
    freshGet();
    expect(ctor).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionString: expect.stringContaining("sslmode=require"),
        ssl: undefined,
      }),
    );
  });

  it("preserves ?sslmode=disable when DATABASE_SSL is unset (no explicit ssl override)", async () => {
    const ctor = vi.fn(function FakePostgresStore() {});
    vi.doMock("@mastra/pg", () => ({
      PostgresStore: ctor,
      IPIX_CF_MASTRA_PG_STUB: undefined,
    }));
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("CI", "");
    vi.stubEnv(
      "MASTRA_DATABASE_URL",
      "postgresql://mastra@127.0.0.1:6543/postgres?sslmode=disable",
    );
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("DATABASE_SSL", "");
    vi.resetModules();
    const { getMastraStorage: freshGet } = await import("./storage");
    freshGet();
    expect(ctor).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionString: expect.stringContaining("sslmode=disable"),
        ssl: undefined,
      }),
    );
  });
});

describe("withMastraApplicationName", () => {
  it("appends application_name when absent", async () => {
    const { withMastraApplicationName } = await import("./storage");
    expect(withMastraApplicationName("postgresql://u@h:6543/db")).toBe(
      "postgresql://u@h:6543/db?application_name=ipix-mastra",
    );
  });

  it("preserves existing query params (e.g. sslmode)", async () => {
    const { withMastraApplicationName } = await import("./storage");
    expect(withMastraApplicationName("postgresql://u@h:6543/db?sslmode=require")).toBe(
      "postgresql://u@h:6543/db?sslmode=require&application_name=ipix-mastra",
    );
  });

  it("does not override an operator-set application_name", async () => {
    const { withMastraApplicationName } = await import("./storage");
    expect(
      withMastraApplicationName("postgresql://u@h:6543/db?application_name=already-set"),
    ).toBe("postgresql://u@h:6543/db?application_name=already-set");
  });

  it("passes through malformed input unchanged instead of throwing", async () => {
    const { withMastraApplicationName } = await import("./storage");
    expect(withMastraApplicationName("")).toBe("");
    expect(withMastraApplicationName("/var/run/postgresql")).toBe("/var/run/postgresql");
  });
});

describe("IPI-740 · Mastra pool + URL split (cont.)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.doUnmock("@mastra/pg");
    delete (globalThis as { __ipixMastraPgStore?: unknown }).__ipixMastraPgStore;
    delete (globalThis as { __ipixMastraSessionPoolWarned?: unknown }).__ipixMastraSessionPoolWarned;
  });

  it("defaults pool max to 4 when MASTRA_PG_POOL_MAX is unset", async () => {
    const ctor = vi.fn(function FakePostgresStore() {});
    vi.doMock("@mastra/pg", () => ({
      PostgresStore: ctor,
      IPIX_CF_MASTRA_PG_STUB: undefined,
    }));
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CI", "");
    vi.stubEnv("DATABASE_URL", "postgresql://session@127.0.0.1:5432/postgres");
    vi.stubEnv("MASTRA_DATABASE_URL", "");
    vi.stubEnv("MASTRA_PG_POOL_MAX", "");
    vi.resetModules();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { getMastraStorage: freshGet } = await import("./storage");
    freshGet();
    expect(ctor).toHaveBeenCalledWith(expect.objectContaining({ max: 4, idleTimeoutMillis: 10_000 }));
    expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/session-pool risk/));
    warnSpy.mockRestore();
  });

  it("reuses globalThis PostgresStore across module reloads in development", async () => {
    const ctor = vi.fn(function FakePostgresStore(this: { id: string }) {
      this.id = "mastra-storage";
    });
    vi.doMock("@mastra/pg", () => ({
      PostgresStore: ctor,
      IPIX_CF_MASTRA_PG_STUB: undefined,
    }));
    delete (globalThis as { __ipixMastraPgStore?: unknown }).__ipixMastraPgStore;
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DATABASE_URL", "postgresql://session@127.0.0.1:5432/postgres");
    vi.resetModules();
    const mod1 = await import("./storage");
    const first = mod1.getMastraStorage();
    vi.resetModules();
    const mod2 = await import("./storage");
    const second = mod2.getMastraStorage();
    expect(first).toBe(second);
    expect(ctor).toHaveBeenCalledTimes(1);
  });
});

describe("IPI-778 · degraded latch recovery", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.doUnmock("@mastra/pg");
  });

  it("recovers when MASTRA_DATABASE_URL appears after prod latch trip", async () => {
    const ctor = vi.fn(function FakePostgresStore(this: { id: string }, config: { id: string }) {
      this.id = config.id;
    });
    vi.doMock("@mastra/pg", () => ({
      PostgresStore: ctor,
      IPIX_CF_MASTRA_PG_STUB: undefined,
    }));
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("CI", "");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("MASTRA_DATABASE_URL", "");
    vi.resetModules();
    const mod = await import("./storage");
    expect(() => mod.getMastraStorage()).toThrow(/Vercel production/);
    expect(mod.isMastraStorageDegraded()).toBe(true);

    vi.stubEnv("MASTRA_DATABASE_URL", "postgresql://mastra@127.0.0.1:6543/postgres");
    expect(mod.isMastraStorageDegraded()).toBe(true);

    const store = mod.getMastraStorage();
    expect(mod.isMastraStorageDegraded()).toBe(false);
    expect(ctor).toHaveBeenCalledTimes(1);
    expect(store).toBe(mod.getMastraStorage());
    expect(ctor).toHaveBeenCalledTimes(1);
  });

  it("recovers when only DATABASE_URL appears after prod latch trip", async () => {
    const ctor = vi.fn(function FakePostgresStore(this: { id: string }, config: { id: string }) {
      this.id = config.id;
    });
    vi.doMock("@mastra/pg", () => ({
      PostgresStore: ctor,
      IPIX_CF_MASTRA_PG_STUB: undefined,
    }));
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("CI", "");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("MASTRA_DATABASE_URL", "");
    vi.resetModules();
    const mod = await import("./storage");
    expect(() => mod.getMastraStorage()).toThrow(/Vercel production/);

    vi.stubEnv("DATABASE_URL", "postgresql://session@127.0.0.1:5432/postgres");
    expect(mod.isMastraStorageDegraded()).toBe(true);
    mod.getMastraStorage();
    expect(mod.isMastraStorageDegraded()).toBe(false);
    expect(ctor).toHaveBeenCalledTimes(1);
  });

  it("leaves Worker noop mode unchanged when latch never tripped", async () => {
    vi.stubEnv("MASTRA_STORAGE_MODE", "noop");
    vi.stubEnv("MASTRA_DATABASE_URL", "postgresql://mastra@127.0.0.1:6543/postgres");
    vi.resetModules();
    const mod = await import("./storage");
    const store = mod.getMastraStorage();
    expect(store).toBeInstanceOf(InMemoryStore);
    expect(mod.isMastraStorageDegraded()).toBe(false);
  });
});
