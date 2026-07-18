// IPI-551 · PLN-S4b — pure parse/serialize for the Adaptive Context Panel's
// URL-backed selection. No React, no Supabase: this is the single source of
// truth both the client hook (use-planner-selection.ts) and any future
// server code can share without pulling in browser or DB dependencies.
//
// URL format is one encoded key, `?selection=task:<uuid>` — never two
// separate params (frozen in IPI-551). The parser fails closed: anything it
// doesn't recognize returns null so the caller falls back to Intelligence
// mode instead of crashing or rendering a broken Detail panel.

export type PlannerSelectionType = "task" | "phase" | "member";

export type PlannerSelection = { type: PlannerSelectionType; id: string } | null;

// Reused verbatim from
// app/src/app/(operator)/app/planner/[instanceId]/layout.tsx.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VALID_TYPES: readonly PlannerSelectionType[] = ["task", "phase", "member"];

function isValidType(value: string): value is PlannerSelectionType {
  return (VALID_TYPES as readonly string[]).includes(value);
}

export function parseSelectionParam(raw: string | null | undefined): PlannerSelection {
  if (!raw) return null;

  // Split on the FIRST colon only — a uuid never contains a colon, so this
  // is purely a robustness rule for malformed input like `task:abc:def`,
  // not something a valid value can ever hit.
  const colonIndex = raw.indexOf(":");
  if (colonIndex === -1) return null;

  const type = raw.slice(0, colonIndex);
  const id = raw.slice(colonIndex + 1);

  if (!isValidType(type)) return null;
  if (!UUID_RE.test(id)) return null;

  return { type, id };
}

export function serializeSelectionParam(selection: PlannerSelection): string | null {
  if (!selection) return null;
  return `${selection.type}:${selection.id}`;
}
