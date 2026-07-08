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
  /** Epoch ms, computed once in the Server Component (page.tsx) and passed
   *  down — never `Date.now()` inside this client component. The exact same
   *  value renders server-side and hydrates client-side (it's serialized
   *  through the same props), so "Updated Xd ago"/at-risk never flips
   *  between server HTML and client hydration near a day boundary. */
  now: number;
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
export function PipelineWorkspace({ deals, companyNames, fetchError, now }: Props) {
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

  // Reflects whatever's actually on the board right now — when "At risk
  // only" is toggled, the header count/total must match the filtered set,
  // not silently keep showing every deal's numbers.
  const visibleDeals = useMemo(
    () => (atRiskOnly ? deals.filter((d) => isAtRisk(d, now)) : deals),
    [atRiskOnly, deals, now],
  );

  // Grouped by currency rather than summed flat — a single raw sum would be
  // silently wrong the moment an org has deals in more than one currency.
  // Null-value deals are skipped entirely, not coerced to 0: formatMoney()
  // already renders a null value as "—" on the card, so a stage/currency
  // with only unknown-value deals should show the same "—", not a false,
  // precise-looking "$0" that implies the value is known and zero.
  const totalsByCurrency = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of visibleDeals) {
      if (d.value == null) continue;
      map.set(d.currency, (map.get(d.currency) ?? 0) + d.value);
    }
    return map;
  }, [visibleDeals]);

  const byStage = useMemo(() => {
    const map = new Map<CrmDealStage, DealRow[]>();
    for (const stage of STAGES) map.set(stage, []);
    for (const deal of visibleDeals) {
      // Unknown/legacy stage values (DB CHECK constraint prevents this for
      // new writes, but don't let a future enum change or backfilled row
      // silently vanish from the board) fall back to "lead" — the natural
      // entry stage — rather than disappearing from every column while
      // still counting toward the header total, same guarded-fallback
      // discipline as crmDealStageLabel()/crmDealStageDotToken().
      const bucket = map.has(deal.stage as CrmDealStage) ? (deal.stage as CrmDealStage) : "lead";
      map.get(bucket)?.push(deal);
    }
    return map;
  }, [visibleDeals]);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.title}>Pipeline</h1>
            <p className={styles.total}>
              {[...totalsByCurrency.entries()].map(([cur, sum]) => formatMoney(sum, cur)).join(" + ") || "—"}
            </p>
            <p className={styles.subtitle}>
              {visibleDeals.length} {visibleDeals.length === 1 ? "deal" : "deals"} ·{" "}
              <span className={styles.subtitleApproval}>Won / Lost require approval</span>
            </p>
          </div>
          <div className={styles.headerActions}>
            <button type="button" disabled title="Coming soon" className={styles.ownerFilter}>
              Owner
            </button>
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
      </div>

      <div className={styles.board}>
        {STAGES.map((stage) => {
          const stageDeals = byStage.get(stage) ?? [];
          const stageTotals = new Map<string, number>();
          for (const d of stageDeals) {
            if (d.value == null) continue;
            stageTotals.set(d.currency, (stageTotals.get(d.currency) ?? 0) + d.value);
          }
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
                      <span className={styles.cardUpdated}>Updated {formatRelativeDays(deal.updated_at, now)}</span>
                    </div>
                    {isAtRisk(deal, now) ? <span className={styles.atRiskBadge}>At risk</span> : null}
                  </Link>
                ))}
                {stageDeals.length === 0 ? <div className={styles.columnEmpty}>No deals</div> : null}
              </div>

              <div className={styles.columnTotal}>
                {stageTotals.size > 0
                  ? [...stageTotals.entries()].map(([cur, sum]) => formatMoney(sum, cur)).join(" + ")
                  : "—"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function isAtRisk(deal: DealRow, now: number): boolean {
  if (deal.stage === "won" || deal.stage === "lost") return false;
  return daysSince(deal.updated_at, now) >= AT_RISK_DAYS;
}

function daysSince(iso: string, now: number): number {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 0;
  return Math.floor((now - then) / 86_400_000);
}

function formatRelativeDays(iso: string, now: number): string {
  const days = daysSince(iso, now);
  if (days <= 0) return "today";
  if (days === 1) return "1d ago";
  return `${days}d ago`;
}
