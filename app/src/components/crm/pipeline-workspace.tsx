"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Inbox, Lock } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import type { DealRow } from "@/lib/crm/queries";
import { crmDealStageDotToken, crmDealStageLabel, type CrmDealStage } from "@/lib/crm/status-tokens";
import { formatMoney } from "@/lib/format";
import styles from "./pipeline-workspace.module.css";

const STAGES: CrmDealStage[] = ["lead", "qualified", "proposal", "negotiation", "won", "lost"];
const LOCKED_STAGES = new Set<CrmDealStage>(["won", "lost"]);

// crm_deals has no risk_score column (verified against the generated schema
// types) — "at risk" is a naive staleness heuristic (no update in AT_RISK_DAYS,
// still open), not a real health score. Upgrade path: a crm-assistant-derived
// health score once that RPC exists — don't fabricate one now.
const AT_RISK_DAYS = 14;

type Props = {
  deals: DealRow[];
  companyNames: Record<string, string>;
  fetchError: string | null;
};

/** CRM Pipeline — ported from SCR-30-CRM-Pipeline.dc.html (IPI-395). The raw
 *  DC source is unavailable in this checkout (Universal-design-prompt-new/
 *  was removed before this ticket started); built from the Linear issue's own
 *  transcribed grid spec + AC table instead.
 *
 *  Dropped vs the DC/Linear spec: the per-card "risk dot" and "days in stage"
 *  — neither is backed by a real column (no risk_score, no stage_entered_at).
 *  "Updated Xd ago" (from updated_at) replaces "days in stage" as an honest,
 *  if imperfect, proxy. IntelligencePanel health-breakdown-on-select is
 *  dropped too — same call as Company/Contact Detail, no crm-assistant
 *  summary RPC exists yet. Won/Lost columns show a locked visual state only
 *  (lock icon + badge) — no ApprovalCard wiring, no conversion logic. Deal
 *  cards link to the existing /app/crm/pipeline/[id] stub (SCR-31, separate
 *  issue) rather than embedding deal detail inline. */
export function PipelineWorkspace({ deals, companyNames, fetchError }: Props) {
  const router = useRouter();
  const [atRiskOnly, setAtRiskOnly] = useState(false);

  if (fetchError) {
    return (
      <div className={styles.stateRoot}>
        <ErrorState message={fetchError} onRetry={() => router.refresh()} />
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className={styles.stateRoot}>
        <EmptyState
          heading="No deals yet"
          body="Deals will appear here once they're added to the pipeline."
          icon={<Inbox />}
        />
      </div>
    );
  }

  // ponytail: assumes a single-currency org (true for every org today) — sums
  // raw values directly. If multi-currency deals land, group by currency
  // before summing rather than adding mismatched currencies together.
  const currency = deals[0]?.currency ?? "USD";
  const total = deals.reduce((sum, d) => sum + (d.value ?? 0), 0);
  const visibleDeals = atRiskOnly ? deals.filter(isAtRisk) : deals;

  const byStage = useMemo(() => {
    const map = new Map<CrmDealStage, DealRow[]>();
    for (const stage of STAGES) map.set(stage, []);
    for (const deal of visibleDeals) {
      map.get(deal.stage as CrmDealStage)?.push(deal);
    }
    return map;
  }, [visibleDeals]);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.title}>Pipeline</h1>
            <p className={styles.total}>{formatMoney(total, currency)}</p>
          </div>
          <button
            type="button"
            onClick={() => setAtRiskOnly((v) => !v)}
            aria-pressed={atRiskOnly}
            className={atRiskOnly ? `${styles.riskToggle} ${styles.riskToggleActive}` : styles.riskToggle}
          >
            At risk only
          </button>
        </div>
      </div>

      <div className={styles.board}>
        {STAGES.map((stage) => {
          const stageDeals = byStage.get(stage) ?? [];
          const stageTotal = stageDeals.reduce((sum, d) => sum + (d.value ?? 0), 0);
          const locked = LOCKED_STAGES.has(stage);
          return (
            <div key={stage} className={styles.column}>
              <div className={styles.columnHeader}>
                <span className={styles.stageDot} style={{ background: crmDealStageDotToken(stage) }} aria-hidden />
                <span className={styles.stageLabel}>{crmDealStageLabel(stage)}</span>
                <span className={styles.stageCount}>{stageDeals.length}</span>
                {locked ? <Lock size={12} aria-hidden className={styles.lockIcon} /> : null}
              </div>
              {locked ? <div className={styles.lockedBadge}>Enter via approval only</div> : null}

              <div className={styles.cards}>
                {stageDeals.map((deal) => (
                  <Link key={deal.id} href={`/app/crm/pipeline/${deal.id}`} className={styles.card}>
                    <div className={styles.cardCompany}>
                      {deal.company_id ? (companyNames[deal.company_id] ?? "—") : "—"}
                    </div>
                    <div className={styles.cardMeta}>
                      <span className={styles.cardValue}>{formatMoney(deal.value, deal.currency)}</span>
                      <span className={styles.cardUpdated}>Updated {formatRelativeDays(deal.updated_at)}</span>
                    </div>
                    {isAtRisk(deal) ? <span className={styles.atRiskBadge}>At risk</span> : null}
                  </Link>
                ))}
                {stageDeals.length === 0 ? <div className={styles.columnEmpty}>No deals</div> : null}
              </div>

              {stageTotal > 0 ? <div className={styles.columnTotal}>{formatMoney(stageTotal, currency)}</div> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function isAtRisk(deal: DealRow): boolean {
  if (deal.stage === "won" || deal.stage === "lost") return false;
  return daysSince(deal.updated_at) >= AT_RISK_DAYS;
}

function daysSince(iso: string): number {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 0;
  return Math.floor((Date.now() - then) / 86_400_000);
}

function formatRelativeDays(iso: string): string {
  const days = daysSince(iso);
  if (days <= 0) return "today";
  if (days === 1) return "1d ago";
  return `${days}d ago`;
}
