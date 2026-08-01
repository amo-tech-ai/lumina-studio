"use client";

import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { formatCrawlProgressShort } from "@/lib/brand-hub/format-crawl-progress";
import { useBrandAnalysisProgress } from "@/lib/brand-hub/use-brand-analysis-progress";

type CrawlInfo = { pages_crawled: number | null; pages_found: number | null } | null;

export type AnalysisProgressBannerProps = {
  brandId: string;
  initialStatus: string | null;
  initialCrawlPages?: CrawlInfo;
  errorMessage?: string;
  /** Forwarded to the shared hook; `0` disables still-working (tests). */
  quietGapMs?: number;
};

const PROGRESS_MESSAGES: Record<string, string> = {
  brand_created: "Brand created — preparing analysis…",
  crawl_running: "Crawling website…",
  crawl_complete: "Crawl complete — starting AI analysis…",
  analysis_running: "Gemini is analysing brand profile…",
  scores_complete: "Scores ready — finishing up…",
};

export const AnalysisProgressBanner = ({
  brandId,
  initialStatus,
  initialCrawlPages,
  errorMessage,
  quietGapMs,
}: AnalysisProgressBannerProps) => {
  const router = useRouter();
  const { intakeStatus, crawl, phase, reconnect } = useBrandAnalysisProgress({
    brandId,
    initialStatus,
    initialCrawlPages,
    quietGapMs,
    onReady: () => router.refresh(),
  });

  // Terminal / handled-elsewhere — no banner
  if (phase === "ready" || phase === "idle") return null;

  if (phase === "failed") {
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

  if (phase === "connection_lost") {
    return (
      <div
        className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3"
        role="status"
        aria-live="polite"
      >
        <p className="font-sans text-sm font-medium text-[#92400E]">Connection lost</p>
        <p className="mt-1 font-sans text-xs text-[#92400E]">
          Analysis may still be running on the server. Reconnect to resume live progress.
        </p>
        <button
          type="button"
          onClick={reconnect}
          className="mt-2 font-sans text-xs font-medium text-[#D97706] underline underline-offset-2"
        >
          Reconnect
        </button>
      </div>
    );
  }

  const message =
    phase === "still_working"
      ? "Still working — analysis is taking longer than usual…"
      : (PROGRESS_MESSAGES[intakeStatus] ?? `Status: ${intakeStatus}`);
  const showCrawlCount =
    intakeStatus === "crawl_running" && crawl?.pages_crawled != null;

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
          {showCrawlCount && phase === "live" && (
            <span className="ml-1 text-[#D97706]">
              ({formatCrawlProgressShort(crawl!.pages_crawled!, crawl!.pages_found)})
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
