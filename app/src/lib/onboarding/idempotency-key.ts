/** Legacy browser-global key (pre–IPI-945). Cleared when a user-scoped key is minted. */
export const ONBOARDING_IDEMPOTENCY_STORAGE_KEY = "ipix:onboarding:idempotency:v1";

/** Prefix for per-user keys: `ipix:onboarding:idempotency:v1:{userId}` (IPI-945). */
export const ONBOARDING_IDEMPOTENCY_STORAGE_PREFIX = `${ONBOARDING_IDEMPOTENCY_STORAGE_KEY}:`;

export function onboardingIdempotencyStorageKey(userId: string): string {
  return `${ONBOARDING_IDEMPOTENCY_STORAGE_PREFIX}${userId}`;
}

type IdempotencyStorage = Pick<Storage, "getItem" | "setItem"> &
  Partial<Pick<Storage, "removeItem">>;

/**
 * One UUID per signed-in user until Sign Out clears `ipix:onboarding:` (IPI-725).
 * Refresh resumes the same draft for that user only — not a shared browser token.
 */
export function getOrCreateOnboardingIdempotencyKey(
  userId: string,
  storage: IdempotencyStorage = localStorage,
): string {
  if (!userId.trim()) {
    throw new Error("onboarding idempotency key requires a user id");
  }

  // Drop the pre-IPI-945 global key so a prior account cannot share a token.
  try {
    storage.removeItem?.(ONBOARDING_IDEMPOTENCY_STORAGE_KEY);
  } catch {
    // private browsing / blocked storage
  }

  const storageKey = onboardingIdempotencyStorageKey(userId);
  const existing = storage.getItem(storageKey);
  if (existing && existing.length > 0) return existing;
  const created = crypto.randomUUID();
  storage.setItem(storageKey, created);
  return created;
}
