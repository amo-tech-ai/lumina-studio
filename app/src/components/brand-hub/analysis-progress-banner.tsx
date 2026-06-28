"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type CrawlInfo = { pages_crawled: number | null; pages_found: number | null } | null;

export type AnalysisProgressBannerProps = {
  brandId: string;
  initialStatus: string | null;
  initialCrawlPages?: CrawlInfo;
  errorMessage?: string;
};

const PROGRESS_MESSAGES: Record<string, string> = {
  brand_created: "Brand created — preparing analysis…",
  crawl_running: "Crawling website…",
  crawl_complete: "Crawl complete — starting AI analysis…",
  analysis_running: "Gemini is analysing brand profile…",
  scores_complete: "Scores ready — refreshing…",
};

export const AnalysisProgressBanner = ({
  brandId,
  initialStatus,
  initialCrawlPages,
  errorMessage,
}: AnalysisProgressBannerProps) => {
  const [status, setStatus] = useState(initialStatus ?? "brand_created");
  const [crawl, setCrawl] = useState<CrawlInfo>(initialCrawlPages ?? null);
  const router = useRouter();

  // Sync when server re-renders with updated props (e.g. after router.refresh())
  useEffect(() => {
    setStatus(initialStatus ?? "brand_created");
  }, [initialStatus]);

  useEffect(() => {
    setCrawl(initialCrawlPages ?? null);
  }, [initialCrawlPages]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel(`brand-progress-${brandId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "brands",
          filter: `id=eq.${brandId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const next = payload.new.intake_status as string;
          setStatus(next);
          if (next === "ready" || next === "scores_complete") {
            router.refresh();
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
          if (row) {
            setCrawl({
              pages_crawled: row.pages_crawled as number | null,
              pages_found: row.pages_found as number | null,
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [brandId, router]);

  // Terminal / handled-elsewhere states — no banner
  if (status === "ready" || status === "draft_ready" || status === "scores_complete") return null;

  if (status === "failed") {
    return (
      <div
        className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3"
        role="alert"
        aria-live="assertive"
      >
        <p className="font-sans text-sm font-medium text-[#DC2626]">Analysis failed</p>
        <p className="mt-1 font-sans text-xs text-[#991B1B]">
          {errorMessage ?? "Use Re-analyze to retry. If this persists, contact support."}
        </p>
      </div>
    );
  }

  const message = PROGRESS_MESSAGES[status] ?? `Status: ${status}`;
  const showCrawlCount =
    status === "crawl_running" && crawl?.pages_crawled != null;

  return (
    <div
      className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <Loader2
          className="h-4 w-4 shrink-0 animate-spin text-[#D97706]"
          aria-hidden="true"
        />
        <p className="font-sans text-sm text-[#92400E]">
          {message}
          {showCrawlCount && (
            <span className="ml-1 text-[#D97706]">
              ({crawl!.pages_crawled} / {crawl!.pages_found ?? "?"} pages)
            </span>
          )}
        </p>
      </div>
      <div
        className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[#FDE68A]"
        role="progressbar"
        aria-label="Analysis in progress"
      >
        <div className="h-full w-1/3 animate-pulse rounded-full bg-[#D97706]" />
      </div>
    </div>
  );
};
