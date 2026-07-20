/**
 * IPI-725 · AUTH-UI-001 — allowlisted client storage cleanup on Sign Out.
 *
 * Never call localStorage.clear() / sessionStorage.clear().
 * Never remove marketing lead keys (`ipix_anon_id`).
 *
 * IPI-634 will persist thread IDs under `ipix:copilot:thread:v1:…` —
 * clearing that prefix here means logout already clears them when they appear.
 */

/** Exact keys removed from localStorage + sessionStorage on Sign Out. */
export const OPERATOR_CLIENT_STORAGE_EXACT_KEYS = [
  // Reserved — prefer prefixes for versioned keys (IPI-634).
] as const;

/**
 * Prefixes removed from localStorage + sessionStorage on Sign Out.
 * Keep in sync with IPI-634 thread key: `ipix:copilot:thread:v1:{userId}:{agentId}:{host}`
 */
export const OPERATOR_CLIENT_STORAGE_PREFIXES = ["ipix:copilot:"] as const;

/** Keys that must survive Sign Out (marketing / public site). */
export const OPERATOR_CLIENT_STORAGE_NEVER = new Set(["ipix_anon_id"]);

function shouldRemoveKey(key: string): boolean {
  if (OPERATOR_CLIENT_STORAGE_NEVER.has(key)) return false;
  if ((OPERATOR_CLIENT_STORAGE_EXACT_KEYS as readonly string[]).includes(key)) {
    return true;
  }
  return OPERATOR_CLIENT_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function clearOneStorage(storage: Storage): string[] {
  const removed: string[] = [];
  // Snapshot keys first — Storage is live; mutating during iteration is unsafe.
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key != null) keys.push(key);
  }
  for (const key of keys) {
    if (!shouldRemoveKey(key)) continue;
    storage.removeItem(key);
    removed.push(key);
  }
  return removed;
}

/**
 * Remove allowlisted Operator/Copilot keys from both storages.
 * Safe in SSR / private browsing — no-ops when storage is unavailable.
 */
export function clearOperatorClientStorage(options?: {
  local?: Storage | null;
  session?: Storage | null;
}): { local: string[]; session: string[] } {
  const result = { local: [] as string[], session: [] as string[] };

  try {
    const local =
      options?.local !== undefined
        ? options.local
        : typeof localStorage !== "undefined"
          ? localStorage
          : null;
    if (local) result.local = clearOneStorage(local);
  } catch {
    // private browsing / blocked storage
  }

  try {
    const session =
      options?.session !== undefined
        ? options.session
        : typeof sessionStorage !== "undefined"
          ? sessionStorage
          : null;
    if (session) result.session = clearOneStorage(session);
  } catch {
    // private browsing / blocked storage
  }

  return result;
}
