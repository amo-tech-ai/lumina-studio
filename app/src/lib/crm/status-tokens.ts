/** CRM status/stage → label + dot-color token, mirroring `shoot-list-filters.ts`.
 *  Values match the DB CHECK constraints (crm_companies_status_check,
 *  crm_deals_stage_check). Colors reference tokens.css — never a raw hex. */

// ── Company status (crm_companies.status) ─────────────────────────────────────
export type CrmCompanyStatus = "prospect" | "active" | "inactive" | "lost";

const COMPANY_STATUS_LABEL: Record<CrmCompanyStatus, string> = {
  prospect: "Prospect",
  active: "Active",
  inactive: "Inactive",
  lost: "Lost",
};

const COMPANY_STATUS_DOT: Record<CrmCompanyStatus, string> = {
  prospect: "var(--color-info)", // #2563EB
  active: "var(--color-approved)", // #059669
  inactive: "var(--color-text-muted)", // #9CA3AF
  lost: "var(--color-blocked)", // #DC2626
};

const COMPANY_STATUSES = new Set<string>(Object.keys(COMPANY_STATUS_LABEL));

// ── Deal stage (crm_deals.stage) ──────────────────────────────────────────────
export type CrmDealStage =
  | "lead"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost";

const DEAL_STAGE_LABEL: Record<CrmDealStage, string> = {
  lead: "Lead",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

// SCR-30 stage dots: Lead grey-500, Qualified blue, Proposal purple
// (--color-published), Negotiation amber, Won green, Lost red-700.
const DEAL_STAGE_DOT: Record<CrmDealStage, string> = {
  lead: "var(--color-crm-lead)",
  qualified: "var(--color-info)",
  proposal: "var(--color-published)",
  negotiation: "var(--color-warning-text)",
  won: "var(--color-approved)",
  lost: "var(--color-crm-lost)",
};

const DEAL_STAGES = new Set<string>(Object.keys(DEAL_STAGE_LABEL));

// Unknown/missing values get a distinct muted token so they never masquerade as
// a real status (same guard as shoot-list-filters `normalizeStatus`).
const UNKNOWN_DOT = "var(--color-text-muted)";
const UNKNOWN_LABEL = "Unknown";

/** Shared guarded lookup — returns the mapped value, or `fallback` for a
 *  missing/invalid key, so a bad value never masquerades as the first enum. */
function lookup(
  key: string | null | undefined,
  known: Set<string>,
  map: Record<string, string>,
  fallback: string,
): string {
  return key && known.has(key) ? map[key] : fallback;
}

export function crmStatusLabel(status: string | null | undefined): string {
  return lookup(status, COMPANY_STATUSES, COMPANY_STATUS_LABEL, UNKNOWN_LABEL);
}

export function crmStatusDotToken(status: string | null | undefined): string {
  return lookup(status, COMPANY_STATUSES, COMPANY_STATUS_DOT, UNKNOWN_DOT);
}

export function crmDealStageLabel(stage: string | null | undefined): string {
  return lookup(stage, DEAL_STAGES, DEAL_STAGE_LABEL, UNKNOWN_LABEL);
}

export function crmDealStageDotToken(stage: string | null | undefined): string {
  return lookup(stage, DEAL_STAGES, DEAL_STAGE_DOT, UNKNOWN_DOT);
}
