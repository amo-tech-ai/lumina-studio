/**
 * Pure allowlist sync helpers (unit-tested; used by groq-smoke.mjs).
 */

export function syncAllowlist(localIds, remoteIds) {
  const missingOnGroq = [...localIds].filter((id) => !remoteIds.has(id));
  const extraOnGroq = [...remoteIds].filter((id) => !localIds.has(id));
  return { missingOnGroq, extraOnGroq };
}

/** Groq catalog noise — informational extras only, not allowlist gaps. */
export function filterInformationalExtras(extraOnGroq) {
  return extraOnGroq.filter(
    (id) => !id.includes("whisper") && !id.includes("playai"),
  );
}
