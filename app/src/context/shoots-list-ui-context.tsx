"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ShootsListUiState = {
  total: number;
  inProduction: number;
  selected: { id: string; name: string; brandName: string | null } | null;
};

type ShootsListUiContextValue = {
  state: ShootsListUiState | null;
  setState: (state: ShootsListUiState | null) => void;
};

const ShootsListUiContext = createContext<ShootsListUiContextValue | null>(null);

function shootsListUiEqual(
  a: ShootsListUiState | null,
  b: ShootsListUiState | null,
): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (a.total !== b.total || a.inProduction !== b.inProduction) return false;
  const as = a.selected;
  const bs = b.selected;
  if (as == null || bs == null) return as === bs;
  return as.id === bs.id && as.name === bs.name && as.brandName === bs.brandName;
}

export function ShootsListUiProvider({ children }: { children: ReactNode }) {
  const [state, setStateRaw] = useState<ShootsListUiState | null>(null);
  const setState = useCallback((next: ShootsListUiState | null) => {
    setStateRaw((prev) => (shootsListUiEqual(prev, next) ? prev : next));
  }, []);
  const value = useMemo(() => ({ state, setState }), [state, setState]);
  return <ShootsListUiContext.Provider value={value}>{children}</ShootsListUiContext.Provider>;
}

export function useShootsListUiState() {
  const ctx = useContext(ShootsListUiContext);
  return ctx?.state ?? null;
}

/** Page bridge — publish shoots list UI stats to the operator shell while mounted. */
export function usePublishShootsListUi(next: ShootsListUiState | null) {
  const ctx = useContext(ShootsListUiContext);
  const setStateRef = useRef(ctx?.setState);
  setStateRef.current = ctx?.setState;

  useEffect(() => {
    setStateRef.current?.(next);
    return () => setStateRef.current?.(null);
  }, [next]);
}
