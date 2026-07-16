import { InMemoryStore } from "@mastra/core/storage";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getMastraStorage,
  isCloudflareWorkersRuntime,
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

  it("allows MASTRA_STORAGE_MODE=pg escape hatch on Workers", () => {
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
});

describe("Cloudflare @mastra/pg stub (IPI-490)", () => {
  it("throws a clear config error — never a silent fake PostgresStore", async () => {
    const { PostgresStore } = await import("../../scripts/cf-mastra-pg-stub.mjs");
    expect(() => new PostgresStore()).toThrow(
      /PostgresStore is unavailable in this Worker bundle/,
    );
    expect(() => new PostgresStore()).toThrow(/MASTRA_STORAGE_MODE=noop/);
  });
});
