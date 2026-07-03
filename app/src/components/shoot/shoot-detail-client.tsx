"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { ShootDetailPayload } from "@/lib/shoot/get-shoot-detail";
import { formatDateRange, formatMoney } from "@/lib/shoot/shoot-detail-format";
import { ShootDetailActivityTab } from "./detail/shoot-detail-activity-tab";
import { ShootDetailApprovalsTab } from "./detail/shoot-detail-approvals-tab";
import { ShootDetailAssetsTab } from "./detail/shoot-detail-assets-tab";
import { ShootDetailBudgetTab } from "./detail/shoot-detail-budget-tab";
import { ShootDetailEmpty } from "./detail/shoot-detail-empty";
import { ShootDetailScheduleTab } from "./detail/shoot-detail-schedule-tab";
import { ShootDetailTeamTab } from "./detail/shoot-detail-team-tab";
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

function tabCount(id: TabId, data: ShootDetailPayload): number | null {
  switch (id) {
    case "shots":
      return data.shots.length || null;
    case "assets":
      return data.assets.length || null;
    case "team":
      return data.crew.length || null;
    case "approvals":
      return data.approvals.filter((a) => a.status === "pending").length || null;
    case "deliverables":
      return data.deliverables.length || null;
    case "activity":
      return data.activity.length || null;
    default:
      return null;
  }
}

function ShootDetailLoading() {
  return (
    <div className={styles.loadingWrap}>
      <div className={styles.skeleton} style={{ width: "5.625rem", height: "0.875rem" }} />
      <div
        className={styles.skeleton}
        style={{ width: "100%", aspectRatio: "24/9", borderRadius: "var(--card-radius)" }}
      />
      <div className={styles.skeleton} style={{ width: "50%", height: "1.5rem" }} />
      <div style={{ display: "flex", gap: "0.625rem" }}>
        <div className={styles.skeleton} style={{ width: "7.5rem", height: "2.125rem", borderRadius: "999px" }} />
        <div className={styles.skeleton} style={{ width: "7.5rem", height: "2.125rem", borderRadius: "999px" }} />
      </div>
    </div>
  );
}

function ShootDetailError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className={styles.errorWrap}>
      <p className={styles.errorTitle}>Couldn&apos;t load this shoot</p>
      <p className={styles.errorDetail}>{message}</p>
      <button type="button" className={styles.retryBtn} onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

export function ShootDetailClient({ shootId }: { shootId: string }) {
  const [data, setData] = useState<ShootDetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/shoots/${shootId}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<ShootDetailPayload>;
      })
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [shootId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <ShootDetailLoading />;

  if (error || !data) {
    return (
      <ShootDetailError
        message={error ?? "Shoot not found"}
        onRetry={load}
      />
    );
  }

  const { shoot, brand, deliverables, shots, assets, crew, approvals, activity } = data;
  const dateLabel = formatDateRange(shoot.start_date, shoot.end_date);
  const shotsDone = shots.filter((s) => s.status && s.status !== "pending").length;
  const progressPct =
    shots.length > 0 ? Math.round((shotsDone / shots.length) * 100) : 0;

  return (
    <div className={styles.workspace}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/app/shoots" className={styles.breadcrumbLink}>
          Shoots
        </Link>
        <span aria-hidden>›</span>
        <span className={styles.breadcrumbCurrent}>{shoot.name}</span>
      </nav>

      <div
        className={styles.hero}
        style={
          shoot.cover_url
            ? {
                backgroundImage: `url(${shoot.cover_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <span className={styles.heroScrim} aria-hidden />
        <div className={styles.heroContent}>
          <div>
            <span className={styles.statusPill}>
              <span className={styles.statusDot} aria-hidden />
              {shoot.status.replace(/_/g, " ")}
            </span>
            <h1 className={styles.heroTitle}>{shoot.name}</h1>
            <div className={styles.heroMeta}>
              {brand.name}
              {dateLabel ? ` · ${dateLabel}` : ""}
              {shots.length > 0 ? ` · ${shots.length} shots` : ""}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.progressRow}>
        <div className={styles.progressBlock}>
          <div className={styles.progressLabel}>
            <span>Progress</span>
            <span className="font-mono">
              {shotsDone}/{shots.length} shots
            </span>
          </div>
          <div className={styles.progressBar}>
            <span className={styles.progressFill} style={{ width: `${progressPct}%` }} />
          </div>
        </div>
        {shoot.dna_score != null ? (
          <span className="font-mono" style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
            DNA {shoot.dna_score}
          </span>
        ) : null}
      </div>

      <div className={styles.tabRow} role="tablist" aria-label="Shoot sections">
        {TAB_IDS.map((id) => {
          const count = tabCount(id, data);
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              className={styles.tabTrigger}
              data-active={activeTab === id ? "true" : undefined}
              onClick={() => setActiveTab(id)}
            >
              {TAB_LABELS[id]}
              {count != null ? (
                <span className={styles.tabCount}>{count}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" className={styles.tabPanel}>
        {activeTab === "overview" && (
          <div className="space-y-4" style={{ fontSize: "var(--font-size-sm)" }}>
            <div>
              <p
                style={{
                  fontSize: "var(--font-size-xs)",
                  fontWeight: "var(--font-weight-semibold)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: "var(--color-text-muted)",
                }}
              >
                Brief
              </p>
              <p style={{ marginTop: "0.25rem", color: "var(--color-text-secondary)" }}>
                {shoot.brief ?? "No brief yet."}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: "var(--font-size-xs)",
                  fontWeight: "var(--font-weight-semibold)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: "var(--color-text-muted)",
                }}
              >
                Channels
              </p>
              <p style={{ marginTop: "0.25rem", color: "var(--color-text-secondary)" }}>
                {shoot.target_channels.length
                  ? shoot.target_channels.join(", ")
                  : "None selected"}
              </p>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(7rem, 1fr))",
                gap: "1rem",
              }}
            >
              <div>
                <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                  Deliverables
                </p>
                <p style={{ fontSize: "var(--font-size-lg)", fontWeight: "var(--font-weight-semibold)" }}>
                  {deliverables.length}
                </p>
              </div>
              <div>
                <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                  Shots
                </p>
                <p style={{ fontSize: "var(--font-size-lg)", fontWeight: "var(--font-weight-semibold)" }}>
                  {shots.length}
                </p>
              </div>
              <div>
                <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                  Budget
                </p>
                <p style={{ fontSize: "var(--font-size-lg)", fontWeight: "var(--font-weight-semibold)" }}>
                  {formatMoney(shoot.estimated_budget, shoot.currency) ?? "—"}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "shots" &&
          (shots.length === 0 ? (
            <ShootDetailEmpty message="Shot list empty. Generate shots from the wizard or add manually." />
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {shots.map((shot) => (
                <li
                  key={shot.id}
                  style={{
                    border: "1px solid var(--color-border)",
                    borderRadius: "0.75rem",
                    padding: "0.75rem",
                    fontSize: "var(--font-size-sm)",
                  }}
                >
                  <span style={{ fontWeight: "var(--font-weight-semibold)" }}>
                    #{shot.shot_number}
                  </span>{" "}
                  {shot.description}
                  {shot.style_notes ? (
                    <p style={{ marginTop: "0.25rem", fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                      {shot.style_notes}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          ))}

        {activeTab === "assets" && (
          <ShootDetailAssetsTab shootId={shootId} assets={assets} />
        )}
        {activeTab === "team" && <ShootDetailTeamTab crew={crew} />}
        {activeTab === "schedule" && <ShootDetailScheduleTab data={data} />}
        {activeTab === "budget" && <ShootDetailBudgetTab data={data} />}
        {activeTab === "approvals" && (
          <ShootDetailApprovalsTab approvals={approvals} />
        )}
        {activeTab === "deliverables" &&
          (deliverables.length === 0 ? (
            <ShootDetailEmpty message="No deliverables planned yet." />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: "var(--font-size-sm)", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)", textAlign: "left", fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                    <th style={{ paddingBottom: "0.5rem", paddingRight: "1rem" }}>Channel</th>
                    <th style={{ paddingBottom: "0.5rem", paddingRight: "1rem" }}>Format</th>
                    <th style={{ paddingBottom: "0.5rem" }}>Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {deliverables.map((d) => (
                    <tr key={d.id} style={{ borderBottom: "1px solid var(--color-border-subtle, var(--color-border))" }}>
                      <td style={{ padding: "0.5rem 1rem 0.5rem 0" }}>{d.channel}</td>
                      <td style={{ padding: "0.5rem 1rem 0.5rem 0" }}>{d.format ?? "—"}</td>
                      <td style={{ padding: "0.5rem 0" }}>{d.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        {activeTab === "activity" && (
          <ShootDetailActivityTab activity={activity} />
        )}
      </div>
    </div>
  );
}
