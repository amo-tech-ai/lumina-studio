"use client";

import { useState } from "react";
import type {
  ActivityEvent,
  AiProfile,
  BrandHubTab,
  BrandIntakeStatus,
  BrandScoreDetail,
} from "@/lib/brand-hub";
import {
  BRAND_HUB_TABS,
  hubTabLabel,
  intakeStatusColor,
  intakeStatusLabel,
  isReAnalyzeDisabled,
} from "@/lib/brand-hub";
import { scoreColor } from "@/lib/brand-utils";
import { ActivityTab } from "@/components/brand-hub/activity-tab";
import { IntakeBanner } from "@/components/brand-hub/intake-banner";
import { OverviewTab } from "@/components/brand-hub/overview-tab";
import { ProfileTab } from "@/components/brand-hub/profile-tab";
import { ReAnalyzeButton } from "@/components/brand-hub/re-analyze-button";
import { ScoresTab } from "@/components/brand-hub/scores-tab";
import { cn } from "@/lib/utils";

export type BrandHubClientProps = {
  brandId: string;
  brandName: string;
  brandUrl: string | null;
  orgName?: string;
  orgPlan?: string;
  createdDate: string;
  intakeStatus: BrandIntakeStatus | string | null;
  dnaScore: number;
  profile: AiProfile;
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
  dnaScore,
  profile,
  displayScores,
  baseScores,
  activityEvents,
}: BrandHubClientProps) => {
  const [tab, setTab] = useState<BrandHubTab>("overview");
  const status = (intakeStatus ?? "brand_created") as BrandIntakeStatus;
  const reanalyzeDisabled = isReAnalyzeDisabled(status);

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

        <IntakeBanner status={status} errorMessage={profile._error} />

        <nav
          className="-mx-1 flex gap-1 overflow-x-auto border-b border-[#E8E0D8] pb-px"
          aria-label="Brand hub sections"
        >
          {BRAND_HUB_TABS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "shrink-0 rounded-t-lg px-4 py-2 font-sans text-sm transition-colors",
                tab === id
                  ? "border-b-2 border-[#E87C4D] font-medium text-[#1E293B]"
                  : "text-[#64748B] hover:text-[#1E293B]",
              )}
              aria-selected={tab === id}
              role="tab"
            >
              {hubTabLabel(id)}
            </button>
          ))}
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
        </nav>

        <section className="rounded-2xl border border-[#E8E0D8] bg-white p-6" role="tabpanel">
          {tab === "overview" && (
            <OverviewTab profile={profile} baseScores={baseScores} />
          )}
          {tab === "profile" && <ProfileTab profile={profile} />}
          {tab === "scores" && <ScoresTab scores={displayScores} />}
          {tab === "activity" && <ActivityTab events={activityEvents} />}
        </section>
      </div>
    </div>
  );
};
