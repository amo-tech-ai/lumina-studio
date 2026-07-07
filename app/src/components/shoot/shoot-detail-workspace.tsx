"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronRight, MoreHorizontal, Share2, WifiOff } from "lucide-react";

import { isDeliverableCover } from "@/lib/cloudinary/url";
import { shootStatusDotToken, shootStatusLabel } from "@/lib/shoot-list-filters";
import { shootListCoverForShoot } from "@/lib/command-center/sample-images";
import type { ShootDetailPayload } from "@/lib/shoot/get-shoot-detail";
import { crewInitials, formatShootDate } from "./shoot-detail-format";
import { OverviewTab } from "./shoot-detail-tabs/overview-tab";
import { ShotsTab } from "./shoot-detail-tabs/shots-tab";
import { AssetsTab } from "./shoot-detail-tabs/assets-tab";
import { TeamTab } from "./shoot-detail-tabs/team-tab";
import { ScheduleTab } from "./shoot-detail-tabs/schedule-tab";
import { BudgetTab } from "./shoot-detail-tabs/budget-tab";
import { ApprovalsTab } from "./shoot-detail-tabs/approvals-tab";
import { DeliverablesTab } from "./shoot-detail-tabs/deliverables-tab";
import { ActivityTab } from "./shoot-detail-tabs/activity-tab";
import styles from "./shoot-detail.module.css";

const TAB_IDS = [
  "overview",
  "shots",
  "assets",
  "team",
  "schedule",
  "budget",
  "approvals",
  "deliverables",
  "activity",
] as const;

type TabId = (typeof TAB_IDS)[number];

const TAB_LABELS: Record<TabId, string> = {
  overview: "Overview",
  shots: "Shot List",
  assets: "Assets",
  team: "Team",
  schedule: "Schedule",
  budget: "Budget",
  approvals: "Approvals",
  deliverables: "Deliverables",
  activity: "Activity",
};

type Props = {
  data: ShootDetailPayload | null;
  fetchError: string | null;
};

/** Shoot Detail workspace — ported from Shoot Detail.v2.image-first.dc.html
 *  (flow=shoot only). Composes the 9 per-tab components; this file owns the
 *  hero, tab strip, and error/empty branching only. */
export function ShootDetailWorkspace({ data, fetchError }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("overview");

  if (fetchError || !data) {
    return (
      <div className={styles.stateRoot}>
        <WifiOff size={28} strokeWidth={1.7} color="var(--color-text-muted)" aria-hidden />
        <p style={{ margin: 0, fontSize: "var(--fs-base)", fontWeight: 600 }}>Couldn&apos;t load this shoot</p>
        <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--color-text-secondary)" }}>
          {fetchError ?? "Something went wrong."}
        </p>
        <button
          type="button"
          onClick={() => router.refresh()}
          className={styles.secondaryBtn}
          style={{ marginTop: 6 }}
        >
          Try again
        </button>
      </div>
    );
  }

  const { shoot, brand, deliverables, shots, assets, crew, approvals, activity } = data;
  const shotsDone = shots.filter((s) => s.status !== "pending").length;
  const progressPct = shots.length > 0 ? Math.round((shotsDone / shots.length) * 100) : 0;
  const confirmedCrew = crew.filter((c) => c.confirmed).slice(0, 4);

  // DC wsEmpty — a shoot with no shots yet swaps the whole workspace, not just the Shots tab.
  if (shots.length === 0) {
    return (
      <div className={styles.root}>
        <div className={styles.header}>
          <div className={styles.headerInner}>
            <Breadcrumb name={shoot.name} />
          </div>
        </div>
        <div className={styles.stateRoot}>
          <div className={styles.hero} style={{ width: 200, aspectRatio: "16/10", flexShrink: 0 }}>
            <ShootCover coverUrl={shoot.cover_url} shootId={shoot.id} sizes="200px" />
          </div>
          <h2 style={{ margin: "20px 0 0", fontSize: "var(--fs-xl)", fontWeight: 600 }}>{shoot.name} — no shots yet</h2>
          <p style={{ margin: "8px 0 0", maxWidth: 440, fontSize: "var(--fs-sm)", color: "var(--color-text-secondary)", lineHeight: 1.55 }}>
            This shoot is created but the shot list is empty. Production Planner can build a full shot list, schedule, and
            deliverables from {brand.name}&apos;s Brand DNA.
          </p>
          <button
            type="button"
            disabled
            title="Coming soon — Production Planner agent wiring is Phase 2"
            className={styles.secondaryBtn}
            style={{ marginTop: 18, background: "var(--color-action)", color: "var(--color-action-text)", border: "none" }}
          >
            Generate shot list
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <Breadcrumb name={shoot.name} />

          <div className={styles.hero}>
            <ShootCover coverUrl={shoot.cover_url} shootId={shoot.id} sizes="960px" priority />
            <span className={styles.heroScrim} aria-hidden />
            <div className={styles.heroContent}>
              <div style={{ minWidth: 0 }}>
                <div className={styles.heroBadgeRow}>
                  <span className={styles.heroBadge}>
                    <span className={styles.heroBadgeDot} style={{ background: shootStatusDotToken(shoot.status) }} />
                    {shootStatusLabel(shoot.status)}
                  </span>
                  <span className={`${styles.heroBadge} ${styles.mono}`}>DNA {shoot.dna_score ?? "—"}</span>
                </div>
                <h1 className={styles.heroTitle}>{shoot.name}</h1>
                <div className={styles.heroMeta}>
                  <span>{brand.name}</span>
                  <span className={styles.heroMetaDivider}>·</span>
                  <span className={styles.mono}>{formatShootDate(shoot.start_date)}</span>
                </div>
              </div>
              {confirmedCrew.length > 0 ? (
                <div className={styles.heroTeam}>
                  {confirmedCrew.map((m) => (
                    <span key={m.id} className={styles.heroTeamAvatar} style={{ background: "var(--color-action)" }}>
                      {crewInitials(m.role)}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className={styles.titleRow}>
            <div className={styles.progress}>
              <div className={styles.progressLabelRow}>
                <span className={styles.progressLabel}>Progress</span>
                <span className={`${styles.mono} ${styles.progressValue}`}>
                  {shotsDone}/{shots.length} shots
                </span>
              </div>
              <div className={styles.progressTrack}>
                <span className={styles.progressFill} style={{ width: `${progressPct}%` }} />
              </div>
            </div>
            <div className={styles.actions}>
              <button
                type="button"
                disabled
                title="Coming soon"
                className={styles.secondaryBtn}
                style={{ background: "var(--color-action)", color: "var(--color-action-text)", border: "none" }}
              >
                Edit shoot
              </button>
              <button type="button" disabled title="Coming soon" aria-label="Share" className={styles.actionIconBtn}>
                <Share2 size={16} aria-hidden />
              </button>
              <button type="button" disabled title="Coming soon" aria-label="More options" className={styles.actionIconBtn}>
                <MoreHorizontal size={18} aria-hidden />
              </button>
            </div>
          </div>

          <div className={styles.tabRow} role="tablist">
            {TAB_IDS.map((id) => (
              <button
                key={id}
                id={`shoot-detail-tab-${id}`}
                type="button"
                role="tab"
                aria-selected={tab === id}
                aria-controls="shoot-detail-tabpanel"
                onClick={() => setTab(id)}
                className={tab === id ? `${styles.tab} ${styles.tabActive}` : styles.tab}
              >
                {TAB_LABELS[id]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.bodyInner}>
          <div
            id="shoot-detail-tabpanel"
            role="tabpanel"
            aria-labelledby={`shoot-detail-tab-${tab}`}
            className={styles.bodyMax}
          >
            {tab === "overview" ? <OverviewTab data={data} /> : null}
            {tab === "shots" ? <ShotsTab shots={shots} /> : null}
            {tab === "assets" ? <AssetsTab assets={assets} /> : null}
            {tab === "team" ? <TeamTab crew={crew} /> : null}
            {tab === "schedule" ? <ScheduleTab shoot={shoot} /> : null}
            {tab === "budget" ? <BudgetTab shoot={shoot} /> : null}
            {tab === "approvals" ? <ApprovalsTab approvals={approvals} /> : null}
            {tab === "deliverables" ? <DeliverablesTab deliverables={deliverables} /> : null}
            {tab === "activity" ? <ActivityTab activity={activity} /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Shared by both hero render sites (populated + wsEmpty). Three real states:
 *  a deliverable Cloudinary cover (optimized), a real but off-cloud cover URL
 *  (plain <img> — next/image throws on disallowed hosts, mood_board_urls is
 *  free-form), or no cover at all (decorative fallback, only case that uses
 *  shootListCoverForShoot). */
function ShootCover({
  coverUrl,
  shootId,
  sizes,
  priority,
}: {
  coverUrl: string | null;
  shootId: string;
  sizes: string;
  priority?: boolean;
}) {
  if (isDeliverableCover(coverUrl)) {
    return <Image src={coverUrl} alt="" fill sizes={sizes} priority={priority} className={styles.heroImage} />;
  }
  if (coverUrl) {
    return <img src={coverUrl} alt="" className={styles.fillImgFallback} />;
  }
  return <Image src={shootListCoverForShoot(shootId)} alt="" fill sizes={sizes} priority={priority} className={styles.heroImage} />;
}

function Breadcrumb({ name }: { name: string }) {
  return (
    <div className={styles.breadcrumb}>
      <Link href="/app/shoots" className={styles.breadcrumbLink}>
        Shoots
      </Link>
      <ChevronRight size={14} aria-hidden />
      <span className={styles.breadcrumbCurrent}>{name}</span>
    </div>
  );
}
