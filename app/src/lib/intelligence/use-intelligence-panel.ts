"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  DEV_INTELLIGENCE_PANEL_DATA,
  DEV_PORTFOLIO_PANEL_DATA,
  isDevSkipMode,
} from "./dev-panel-fixture";
import type { IntelligencePanelData } from "./panel-contract";

export type PanelFetchMode = "single" | "portfolio";

type State = {
  data: IntelligencePanelData | null;
  loading: boolean;
  error: string | null;
};

const EMPTY: IntelligencePanelData = {
  brand: null,
  scores: null,
  approvals: { pendingCount: 0, items: [] },
  portfolio: { brandCount: 0, avgDna: 0, healthRows: [], needsAttention: null },
};

export function useIntelligencePanel(
  activeBrandId: string | null,
  mode: PanelFetchMode = "single",
) {
  const searchParams = useSearchParams();
  const skip = searchParams.get("skip");
  const devFixture = isDevSkipMode(skip);
  const portfolioMode = mode === "portfolio";
  const canFetch = devFixture || portfolioMode || Boolean(activeBrandId);

  const devData = portfolioMode ? DEV_PORTFOLIO_PANEL_DATA : DEV_INTELLIGENCE_PANEL_DATA;

  const [state, setState] = useState<State>(() => {
    if (devFixture) {
      return { data: devData, loading: false, error: null };
    }
    if (!canFetch) {
      return { data: null, loading: false, error: null };
    }
    return { data: null, loading: true, error: null };
  });

  const fetchPanel = useCallback(async () => {
    if (devFixture) return devData;
    if (portfolioMode) {
      const res = await fetch("/api/intelligence/panel", { cache: "no-store", credentials: "same-origin" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      return (await res.json()) as IntelligencePanelData;
    }
    if (!activeBrandId) return EMPTY;

    const qs = `?brandId=${encodeURIComponent(activeBrandId)}`;
    const res = await fetch(`/api/intelligence/panel${qs}`, {
      cache: "no-store",
      credentials: "same-origin",
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? `Request failed (${res.status})`);
    }
    return (await res.json()) as IntelligencePanelData;
  }, [activeBrandId, devData, devFixture, portfolioMode]);

  const reload = useCallback(async () => {
    if (!canFetch) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    setState({ data: null, loading: true, error: null });
    try {
      const data = await fetchPanel();
      setState({ data, loading: false, error: null });
    } catch (e) {
      setState({
        data: EMPTY,
        loading: false,
        error: e instanceof Error ? e.message : "Failed to load intelligence data",
      });
    }
  }, [canFetch, fetchPanel, portfolioMode]);

  useEffect(() => {
    if (devFixture) {
      setState({ data: devData, loading: false, error: null });
      return;
    }
    if (!canFetch) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    let cancelled = false;
    void (async () => {
      setState({ data: null, loading: true, error: null });
      try {
        const data = await fetchPanel();
        if (!cancelled) setState({ data, loading: false, error: null });
      } catch (e) {
        if (!cancelled) {
          setState({
            data: EMPTY,
            loading: false,
            error: e instanceof Error ? e.message : "Failed to load intelligence data",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchPanel, devFixture, devData, canFetch]);

  useEffect(() => {
    if (!canFetch || devFixture) return;

    let cancelled = false;
    let timeoutId = 0;

    const poll = async () => {
      if (cancelled) return;
      try {
        const data = await fetchPanel();
        if (!cancelled) setState({ data, loading: false, error: null });
      } catch {
        // ignore transient poll errors
      }
      if (!cancelled) {
        timeoutId = window.setTimeout(() => void poll(), 30_000);
      }
    };

    timeoutId = window.setTimeout(() => void poll(), 30_000);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [fetchPanel, devFixture, canFetch]);

  return { ...state, reload };
}
