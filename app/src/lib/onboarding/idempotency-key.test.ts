import { describe, expect, it } from "vitest";
import {
  ONBOARDING_IDEMPOTENCY_STORAGE_KEY,
  ONBOARDING_IDEMPOTENCY_STORAGE_PREFIX,
  getOrCreateOnboardingIdempotencyKey,
  onboardingIdempotencyStorageKey,
  rotateOnboardingIdempotencyKey,
  wantsFreshOnboardingSession,
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

  it("migrates a legacy browser-global key into the user-scoped slot before clearing", () => {
    const storage = memoryStorage({
      [ONBOARDING_IDEMPOTENCY_STORAGE_KEY]: "legacy-draft-key",
    });
    const migrated = getOrCreateOnboardingIdempotencyKey("user-new", storage);
    expect(migrated).toBe("legacy-draft-key");
    expect(storage.getItem(ONBOARDING_IDEMPOTENCY_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(onboardingIdempotencyStorageKey("user-new"))).toBe(
      "legacy-draft-key",
    );
  });

  it("prefers an existing scoped key over a leftover legacy key", () => {
    const scoped = onboardingIdempotencyStorageKey("user-a");
    const storage = memoryStorage({
      [scoped]: "scoped-wins",
      [ONBOARDING_IDEMPOTENCY_STORAGE_KEY]: "legacy-ignored",
    });
    expect(getOrCreateOnboardingIdempotencyKey("user-a", storage)).toBe("scoped-wins");
    expect(storage.getItem(ONBOARDING_IDEMPOTENCY_STORAGE_KEY)).toBeNull();
  });

  it("clears legacy via setItem blank when removeItem is missing", () => {
    const map = new Map<string, string>([
      [ONBOARDING_IDEMPOTENCY_STORAGE_KEY, "legacy-only"],
    ]);
    const storage = {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => {
        map.set(k, v);
      },
    };
    const migrated = getOrCreateOnboardingIdempotencyKey("user-a", storage);
    expect(migrated).toBe("legacy-only");
    expect(storage.getItem(ONBOARDING_IDEMPOTENCY_STORAGE_KEY)).toBe("");
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

describe("rotateOnboardingIdempotencyKey — Add brand", () => {
  it("mints a new key even when a scoped key already exists", () => {
    const scoped = onboardingIdempotencyStorageKey("user-a");
    const storage = memoryStorage({ [scoped]: "old-session" });
    const rotated = rotateOnboardingIdempotencyKey("user-a", storage);
    expect(rotated).not.toBe("old-session");
    expect(storage.getItem(scoped)).toBe(rotated);
  });
});

describe("wantsFreshOnboardingSession", () => {
  it("detects ?new=1", () => {
    expect(wantsFreshOnboardingSession("?new=1")).toBe(true);
    expect(wantsFreshOnboardingSession("new=1")).toBe(true);
    expect(wantsFreshOnboardingSession("?new=0")).toBe(false);
    expect(wantsFreshOnboardingSession("")).toBe(false);
  });
});
