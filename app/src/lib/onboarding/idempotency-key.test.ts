import { describe, expect, it } from "vitest";
import {
  ONBOARDING_IDEMPOTENCY_STORAGE_KEY,
  ONBOARDING_IDEMPOTENCY_STORAGE_PREFIX,
  getOrCreateOnboardingIdempotencyKey,
  onboardingIdempotencyStorageKey,
} from "./idempotency-key";

function memoryStorage(seed: Record<string, string> = {}) {
  const map = new Map(Object.entries(seed));
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
    dump: () => Object.fromEntries(map),
  };
}

describe("getOrCreateOnboardingIdempotencyKey — IPI-945 user-scoped", () => {
  it("creates and reuses a stable key per userId", () => {
    const storage = memoryStorage();
    const a = getOrCreateOnboardingIdempotencyKey("user-a", storage);
    const b = getOrCreateOnboardingIdempotencyKey("user-a", storage);
    expect(a).toBe(b);
    expect(a.length).toBeGreaterThan(10);
    expect(storage.getItem(onboardingIdempotencyStorageKey("user-a"))).toBe(a);
    expect(storage.getItem(ONBOARDING_IDEMPOTENCY_STORAGE_KEY)).toBeNull();
  });

  it("isolates keys across users (account switch)", () => {
    const storage = memoryStorage();
    const a = getOrCreateOnboardingIdempotencyKey("user-sk", storage);
    const b = getOrCreateOnboardingIdempotencyKey("user-qa", storage);
    expect(a).not.toBe(b);
    expect(storage.getItem(onboardingIdempotencyStorageKey("user-sk"))).toBe(a);
    expect(storage.getItem(onboardingIdempotencyStorageKey("user-qa"))).toBe(b);
  });

  it("returns an existing per-user key without rotating", () => {
    const key = onboardingIdempotencyStorageKey("user-a");
    const storage = memoryStorage({ [key]: "fixed-key" });
    expect(getOrCreateOnboardingIdempotencyKey("user-a", storage)).toBe("fixed-key");
  });

  it("removes the legacy browser-global key when minting a user-scoped key", () => {
    const storage = memoryStorage({
      [ONBOARDING_IDEMPOTENCY_STORAGE_KEY]: "legacy-shared",
    });
    const minted = getOrCreateOnboardingIdempotencyKey("user-new", storage);
    expect(storage.getItem(ONBOARDING_IDEMPOTENCY_STORAGE_KEY)).toBeNull();
    expect(minted).not.toBe("legacy-shared");
    expect(storage.getItem(onboardingIdempotencyStorageKey("user-new"))).toBe(minted);
  });

  it("rejects empty userId", () => {
    expect(() => getOrCreateOnboardingIdempotencyKey("", memoryStorage())).toThrow(
      /user id/i,
    );
  });

  it("keeps the storage prefix under ipix:onboarding: for Sign Out cleanup", () => {
    expect(ONBOARDING_IDEMPOTENCY_STORAGE_PREFIX.startsWith("ipix:onboarding:")).toBe(
      true,
    );
  });
});
