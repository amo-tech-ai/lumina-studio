"use client";

type HeroBrandSync = (heroBrandId: string | null) => void;

const heroBrandSyncListeners = new Set<HeroBrandSync>();
/** Last hero id from CommandCenterBrandSync — replayed when shell registers late. */
let pendingHeroBrandId: string | null | undefined;

/** Registered by OperatorShell (must run inside ActiveBrandProvider). Returns unsubscribe. */
export function registerCommandCenterHeroBrandSync(fn: HeroBrandSync | null): () => void {
  if (fn === null) {
    return () => {};
  }
  heroBrandSyncListeners.add(fn);
  if (pendingHeroBrandId !== undefined) {
    fn(pendingHeroBrandId);
  }
  return () => {
    heroBrandSyncListeners.delete(fn);
  };
}

/** Invoked from CommandCenterBrandSync after client mount — never during SSR. */
export function syncCommandCenterHeroBrand(heroBrandId: string | null) {
  pendingHeroBrandId = heroBrandId;
  for (const fn of heroBrandSyncListeners) {
    fn(heroBrandId);
  }
}

/** @internal Vitest isolation only */
export function __resetCommandCenterHeroBrandSyncForTests() {
  heroBrandSyncListeners.clear();
  pendingHeroBrandId = undefined;
}
