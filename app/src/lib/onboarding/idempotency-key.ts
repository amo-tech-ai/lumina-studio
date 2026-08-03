/** localStorage key for a stable browser idempotency token (IPI-835 · B1). */
export const ONBOARDING_IDEMPOTENCY_STORAGE_KEY = "ipix:onboarding:idempotency:v1";

/**
 * One UUID per browser until cleared (sign-out). Refresh resumes the same draft.
 */
export function getOrCreateOnboardingIdempotencyKey(
  storage: Pick<Storage, "getItem" | "setItem"> = localStorage,
): string {
  const existing = storage.getItem(ONBOARDING_IDEMPOTENCY_STORAGE_KEY);
  if (existing && existing.length > 0) return existing;
  const created = crypto.randomUUID();
  storage.setItem(ONBOARDING_IDEMPOTENCY_STORAGE_KEY, created);
  return created;
}
