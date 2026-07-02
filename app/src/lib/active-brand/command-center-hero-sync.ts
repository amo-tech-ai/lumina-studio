"use client";

type HeroBrandSync = (heroBrandId: string | null) => void;

let heroBrandSync: HeroBrandSync | null = null;
/** Last hero id from CommandCenterBrandSync — replayed when shell registers late. */
let pendingHeroBrandId: string | null | undefined;

/** Registered by OperatorShell (must run inside ActiveBrandProvider). */
export function registerCommandCenterHeroBrandSync(fn: HeroBrandSync | null) {
  heroBrandSync = fn;
  if (fn && pendingHeroBrandId !== undefined) {
    fn(pendingHeroBrandId);
  }
}

/** Invoked from CommandCenterBrandSync after client mount — never during SSR. */
export function syncCommandCenterHeroBrand(heroBrandId: string | null) {
  pendingHeroBrandId = heroBrandId;
  heroBrandSync?.(heroBrandId);
}

/** @internal Vitest isolation only */
export function __resetCommandCenterHeroBrandSyncForTests() {
  heroBrandSync = null;
  pendingHeroBrandId = undefined;
}
