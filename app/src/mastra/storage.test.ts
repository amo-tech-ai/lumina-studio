import { InMemoryStore } from "@mastra/core/storage";
import { afterEach, describe, expect, it } from "vitest";
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
  const prev = process.env.MASTRA_STORAGE_MODE;

  afterEach(() => {
    if (prev === undefined) delete process.env.MASTRA_STORAGE_MODE;
    else process.env.MASTRA_STORAGE_MODE = prev;
  });

  it("returns InMemoryStore with getStore when MASTRA_STORAGE_MODE=noop", async () => {
    process.env.MASTRA_STORAGE_MODE = "noop";
    const store = getMastraStorage();
    expect(store).toBeInstanceOf(InMemoryStore);
    const memory = await store.getStore("memory");
    expect(memory).toBeTruthy();
  });
});
