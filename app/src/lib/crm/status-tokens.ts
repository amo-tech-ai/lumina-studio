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

// Pipeline reads cold → warm → closed: muted → info → warning → approved/blocked.
const DEAL_STAGE_DOT: Record<CrmDealStage, string> = {
  lead: "var(--color-text-muted)",
  qualified: "var(--color-info)",
  proposal: "var(--color-info)",
  negotiation: "var(--color-warning-text)",
  won: "var(--color-approved)",
  lost: "var(--color-blocked)",
};

const DEAL_STAGES = new Set<string>(Object.keys(DEAL_STAGE_LABEL));

// Unknown/missing values get a distinct muted token so they never masquerade as
// a real status (same guard as shoot-list-filters `normalizeStatus`).
const UNKNOWN_DOT = "var(--color-text-muted)";

export function crmStatusLabel(status: string | null | undefined): string {
  return status && COMPANY_STATUSES.has(status)
    ? COMPANY_STATUS_LABEL[status as CrmCompanyStatus]
    : "Unknown";
}

export function crmStatusDotToken(status: string | null | undefined): string {
  return status && COMPANY_STATUSES.has(status)
    ? COMPANY_STATUS_DOT[status as CrmCompanyStatus]
    : UNKNOWN_DOT;
}

export function crmDealStageLabel(stage: string | null | undefined): string {
  return stage && DEAL_STAGES.has(stage)
    ? DEAL_STAGE_LABEL[stage as CrmDealStage]
    : "Unknown";
}

export function crmDealStageDotToken(stage: string | null | undefined): string {
  return stage && DEAL_STAGES.has(stage)
    ? DEAL_STAGE_DOT[stage as CrmDealStage]
    : UNKNOWN_DOT;
}
