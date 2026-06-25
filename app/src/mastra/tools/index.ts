// Agent Tool Registry (IPI2-84) — the single discoverable place agents pull
// tools from. Register every agent tool here; agents import `agentTools` rather
// than individual tools so the surface is auditable in one location.
//
// Convention:
//  - READ tools: query Supabase with an RLS-scoped client directly or a public API.
//    No edge layer needed.
//  - WRITE tools: call a Supabase Edge Function via `callEdgeFunction` (./edge.ts)
//    AFTER a useInterrupt HITL approval — never write durable tables directly
//    (no silent writes; IPI2-116 pattern). Real write tools (analyzeBrandUrl,
//    commitApprovedBrandDraft, …) land with their edge functions + auth (IPI2-83/127).
import { approveShotList } from "./approveShotList";
import { estimateShootBudget } from "./estimateShootBudget";
import { explainShootDnaAlerts } from "./explainShootDnaAlerts";
import { generateShotListDraft } from "./generateShotListDraft";
import { planDeliverables } from "./planDeliverables";
import { recommendShootType } from "./recommendShootType";
import { saveApprovedShootDraft } from "./saveApprovedShootDraft";

// IPI-148 — SHOOT-AI-001: 7 shoot planner tools for production-planner
export const agentTools = {
  recommendShootType,
  planDeliverables,
  generateShotListDraft,
  saveApprovedShootDraft,
  approveShotList,
  estimateShootBudget,
  explainShootDnaAlerts,
} as const;

export type AgentToolName = keyof typeof agentTools;

export { callEdgeFunction, EdgeFunctionError } from "./edge";
