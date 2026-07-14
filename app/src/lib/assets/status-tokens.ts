/** Asset DNA status → label + dot-color token. Values match `assets.dna_status`
 *  as written by the DNA scoring pipeline (see brand-context-panel.tsx's
 *  DNA_BADGE map — same 3 values). Colors reference tokens.css — never a raw hex. */

export type AssetDnaStatus = "approved" | "review" | "blocked";

const DNA_STATUS_LABEL: Record<AssetDnaStatus, string> = {
  approved: "Approved",
  review: "Review",
  blocked: "Blocked",
};

const DNA_STATUS_DOT: Record<AssetDnaStatus, string> = {
  approved: "var(--color-approved)",
  review: "var(--color-warning)",
  blocked: "var(--color-blocked)",
};

function isKnownDnaStatus(value: string): value is AssetDnaStatus {
  return value === "approved" || value === "review" || value === "blocked";
}

export function assetDnaStatusLabel(status: string | null): string | null {
  if (!status || !isKnownDnaStatus(status)) return null;
  return DNA_STATUS_LABEL[status];
}

export function assetDnaStatusDotToken(status: string | null): string | null {
  if (!status || !isKnownDnaStatus(status)) return null;
  return DNA_STATUS_DOT[status];
}
