"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

/**
 * IPI-921 · AGENT-CTX-001 — actual shoot-page load state, shared between the
 * shoot detail workspace (which knows the fetch result) and the operator shell
 * (which previously derived "shootLoaded" from the URL path alone, so a 404/500
 * still advertised loaded-shoot actions). The workspace reports `loaded` /
 * `failed`; consumers key off the real payload state instead of the pathname.
 */
export type ShootLoadState = { loaded: boolean; failed: boolean };

export const IDLE_SHOOT_LOAD_STATE: ShootLoadState = { loaded: false, failed: false };

const ShootLoadStateContext = createContext<{
  shootLoad: ShootLoadState;
  setShootLoad: (next: ShootLoadState) => void;
} | null>(null);

export function ShootLoadStateProvider({ children }: { children: ReactNode }) {
  const [shootLoad, setShootLoadState] = useState<ShootLoadState>(IDLE_SHOOT_LOAD_STATE);
  const setShootLoad = useCallback((next: ShootLoadState) => setShootLoadState(next), []);
  const value = useMemo(() => ({ shootLoad, setShootLoad }), [shootLoad, setShootLoad]);
  return (
    <ShootLoadStateContext.Provider value={value}>{children}</ShootLoadStateContext.Provider>
  );
}

export function useShootLoadState() {
  const ctx = useContext(ShootLoadStateContext);
  if (!ctx) {
    throw new Error("useShootLoadState must be used within ShootLoadStateProvider");
  }
  return ctx;
}
