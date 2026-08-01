"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type CrawlPages = {
  pages_crawled: number | null;
  pages_found: number | null;
} | null;

/** UX phase — client never marks a run failed; only server `intake_status` does. */
export type AnalysisProgressPhase =
  | "live"
  | "still_working"
  | "connection_lost"
  | "failed"
  | "ready"
  | "idle";

export type BrandAnalysisProgress = {
  intakeStatus: string;
  crawl: CrawlPages;
  phase: AnalysisProgressPhase;
  /** Re-subscribe after CHANNEL_ERROR / TIMED_OUT. */
  reconnect: () => void;
};

export type UseBrandAnalysisProgressOptions = {
  brandId: string;
  initialStatus: string | null;
  initialCrawlPages?: CrawlPages;
  /** Quiet gap before "still working" (ms). Default 30s. */
  quietGapMs?: number;
  /** Called when intake reaches terminal `ready` (not scores_complete). */
  onReady?: () => void;
};

// ponytail: 30s quiet gap is a heuristic for crawl/AI stalls — upgrade to server
// heartbeat / updated_at freshness if operators see false "still working" during long Gemini runs.
const DEFAULT_QUIET_GAP_MS = 30_000;

/** Exported for unit tests — maps server + connection flags to UX phase. */
export function phaseForStatus(
  intakeStatus: string,
  connectionLost: boolean,
  stillWorking: boolean,
): AnalysisProgressPhase {
  if (intakeStatus === "failed") return "failed";
  if (intakeStatus === "ready") return "ready";
  if (intakeStatus === "draft_ready") return "idle";
  if (connectionLost) return "connection_lost";
  if (stillWorking) return "still_working";
  return "live";
}

export function useBrandAnalysisProgress({
  brandId,
  initialStatus,
  initialCrawlPages = null,
  quietGapMs = DEFAULT_QUIET_GAP_MS,
  onReady,
}: UseBrandAnalysisProgressOptions): BrandAnalysisProgress {
  const [intakeStatus, setIntakeStatus] = useState(initialStatus ?? "brand_created");
  const [crawl, setCrawl] = useState<CrawlPages>(initialCrawlPages);
  const [connectionLost, setConnectionLost] = useState(false);
  const [stillWorking, setStillWorking] = useState(false);
  const [reconnectTick, setReconnectTick] = useState(0);

  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const quietGapMsRef = useRef(quietGapMs);
  quietGapMsRef.current = quietGapMs;
  const quietTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearQuietTimer = useCallback(() => {
    if (quietTimerRef.current != null) {
      clearTimeout(quietTimerRef.current);
      quietTimerRef.current = null;
    }
  }, []);

  const bumpActivity = useCallback(() => {
    setStillWorking(false);
    clearQuietTimer();
    const gap = quietGapMsRef.current;
    // quietGapMs <= 0 disables the still-working heuristic (tests / opt-out).
    if (gap <= 0) return;
    quietTimerRef.current = setTimeout(() => {
      setStillWorking(true);
    }, gap);
  }, [clearQuietTimer]);

  useEffect(() => {
    setIntakeStatus(initialStatus ?? "brand_created");
  }, [initialStatus]);

  useEffect(() => {
    setCrawl(initialCrawlPages ?? null);
  }, [initialCrawlPages]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    setConnectionLost(false);
    bumpActivity();

    const channel = supabase
      .channel(`brand-progress-${brandId}-${reconnectTick}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "brands",
          filter: `id=eq.${brandId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          bumpActivity();
          const next = payload.new.intake_status as string;
          setIntakeStatus(next);
          // Terminal success is ready only — scores_complete is mid-pipeline, not success.
          if (next === "ready") {
            onReadyRef.current?.();
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "brand_crawls",
          filter: `brand_id=eq.${brandId}`,
        },
        (payload: { new: Record<string, unknown> | null }) => {
          const row = payload.new;
          if (!row) return;
          bumpActivity();
          setCrawl({
            pages_crawled: row.pages_crawled as number | null,
            pages_found: row.pages_found as number | null,
          });
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setConnectionLost(true);
          clearQuietTimer();
          setStillWorking(false);
          return;
        }
        if (status === "SUBSCRIBED") {
          setConnectionLost(false);
          bumpActivity();
        }
      });

    return () => {
      clearQuietTimer();
      supabase.removeChannel(channel);
    };
    // bumpActivity/clearQuietTimer are stable (empty/ref deps); omit to avoid re-subscribe churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reconnectTick + brandId own the lifecycle
  }, [brandId, reconnectTick]);

  const reconnect = useCallback(() => {
    setConnectionLost(false);
    setStillWorking(false);
    setReconnectTick((n) => n + 1);
  }, []);

  return {
    intakeStatus,
    crawl,
    phase: phaseForStatus(intakeStatus, connectionLost, stillWorking),
    reconnect,
  };
}
