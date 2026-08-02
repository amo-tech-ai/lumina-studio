import { describe, expect, it } from "vitest";
import {
  ONBOARDING_IDEMPOTENCY_STORAGE_KEY,
  getOrCreateOnboardingIdempotencyKey,
} from "./idempotency-key";

function memoryStorage(seed: Record<string, string> = {}) {
  const map = new Map(Object.entries(seed));
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
  };
}

describe("getOrCreateOnboardingIdempotencyKey", () => {
  it("creates and reuses a stable key", () => {
    const storage = memoryStorage();
    const a = getOrCreateOnboardingIdempotencyKey(storage);
    const b = getOrCreateOnboardingIdempotencyKey(storage);
    expect(a).toBe(b);
    expect(a.length).toBeGreaterThan(10);
    expect(storage.getItem(ONBOARDING_IDEMPOTENCY_STORAGE_KEY)).toBe(a);
  });

  it("returns an existing key without rotating", () => {
    const storage = memoryStorage({
      [ONBOARDING_IDEMPOTENCY_STORAGE_KEY]: "fixed-key",
    });
    expect(getOrCreateOnboardingIdempotencyKey(storage)).toBe("fixed-key");
  });
});
