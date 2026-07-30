import type { ActivityRow, DealRow } from "./queries";
import { crmDealStageLabel, type CrmDealStage } from "./status-tokens";
import { formatMoney } from "@/lib/format";

const OPEN_STAGES = new Set<string>(["lead", "qualified", "proposal", "negotiation"]);
const KNOWN_STAGES = new Set<string>(["lead", "qualified", "proposal", "negotiation", "won", "lost"]);
const AT_RISK_DAYS = 14;

function toKnownStage(stage: string): CrmDealStage {
  return KNOWN_STAGES.has(stage) ? (stage as CrmDealStage) : "lead";
}

function daysSince(iso: string, now: number): number {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 0;
  return Math.floor((now - then) / 86_400_000);
}

export function countOpenDeals(deals: DealRow[]): number {
  return deals.filter((d) => OPEN_STAGES.has(d.stage)).length;
}

export function primaryOpenDealStageLabel(deals: DealRow[]): string | undefined {
  const open = deals.find((d) => OPEN_STAGES.has(d.stage));
  return open ? crmDealStageLabel(toKnownStage(open.stage)) : undefined;
}

export function daysSinceLastActivity(activities: ActivityRow[], now = Date.now()): number | undefined {
  const latest = activities[0]?.created_at;
  if (!latest) return undefined;
  return daysSince(latest, now);
}

export function formatPipelineValue(deals: DealRow[]): string | undefined {
  const map = new Map<string, number>();
  for (const d of deals) {
    if (d.value == null) continue;
    map.set(d.currency, (map.get(d.currency) ?? 0) + d.value);
  }
  if (map.size === 0) return undefined;
  return [...map.entries()].map(([cur, sum]) => formatMoney(sum, cur)).join(" + ");
}

export function countAtRiskDeals(deals: DealRow[], now: number): number {
  return deals.filter((d) => {
    if (d.stage === "won" || d.stage === "lost") return false;
    return daysSince(d.updated_at, now) >= AT_RISK_DAYS;
  }).length;
}

export function formatDealValue(deal: DealRow): string | undefined {
  if (deal.value == null) return undefined;
  return formatMoney(deal.value, deal.currency);
}

export function dealDisplayName(companyName: string | null): string {
  return `${companyName ?? "Untitled company"} deal`;
}
