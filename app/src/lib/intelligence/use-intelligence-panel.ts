"use client";

import { useCallback, useEffect, useState } from "react";
import type { IntelligencePanelData } from "./panel-contract";

type State = {
  data: IntelligencePanelData | null;
  loading: boolean;
  error: string | null;
};

const EMPTY: IntelligencePanelData = {
  brand: null,
  scores: null,
  approvals: { pendingCount: 0, items: [] },
};

export function useIntelligencePanel(activeBrandId: string | null) {
  const [state, setState] = useState<State>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchPanel = useCallback(async () => {
    const qs = activeBrandId ? `?brandId=${encodeURIComponent(activeBrandId)}` : "";
    const res = await fetch(`/api/intelligence/panel${qs}`, { cache: "no-store" });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? `Request failed (${res.status})`);
    }
    return (await res.json()) as IntelligencePanelData;
  }, [activeBrandId]);

  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
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
  }, [fetchPanel]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
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
  }, [fetchPanel]);

  useEffect(() => {
    let cancelled = false;
    const id = window.setInterval(() => {
      void fetchPanel()
        .then((data) => {
          if (!cancelled) setState({ data, loading: false, error: null });
        })
        .catch(() => undefined);
    }, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [fetchPanel]);

  return { ...state, reload };
}
