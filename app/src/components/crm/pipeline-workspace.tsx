"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Inbox, Lock } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { useSetCrmChatContext } from "@/context/crm-chat-context";
import type { DealRow } from "@/lib/crm/queries";
import { countAtRiskDeals, formatPipelineValue } from "@/lib/crm/derive-crm-chat-context";
import { crmDealStageDotToken, crmDealStageLabel, type CrmDealStage } from "@/lib/crm/status-tokens";
import { formatMoney } from "@/lib/format";
import { DealStageControl } from "./deal-stage-control";
import styles from "./pipeline-workspace.module.css";

const STAGES: CrmDealStage[] = ["lead", "qualified", "proposal", "negotiation", "won", "lost"];
const LOCKED_STAGES = new Set<CrmDealStage>(["won", "lost"]);
const OPEN_STAGES = new Set<CrmDealStage>(["lead", "qualified", "proposal", "negotiation"]);
const PIPELINE_NARROW_MQ = "(max-width: 1024px)";

/** IPI-572 — exclusive `<details name>` fires close+open in one tick.
 *  Functional reduce so a stale close cannot wipe the stage that just opened. */
export function resolvePipelineAccordionStage(
  current: CrmDealStage | null,
  stage: CrmDealStage,
  nextOpen: boolean,
): CrmDealStage | null {
  if (nextOpen) return stage;
  return current === stage ? null : current;
}

function subscribePipelineNarrow(onStoreChange: () => void) {
  const mq = window.matchMedia(PIPELINE_NARROW_MQ);
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getPipelineNarrowSnapshot() {
  return window.matchMedia(PIPELINE_NARROW_MQ).matches;
}

function getPipelineNarrowServerSnapshot() {
  return false;
}

/** IPI-572 — when columns stack (≤1024), use native <details name="crm-pipeline">.
 *  Desktop kanban keeps plain column divs (exclusive accordion would collapse siblings). */
function usePipelineNarrow(): boolean {
  return useSyncExternalStore(
    subscribePipelineNarrow,
    getPipelineNarrowSnapshot,
    getPipelineNarrowServerSnapshot,
  );
}

// crm_deals has no risk_score column (verified against the generated schema
// types) — "at risk" is a naive staleness heuristic (no update in AT_RISK_DAYS,
// still open), not a real health score. Upgrade path: wire
// `scoreDealHealth` from `@/lib/crm/score-deal-health` (IPI-369 Phase A) —
// do not recompute on every board paint; call on demand or cache with `asOf`.
const AT_RISK_DAYS = 14;

type Props = {
  deals: DealRow[];
  companyNames: Record<string, string>;
  /** id→display name for deal.owner (via getProfileNames), same as companies list. */
  ownerNames: Record<string, string>;
  fetchError: string | null;
  /** Epoch ms, computed once in the Server Component (page.tsx) and passed
   *  down — never `Date.now()` inside this client component. The exact same
   *  value renders server-side and hydrates client-side (it's serialized
   *  through the same props), so "Updated Xd ago"/at-risk never flips
   *  between server HTML and client hydration near a day boundary. */
  now: number;
};

/** CRM Pipeline — SCR-30 (IPI-395 + IPI-563 polish).
 *
 *  DnD deferred: accessible Move via DealStageControl is the primary path
 *  (WCAG 2.5.7). Drag-and-drop is out of scope for this ticket. */
export function PipelineWorkspace({ deals: initialDeals, companyNames, ownerNames, fetchError, now }: Props) {
  const router = useRouter();
  const narrow = usePipelineNarrow();
  const [atRiskOnly, setAtRiskOnly] = useState(false);
  const [ownerFilter, setOwnerFilter] = useState("");
  const [deals, setDeals] = useState(initialDeals);
  const [liveMessage, setLiveMessage] = useState("");
  const [openStage, setOpenStage] = useState<CrmDealStage | null>(null);
  const focusDealIdRef = useRef<string | null>(null);

  useEffect(() => {
    setDeals(initialDeals);
  }, [initialDeals]);

  useEffect(() => {
    const id = focusDealIdRef.current;
    if (!id) return;
    focusDealIdRef.current = null;
    // Restore focus on the Move control after the card relocates columns.
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(`[data-deal-move="${id}"] button:not([disabled])`);
      el?.focus();
    });
  }, [deals, liveMessage]);

  // Clear transient SR announcement so stale copy does not linger in the live region.
  useEffect(() => {
    if (!liveMessage) return;
    const t = window.setTimeout(() => setLiveMessage(""), 1500);
    return () => window.clearTimeout(t);
  }, [liveMessage]);

  const ownerOptions = useMemo(() => {
    // Derive from deals so the filter stays usable even when profiles RLS
    // only returns the caller's own row (getProfileNames self-row limit).
    const byId = new Map<string, string>();
    for (const d of deals) {
      if (!d.owner) continue;
      if (!byId.has(d.owner)) {
        byId.set(d.owner, ownerNames[d.owner] ?? `Teammate · ${d.owner.slice(0, 8)}`);
      }
    }
    for (const [id, name] of Object.entries(ownerNames)) {
      byId.set(id, name);
    }
    return [...byId.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [deals, ownerNames]);

  const visibleDeals = useMemo(() => {
    let list = deals;
    if (ownerFilter) list = list.filter((d) => d.owner === ownerFilter);
    if (atRiskOnly) list = list.filter((d) => isAtRisk(d, now));
    return list;
  }, [atRiskOnly, deals, now, ownerFilter]);

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
      const bucket = map.has(deal.stage as CrmDealStage) ? (deal.stage as CrmDealStage) : "lead";
      map.get(bucket)?.push(deal);
    }
    return map;
  }, [visibleDeals]);

  const chatContext = useMemo(
    () =>
      fetchError
        ? {}
        : {
            pipelineValue: formatPipelineValue(deals),
            atRiskCount: countAtRiskDeals(deals, now),
          },
    [deals, fetchError, now],
  );
  useSetCrmChatContext(chatContext);

  // Seed / retarget accordion when layout or filters change (IPI-572).
  // Do not list `byStage` as a dependency: a deal move that empties the destination
  // under "At risk only" (fresh updated_at) must not yank openStage off the stage
  // the operator just moved into. Filter/narrow changes still retarget via those deps.
  useEffect(() => {
    if (!narrow) {
      setOpenStage(null);
      return;
    }
    setOpenStage((current) => {
      const firstWithDeals = STAGES.find((s) => (byStage.get(s)?.length ?? 0) > 0) ?? "lead";
      if (!current) return firstWithDeals;
      if ((byStage.get(current)?.length ?? 0) > 0) return current;
      return firstWithDeals;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: filters/narrow only
  }, [narrow, ownerFilter, atRiskOnly]);


  function handleStageChange(dealId: string, newStage: CrmDealStage, updatedAt?: string) {
    setDeals((prev) =>
      prev.map((d) =>
        d.id === dealId
          ? { ...d, stage: newStage, ...(updatedAt ? { updated_at: updatedAt } : {}) }
          : d,
      ),
    );
    // Keep the destination stage open on mobile so the moved card (and focus
    // restore) stay visible inside the accordion.
    if (narrow) setOpenStage(newStage);
    focusDealIdRef.current = dealId;
    setLiveMessage(`Moved to ${crmDealStageLabel(newStage)}`);
    router.refresh();
  }

  if (fetchError) {
    return (
      <div className={styles.stateRoot}>
        <ErrorState message={fetchError} onRetry={() => router.refresh()} />
      </div>
    );
  }

  if (initialDeals.length === 0) {
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
            <label className={styles.ownerFilterLabel}>
              <span className={styles.ownerFilterSrOnly}>Owner</span>
              <select
                className={styles.ownerFilter}
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
                aria-label="Owner"
              >
                <option value="">All owners</option>
                {ownerOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </label>
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

      <div className={styles.liveRegion} aria-live="polite" aria-atomic="true">
        {liveMessage}
      </div>

      {visibleDeals.length === 0 ? (
        <div className={styles.stateRoot}>
          <EmptyState
            heading="No matching deals"
            body="Try a different owner or clear the At risk filter."
            icon={<Inbox />}
          />
        </div>
      ) : (
        <div className={styles.board} data-pipeline-layout={narrow ? "accordion" : "board"}>
          {STAGES.map((stage) => {
            const stageDeals = byStage.get(stage) ?? [];
            const stageTotals = new Map<string, number>();
            for (const d of stageDeals) {
              if (d.value == null) continue;
              stageTotals.set(d.currency, (stageTotals.get(d.currency) ?? 0) + d.value);
            }
            const locked = LOCKED_STAGES.has(stage);
            const totalText =
              stageTotals.size > 0
                ? [...stageTotals.entries()].map(([cur, sum]) => formatMoney(sum, cur)).join(" + ")
                : "—";
            const header = (
              <>
                <div className={styles.columnHeaderTop}>
                  <div className={styles.columnHeaderLabel}>
                    <span className={styles.stageDot} style={{ background: crmDealStageDotToken(stage) }} aria-hidden />
                    <span className={styles.stageLabel}>{crmDealStageLabel(stage)}</span>
                    {locked ? <Lock size={12} aria-hidden className={styles.lockIcon} /> : null}
                  </div>
                  <span className={styles.stageCount}>{stageDeals.length}</span>
                </div>
                <div className={styles.columnTotal}>{totalText}</div>
              </>
            );
            const body = (
              <>
                {locked ? <div className={styles.lockedBadge}>Enter via approval only</div> : null}
                <div className={styles.cards}>
                  {stageDeals.map((deal) => {
                    const knownStage = OPEN_STAGES.has(deal.stage as CrmDealStage)
                      ? (deal.stage as CrmDealStage)
                      : LOCKED_STAGES.has(deal.stage as CrmDealStage)
                        ? (deal.stage as CrmDealStage)
                        : "lead";
                    return (
                      <div key={deal.id} className={styles.card} data-deal-id={deal.id}>
                        <Link href={`/app/crm/pipeline/${deal.id}`} className={styles.cardLink}>
                          <div className={styles.cardCompany}>
                            {deal.company_id ? (companyNames[deal.company_id] ?? "—") : "—"}
                          </div>
                          <div className={styles.cardMeta}>
                            <span className={styles.cardValue}>{formatMoney(deal.value, deal.currency)}</span>
                            <span className={styles.cardUpdated}>Updated {formatRelativeDays(deal.updated_at, now)}</span>
                          </div>
                          {isAtRisk(deal, now) ? <span className={styles.atRiskBadge}>At risk</span> : null}
                        </Link>
                        {OPEN_STAGES.has(knownStage) ? (
                          <div className={styles.cardMove} data-deal-move={deal.id}>
                            <DealStageControl
                              dealId={deal.id}
                              stage={knownStage}
                              updatedAt={deal.updated_at}
                              onStageChange={(next, _brandId, nextUpdatedAt) =>
                                handleStageChange(deal.id, next, nextUpdatedAt)
                              }
                            />
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                  {stageDeals.length === 0 ? <div className={styles.columnEmpty}>No deals</div> : null}
                </div>
              </>
            );

            if (narrow) {
              return (
                <details
                  key={stage}
                  className={styles.column}
                  name="crm-pipeline"
                  open={openStage === stage}
                  data-stage={stage}
                  onToggle={(event) => {
                    const nextOpen = event.currentTarget.open;
                    setOpenStage((current) => resolvePipelineAccordionStage(current, stage, nextOpen));
                  }}
                >
                  <summary className={styles.columnHeader}>{header}</summary>
                  {body}
                </details>
              );
            }

            return (
              <div key={stage} className={styles.column} data-stage={stage}>
                <div className={styles.columnHeader}>{header}</div>
                {body}
              </div>
            );
          })}
        </div>
      )}
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
