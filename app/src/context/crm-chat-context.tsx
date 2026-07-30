"use client";

// IPI-374 — bridge from CRM workspaces to OperatorShell welcome/suggestions.
// Provider lives in OperatorPanel (parent); CRM pages call useSetCrmChatContext
// while mounted — same pattern as IntelligenceDetailProvider.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/** Fields shared by useRouteWelcome / useRouteSuggestions CRM branches. */
export type CrmChatContextValue = {
  companyCount?: number;
  openDealsCount?: number;
  companyName?: string;
  dealStage?: string;
  lastActivityDays?: number;
  contactCount?: number;
  contactName?: string;
  pipelineValue?: string;
  atRiskCount?: number;
  dealName?: string;
  value?: string;
  /** Detail record loaded — enables richer suggestion chips on record routes. */
  crmRecordLoaded?: boolean;
};

type CrmChatContextState = {
  value: CrmChatContextValue;
  setValue: (next: CrmChatContextValue) => void;
};

const CrmChatContext = createContext<CrmChatContextState | null>(null);

export function CrmChatProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<CrmChatContextValue>({});
  const state = useMemo(() => ({ value, setValue }), [value]);
  return <CrmChatContext.Provider value={state}>{children}</CrmChatContext.Provider>;
}

export function useCrmChatContext(): CrmChatContextValue {
  return useContext(CrmChatContext)?.value ?? {};
}

/** Page-level helper: publish CRM chat context while mounted, clear on unmount. */
export function useSetCrmChatContext(next: CrmChatContextValue) {
  const ctx = useContext(CrmChatContext);
  const setValue = ctx?.setValue;
  const stableSetValue = useCallback(
    (v: CrmChatContextValue) => setValue?.(v),
    [setValue],
  );

  useEffect(() => {
    if (!setValue) return;
    stableSetValue(next);
    return () => stableSetValue({});
  }, [next, setValue, stableSetValue]);
}
