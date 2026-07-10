"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle, ExternalLink } from "lucide-react";

import { ErrorState } from "@/components/ui/error-state";
import { StatusChip } from "@/components/ui/status-chip";
import type { DealDetailPayload } from "@/lib/crm/get-deal-detail";
import { formatMoney } from "@/lib/format";
import { crmDealStageDotToken, crmDealStageLabel, type CrmDealStage } from "@/lib/crm/status-tokens";

import { ActivityTimeline } from "./activity-timeline";
import { DealStageControl } from "./deal-stage-control";
import { OverviewFields } from "./crm-detail-shell";
import styles from "./deal-detail-workspace.module.css";
import shellStyles from "./crm-detail-shell.module.css";

const KNOWN_STAGES = new Set<string>(["lead", "qualified", "proposal", "negotiation", "won", "lost"]);

/** Same guarded-fallback shape as pipeline-workspace.tsx's byStage grouping —
 *  an unrecognized/legacy stage value never crashes the stage control, it
 *  just falls back to the natural entry stage. */
function toKnownStage(stage: string): CrmDealStage {
  return KNOWN_STAGES.has(stage) ? (stage as CrmDealStage) : "lead";
}

function formatShortDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

type Props = {
  data: DealDetailPayload | null;
  fetchError: string | null;
};

/** Deal Detail — ported from SCR-31-CRM-Deal-Detail.dc.html (IPI-396). No tab
 *  strip: unlike Company/Contact Detail, the DC has a single scrolling column
 *  (overview + stage + activity), so this does not use CrmDetailShell's tab
 *  mechanism — only its OverviewFields grid and shared CSS classes.
 *
 *  Dropped vs DC, with reasons (never fabricated):
 *  - "Primary contact" overview field — `crm_deals` has no `contact_id`
 *    column (see get-deal-detail.ts). Not a real relationship, so it's not
 *    rendered rather than shown against a fake value.
 *  - Deal "name" header ("SS26 Editorial" in the DC) — `crm_deals` has no
 *    name/title column at all. `displayTitle` below derives a real label
 *    (the linked shoot's name, or a company-based fallback) and is not a
 *    stored field — this is the single biggest schema/DC mismatch found
 *    during the 2026-07-10 forensic verification of this ticket.
 *  - IntelligencePanel health-score bars + AI-drafted-followup card — DC's
 *    own copy labels this "crm-assistant · not yet wired"; per the same
 *    honest-empty precedent as CompanyDetailWorkspace's dropped relationship
 *    card, IntelligencePanel (shell, not rebuilt here) is left as-is rather
 *    than fed fabricated health-score percentages. */
export function DealDetailWorkspace({ data, fetchError }: Props) {
  const router = useRouter();
  // Ephemeral, local-only preview of a non-terminal stage move — see
  // DealStageControl's doc comment for why this doesn't persist yet.
  const [previewStage, setPreviewStage] = useState<CrmDealStage | null>(null);

  if (fetchError || !data) {
    return (
      <div className={shellStyles.stateRoot}>
        <ErrorState message={fetchError ?? "Something went wrong."} onRetry={() => router.refresh()} />
      </div>
    );
  }

  const { deal, companyName, shootName, companyBrandId, activities } = data;
  const stage = previewStage ?? toKnownStage(deal.stage);
  const isWon = stage === "won";
  const closeDate = formatShortDate(deal.expected_close_date);
  const displayTitle = shootName ?? `${companyName ?? "Untitled company"} deal`;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={shellStyles.breadcrumb}>
          <Link href="/app/crm/pipeline" className={shellStyles.breadcrumbLink}>
            Pipeline
          </Link>
          <span aria-hidden>›</span>
          <span className={shellStyles.breadcrumbCurrent}>
            {companyName ? `${companyName} — ${displayTitle}` : displayTitle}
          </span>
        </div>

        <div className={styles.titleRow}>
          <h1 className={styles.title}>{displayTitle}</h1>
          <span className={styles.value}>{formatMoney(deal.value, deal.currency)}</span>
          <StatusChip dot={crmDealStageDotToken(stage)} label={crmDealStageLabel(stage)} />
        </div>
        <div className={styles.subtitle}>
          {companyName ?? "—"}
          {closeDate ? ` · expected close ${closeDate}` : null}
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.content}>
          <OverviewFields
            fields={[
              {
                label: "Company",
                value: (
                  <Link href={`/app/crm/companies/${deal.company_id}`} className={shellStyles.overviewLink}>
                    {companyName ?? "—"} ↗
                  </Link>
                ),
              },
              { label: "Value", value: formatMoney(deal.value, deal.currency) },
              {
                label: "Linked shoot",
                value: deal.shoot_id ? (
                  <Link href={`/app/shoots/${deal.shoot_id}`} className={shellStyles.overviewLink}>
                    {shootName ?? "View shoot"} ↗
                  </Link>
                ) : (
                  "Not linked"
                ),
              },
            ]}
          />

          <div className={styles.stageLabel}>Stage</div>
          <DealStageControl stage={stage} onStageChange={setPreviewStage} />

          {isWon ? (
            <div className={styles.wonBanner}>
              <CheckCircle size={20} aria-hidden className={styles.wonIcon} />
              <div className={styles.wonText}>
                <div className={styles.wonHeading}>
                  {companyBrandId ? "Converted to brand" : "Won — not yet linked to a brand"}
                </div>
                <div className={styles.wonSub}>
                  {companyBrandId
                    ? "Handed off to Brand Intelligence."
                    : "Brand conversion isn't wired yet (pending IPI-367)."}
                </div>
              </div>
              {companyBrandId ? (
                <Link href={`/app/brand/${companyBrandId}`} className={styles.wonLink}>
                  View brand
                  <ExternalLink size={13} aria-hidden />
                </Link>
              ) : null}
            </div>
          ) : null}

          <div className={styles.activityHeader}>
            <span className={styles.activityLabel}>Activity</span>
          </div>
          <ActivityTimeline activities={activities} />
        </div>
      </div>
    </div>
  );
}
