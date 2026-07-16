// IPI-576 — Planner Dashboard workspace. Pure presentation over the two
// already-fetched, bounded server reads (page.tsx owns auth/query/error
// handling) — matches SCR-33-Planner-Dashboard.dc.html's in-scope zones only.
// Deliberately NOT built: the DC's "Start here" approval-blocking banner
// (needs an authoritative approvals source — IPI-483, not shipped),
// "Upcoming this week" strip (IPI-538's contract doesn't return this
// payload), and the personalized "Good morning, Maya" / "Sample data — not
// live" pill (fabricated content the ticket explicitly forbids). The
// Intelligence panel/nav/chat dock are the existing OperatorPanel shell —
// this component renders only the Workspace column.

import Link from "next/link";
import {
  AlertTriangle,
  CircleCheck,
  Clock,
  ListChecks,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import type { PlannerDashboardSummary, PlannerInstanceSummary } from "@/lib/planner/queries";

import styles from "./dashboard-workspace.module.css";
import { HubCard } from "./hub-card";
import hubStyles from "./hub-workspace.module.css";

type Props = {
  summary: PlannerDashboardSummary;
  items: PlannerInstanceSummary[];
};

export function PlannerDashboardWorkspace({ summary, items }: Props) {
  if (items.length === 0) {
    return <DashboardEmptyState />;
  }

  return (
    <div className={styles.workspace} data-testid="dashboard-workspace">
      <header className={styles.header}>
        <h1 className={styles.title}>Planner Dashboard</h1>
        <p className={styles.subtitle}>
          Your portfolio progress and today&apos;s work — Due today uses UTC in V1.
        </p>
      </header>

      <p className={styles.sectionLabel}>At a glance</p>
      <div className={styles.statsGrid} data-testid="dashboard-stats">
        <StatCard
          icon={TrendingUp}
          label="Progress"
          value={summary.progress === null ? "—" : `${summary.progress}%`}
          meta={summary.progress === null ? "Not enough data yet" : "across all visible plans"}
        />
        <StatCard
          icon={AlertTriangle}
          label="At risk"
          value={String(summary.atRisk)}
          meta="plans may miss their deadline"
          warning={summary.atRisk > 0}
        />
        <StatCard
          icon={Clock}
          label="Due today"
          value={String(summary.dueToday)}
          meta="tasks (UTC)"
        />
        <StatCard
          icon={ListChecks}
          label="My tasks"
          value={String(summary.myTasks)}
          meta="assigned to you"
        />
        <StatCard
          icon={CircleCheck}
          label="Needs approval"
          value="—"
          meta="Not available yet"
          muted
        />
      </div>

      <div className={styles.recentHeader}>
        <h2 className={styles.recentTitle}>Recent plans</h2>
        <Link href="/app/planner" className={styles.viewAllLink}>
          View all plans →
        </Link>
      </div>
      <div className={styles.recentGrid} data-testid="dashboard-recent-grid">
        {items.map((item) => (
          <HubCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  meta: string;
  warning?: boolean;
  muted?: boolean;
};

// KPI links open the generic Hub (correction — no unsupported Hub query
// params exist for "at risk"/"due today"/"my tasks"). "Needs approval" isn't
// a link at all — there's nothing to navigate to yet (IPI-483 not shipped),
// and a card with no href renders as a plain article, not a fake button
// (AC-F: real <a>/Link for navigation, never a clickable div).
function StatCard({ icon: Icon, label, value, meta, warning, muted }: StatCardProps) {
  const content = (
    <>
      <div className={styles.statIconRow}>
        <span className={`${styles.statIcon} ${warning ? styles.statIconWarning : ""}`}>
          <Icon size={16} aria-hidden />
        </span>
      </div>
      <p
        className={`${styles.statValue} ${warning ? styles.statValueWarning : ""} ${
          muted ? styles.statValueMuted : ""
        }`}
      >
        {value}
      </p>
      <p className={styles.statLabel}>{label}</p>
      <p className={styles.statMeta}>{meta}</p>
    </>
  );

  if (muted) {
    return (
      <article className={styles.statCard} aria-label={`${label}: ${meta}`}>
        {content}
      </article>
    );
  }

  return (
    <Link href="/app/planner" className={styles.statCardLink} aria-label={`${label}: ${value}, ${meta}`}>
      {content}
    </Link>
  );
}

function DashboardEmptyState() {
  return (
    <div className={styles.workspace} data-testid="dashboard-empty">
      <div className={hubStyles.emptyState}>
        <div className={hubStyles.emptyTitle}>No plans yet</div>
        <p className={hubStyles.emptyCopy}>
          Once you&apos;re on a plan, your progress, at-risk work, and tasks will show up here.
        </p>
        <Link href="/app/planner" className={styles.viewAllLink}>
          Browse plans →
        </Link>
      </div>
    </div>
  );
}
