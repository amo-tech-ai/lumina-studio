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
  /**
   * Refresh server-rendered parents when intake hits a layout-changing status.
   * UX success remains `phase === "ready"` only — this is not a success signal.
   */
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
    bumpActivity();
  }, [initialStatus, bumpActivity]);

  const crawlCrawled = initialCrawlPages?.pages_crawled ?? null;
  const crawlFound = initialCrawlPages?.pages_found ?? null;

  useEffect(() => {
    setCrawl(
      crawlCrawled == null && crawlFound == null
        ? null
        : { pages_crawled: crawlCrawled, pages_found: crawlFound },
    );
    // Server prop refresh is activity too — reset quiet-gap (counts already update via setCrawl).
    bumpActivity();
    // Depend on primitives so a new object identity with the same counts does not reset Realtime.
  }, [crawlCrawled, crawlFound, bumpActivity]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let active = true;
    setConnectionLost(false);
    bumpActivity();

    const notifyLayoutRefresh = (next: string) => {
      // Layout-changing statuses — not the same as UX "success" (ready only).
      if (
        next === "ready" ||
        next === "failed" ||
        next === "draft_ready" ||
        next === "scores_complete"
      ) {
        onReadyRef.current?.();
      }
    };

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
          if (!active) return;
          bumpActivity();
          const next = payload.new.intake_status as string;
          setIntakeStatus(next);
          notifyLayoutRefresh(next);
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
          if (!active) return;
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
        if (!active) return;
        if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          setConnectionLost(true);
          clearQuietTimer();
          setStillWorking(false);
          return;
        }
        if (status === "SUBSCRIBED") {
          setConnectionLost(false);
          bumpActivity();
          // Missed postgres_changes while disconnected — re-read current intake.
          void supabase
            .from("brands")
            .select("intake_status")
            .eq("id", brandId)
            .maybeSingle()
            .then(({ data }) => {
              if (!active) return;
              const next = data?.intake_status;
              if (typeof next !== "string") return;
              setIntakeStatus(next);
              notifyLayoutRefresh(next);
            });
        }
      });

    return () => {
      active = false;
      clearQuietTimer();
      supabase.removeChannel(channel);
    };
  }, [brandId, reconnectTick, bumpActivity, clearQuietTimer]);

  // After reconnect: show live (not still_working). Quiet gap restarts on SUBSCRIBED.
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
