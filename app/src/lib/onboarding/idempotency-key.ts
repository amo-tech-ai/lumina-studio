/** Legacy browser-global key (pre–IPI-945). Migrated into a user-scoped slot, then cleared. */
export const ONBOARDING_IDEMPOTENCY_STORAGE_KEY = "ipix:onboarding:idempotency:v1";

/** Prefix for per-user keys: `ipix:onboarding:idempotency:v1:{userId}` (IPI-945). */
export const ONBOARDING_IDEMPOTENCY_STORAGE_PREFIX = `${ONBOARDING_IDEMPOTENCY_STORAGE_KEY}:`;

/** Query flag for explicit “Add brand” — rotate key so a completed session is not resumed. */
export const ONBOARDING_FRESH_QUERY_PARAM = "new";
export const ONBOARDING_FRESH_QUERY_VALUE = "1";

export function onboardingIdempotencyStorageKey(userId: string): string {
  return `${ONBOARDING_IDEMPOTENCY_STORAGE_PREFIX}${userId}`;
}

type IdempotencyStorage = Pick<Storage, "getItem" | "setItem"> &
  Partial<Pick<Storage, "removeItem">>;

function clearLegacyIdempotencyKey(storage: IdempotencyStorage): void {
  try {
    if (typeof storage.removeItem === "function") {
      storage.removeItem(ONBOARDING_IDEMPOTENCY_STORAGE_KEY);
      return;
    }
    // Some mocks / private modes omit removeItem — blank so getItem is not a usable UUID.
    storage.setItem(ONBOARDING_IDEMPOTENCY_STORAGE_KEY, "");
  } catch {
    // private browsing / blocked storage
  }
}

function readStoredKey(storage: IdempotencyStorage, key: string): string | null {
  const value = storage.getItem(key);
  if (!value || value.length === 0) return null;
  return value;
}

/**
 * One UUID per signed-in user until Sign Out clears `ipix:onboarding:` (IPI-725)
 * or `rotateOnboardingIdempotencyKey` mints a new one for Add brand (IPI-945).
 * Refresh resumes the same draft for that user only — not a shared browser token.
 */
export function getOrCreateOnboardingIdempotencyKey(
  userId: string,
  storage: IdempotencyStorage = localStorage,
): string {
  if (!userId.trim()) {
    throw new Error("onboarding idempotency key requires a user id");
  }

  const storageKey = onboardingIdempotencyStorageKey(userId);
  const existing = readStoredKey(storage, storageKey);
  if (existing) {
    clearLegacyIdempotencyKey(storage);
    return existing;
  }

  // First load after IPI-945: keep an in-progress draft keyed only by the legacy UUID.
  const legacy = readStoredKey(storage, ONBOARDING_IDEMPOTENCY_STORAGE_KEY);
  if (legacy) {
    storage.setItem(storageKey, legacy);
    clearLegacyIdempotencyKey(storage);
    return legacy;
  }

  const created = crypto.randomUUID();
  storage.setItem(storageKey, created);
  clearLegacyIdempotencyKey(storage);
  return created;
}

/**
 * Mint a new per-user key so `getOrCreateOnboardingSession` opens a blank draft.
 * Used when the operator already has a brand and clicks Add brand (`?new=1`).
 */
export function rotateOnboardingIdempotencyKey(
  userId: string,
  storage: IdempotencyStorage = localStorage,
): string {
  if (!userId.trim()) {
    throw new Error("onboarding idempotency key requires a user id");
  }

  const created = crypto.randomUUID();
  storage.setItem(onboardingIdempotencyStorageKey(userId), created);
  clearLegacyIdempotencyKey(storage);
  return created;
}

/** True when `/onboarding?new=1` (explicit Add brand). Zero-brand `/app` redirect omits this. */
export function wantsFreshOnboardingSession(
  search: string = typeof window !== "undefined" ? window.location.search : "",
): boolean {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  return params.get(ONBOARDING_FRESH_QUERY_PARAM) === ONBOARDING_FRESH_QUERY_VALUE;
}

/** Drop `?new=1` after bootstrap so refresh does not rotate again. */
export function stripFreshOnboardingQueryFromUrl(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has(ONBOARDING_FRESH_QUERY_PARAM)) return;
  url.searchParams.delete(ONBOARDING_FRESH_QUERY_PARAM);
  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(window.history.state, "", next);
}
