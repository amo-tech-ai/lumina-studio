"use client";

type HeroBrandSync = (heroBrandId: string | null) => void;

let heroBrandSync: HeroBrandSync | null = null;

/** Registered by OperatorShell (must run inside ActiveBrandProvider). */
export function registerCommandCenterHeroBrandSync(fn: HeroBrandSync | null) {
  heroBrandSync = fn;
}

/** Invoked from CommandCenterBrandSync after client mount — never during SSR. */
export function syncCommandCenterHeroBrand(heroBrandId: string | null) {
  heroBrandSync?.(heroBrandId);
}
