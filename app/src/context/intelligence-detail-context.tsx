"use client";

// IPI-308 · MODEL-P2 — minimal bridge letting a page inject content into the
// shared IntelligencePanel (e.g. EvidenceBlock for a selected TalentCard).
// IntelligencePanel is rendered by the layout-level OperatorShell, siblings
// to the page's own {children} slot — this context is the smallest additive
// way to let a page reach it without threading props through the shell.
// Backward compatible: when no page sets detail content, IntelligencePanel
// falls back to its existing brand-briefing behavior unchanged.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type IntelligenceDetailContextValue = {
  detail: ReactNode | null;
  setDetail: (node: ReactNode | null) => void;
};

const IntelligenceDetailContext = createContext<IntelligenceDetailContextValue | null>(null);

export function IntelligenceDetailProvider({ children }: { children: ReactNode }) {
  const [detail, setDetail] = useState<ReactNode | null>(null);
  const value = useMemo(() => ({ detail, setDetail }), [detail]);
  return (
    <IntelligenceDetailContext.Provider value={value}>
      {children}
    </IntelligenceDetailContext.Provider>
  );
}

export function useIntelligenceDetail() {
  const ctx = useContext(IntelligenceDetailContext);
  if (!ctx) {
    throw new Error("useIntelligenceDetail must be used within IntelligenceDetailProvider");
  }
  return ctx;
}

/** Page-level helper: set detail content while mounted, clear on unmount/change. */
export function useSetIntelligenceDetail(node: ReactNode | null) {
  const { setDetail } = useIntelligenceDetail();
  const stableSetDetail = useCallback(setDetail, [setDetail]);
  useEffect(() => {
    stableSetDetail(node);
    return () => stableSetDetail(null);
  }, [node, stableSetDetail]);
}
