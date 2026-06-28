"use client";

import { useState, type KeyboardEvent } from "react";
import type {
  ActivityEvent,
  AiProfile,
  BrandHubTab,
  BrandIntakeStatus,
  BrandScoreDetail,
} from "@/lib/brand-hub";
import {
  BRAND_HUB_TABS,
  BRAND_HUB_TABPANEL_ID,
  brandHubTabId,
  hubTabLabel,
  intakeStatusColor,
  intakeStatusLabel,
  isReAnalyzeDisabled,
} from "@/lib/brand-hub";
import { scoreColor } from "@/lib/brand-utils";
import { ActivityTab } from "@/components/brand-hub/activity-tab";
import { AnalysisProgressBanner } from "@/components/brand-hub/analysis-progress-banner";
import { OverviewTab } from "@/components/brand-hub/overview-tab";
import { ProfileTab } from "@/components/brand-hub/profile-tab";
import { ReAnalyzeButton } from "@/components/brand-hub/re-analyze-button";
import { ScoresTab } from "@/components/brand-hub/scores-tab";
import { cn } from "@/lib/utils";
import { useBrandContext } from "@/components/brand-hub/brand-context";
import { ApprovalCard } from "@/components/brand-hub/approval-card";
import { DraftBanner } from "@/components/brand-hub/draft-banner";

export type BrandHubClientProps = {
  brandId: string;
  brandName: string;
  brandUrl: string | null;
  orgName?: string;
  orgPlan?: string;
  createdDate: string;
  intakeStatus: BrandIntakeStatus | string | null;
  crawlPages?: { pages_crawled: number | null; pages_found: number | null } | null;
  dnaScore: number;
  profile: AiProfile;
  draftProfile: AiProfile | null;
  draftScores?: BrandScoreDetail[];
  workflowRunId?: string | null;
  displayScores: BrandScoreDetail[];
  baseScores: BrandScoreDetail[];
  activityEvents: ActivityEvent[];
};

const SOON_TABS = ["Products", "Competitors"] as const;

export const BrandHubClient = ({
  brandId,
  brandName,
  brandUrl,
  orgName,
  orgPlan,
  createdDate,
  intakeStatus,
  crawlPages,
  dnaScore,
  profile,
  draftProfile,
  draftScores = [],
  workflowRunId,
  displayScores,
  baseScores,
  activityEvents,
}: BrandHubClientProps) => {
  const [tab, setTab] = useState<BrandHubTab>("overview");
  const status = (intakeStatus ?? "brand_created") as BrandIntakeStatus;
  const reanalyzeDisabled = isReAnalyzeDisabled(status);

  useBrandContext({ brandId, brandName, intakeStatus: intakeStatus ?? null, profile, scores: displayScores });

  const focusTab = (id: BrandHubTab) => {
    setTab(id);
    requestAnimationFrame(() => {
      document.getElementById(brandHubTabId(id))?.focus();
    });
  };

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, current: BrandHubTab) => {
    const index = BRAND_HUB_TABS.indexOf(current);
    if (index === -1) return;

    let next: BrandHubTab | null = null;
    if (event.key === "ArrowRight") {
      next = BRAND_HUB_TABS[(index + 1) % BRAND_HUB_TABS.length];
    } else if (event.key === "ArrowLeft") {
      next = BRAND_HUB_TABS[(index - 1 + BRAND_HUB_TABS.length) % BRAND_HUB_TABS.length];
    } else if (event.key === "Home") {
      next = BRAND_HUB_TABS[0];
    } else if (event.key === "End") {
      next = BRAND_HUB_TABS[BRAND_HUB_TABS.length - 1];
    }

    if (next) {
      event.preventDefault();
      focusTab(next);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FBF8F5" }}>
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-3xl text-[#1E293B] sm:text-4xl">{brandName}</h1>
            {orgName && (
              <p className="mt-1 font-sans text-[#64748B]">
                {orgName}
                {orgPlan ? ` · ${orgPlan}` : ""}
              </p>
            )}
            {brandUrl && /^https?:\/\//.test(brandUrl) && (
              <a
                href={brandUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 block truncate font-sans text-xs text-[#E87C4D] hover:underline"
              >
                {brandUrl}
              </a>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-2 py-0.5 font-sans text-[10px] font-medium uppercase tracking-wide text-white"
                style={{ background: intakeStatusColor(status) }}
              >
                {intakeStatusLabel(status)}
              </span>
              <span className="font-sans text-xs text-[#94A3B8]">Created {createdDate}</span>
            </div>
          </div>

          <div className="flex shrink-0 items-start gap-4">
            <div className="text-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full font-sans text-lg font-semibold text-white"
                style={{ background: scoreColor(dnaScore) }}
              >
                {dnaScore}
              </div>
              <p className="mt-1 font-sans text-xs text-[#64748B]">DNA Score</p>
            </div>
            <ReAnalyzeButton brandId={brandId} disabled={reanalyzeDisabled} />
          </div>
        </header>

        <AnalysisProgressBanner
          brandId={brandId}
          initialStatus={status}
          initialCrawlPages={crawlPages}
          errorMessage={profile._error}
        />
        {intakeStatus === "draft_ready" && draftProfile && (
          workflowRunId
            ? <ApprovalCard brandId={brandId} runId={workflowRunId} draft={draftProfile} draftScores={draftScores} liveScores={displayScores} />
            : <DraftBanner brandId={brandId} draft={draftProfile} />
        )}

        <div className="-mx-1 flex gap-1 overflow-x-auto border-b border-[#E8E0D8] pb-px">
          <nav
            className="flex gap-1"
            aria-label="Brand hub sections"
            role="tablist"
          >
            {BRAND_HUB_TABS.map((id) => (
              <button
                key={id}
                type="button"
                id={brandHubTabId(id)}
                onClick={() => setTab(id)}
                onKeyDown={(event) => onTabKeyDown(event, id)}
                className={cn(
                  "shrink-0 rounded-t-lg px-4 py-2 font-sans text-sm transition-colors",
                  tab === id
                    ? "border-b-2 border-[#E87C4D] font-medium text-[#1E293B]"
                    : "text-[#64748B] hover:text-[#1E293B]",
                )}
                role="tab"
                aria-selected={tab === id}
                aria-controls={BRAND_HUB_TABPANEL_ID}
                tabIndex={tab === id ? 0 : -1}
              >
                {hubTabLabel(id)}
              </button>
            ))}
          </nav>
          {SOON_TABS.map((label) => (
            <span
              key={label}
              className="shrink-0 cursor-not-allowed px-4 py-2 font-sans text-sm text-[#CBD5E1]"
              title="Coming soon"
            >
              {label}
              <span className="ml-1 text-[10px]">Soon</span>
            </span>
          ))}
        </div>

        <section
          id={BRAND_HUB_TABPANEL_ID}
          className="rounded-2xl border border-[#E8E0D8] bg-white p-6"
          role="tabpanel"
          aria-labelledby={brandHubTabId(tab)}
        >
          {tab === "overview" && (
            <OverviewTab profile={profile} baseScores={baseScores} />
          )}
          {tab === "profile" && <ProfileTab profile={profile} />}
          {tab === "scores" && <ScoresTab scores={displayScores} citations={profile.evidenceSources} />}
          {tab === "activity" && <ActivityTab events={activityEvents} />}
        </section>
      </div>
    </div>
  );
};
