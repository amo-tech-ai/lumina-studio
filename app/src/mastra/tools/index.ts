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
import { discoverSocialChannelsTool } from "./social-discovery";
import { lookupShotReferences } from "./lookupShotReferences";
import { lookupChannelSpecs } from "./lookupChannelSpecs";
import { searchTalentByFilters, computeTalentMatchScore, manageShortlist } from "./talent-match-tools";
import {
  searchCompanies,
  searchContacts,
  logActivity,
  moveDealStage,
} from "./crm";
import { checkTalentAvailability, draftBookingQuote, createBookingDraft } from "./booking-tools";
import { getAssetDnaEvidence } from "./getAssetDnaEvidence";
import { suggestAssetRetakes } from "./suggestAssetRetakes";
import { draftBulkAssetApproval } from "./draftBulkAssetApproval";

// IPI-148 — SHOOT-AI-001 + IPI-184 SHOOT-DATA-002: shoot planner tools for production-planner
// IPI-187 — MI-02: media spec lookup
// IPI-308 — MODEL-P2: Model Match Agent tools (Talent tab, shortlist)
// IPI-348 — MODELGATE-10: Booking Agent tools (wizard, inbox, roster)
// IPI-261 — DESIGN-077: Creative Director asset-intelligence tools (read-only DNA
// evidence, deterministic retake suggestions, proposal-only bulk approval draft)
export const agentTools = {
  recommendShootType,
  planDeliverables,
  lookupShotReferences,   // DB-backed shot type suggestions — call before generateShotListDraft
  lookupChannelSpecs,     // exact image specs per platform channel (MI-02)
  generateShotListDraft,
  saveApprovedShootDraft,
  approveShotList,
  estimateShootBudget,
  explainShootDnaAlerts,
  discoverSocialChannels: discoverSocialChannelsTool,
  searchTalentByFilters,
  computeTalentMatchScore,
  manageShortlist,
  searchCompanies,
  searchContacts,
  logActivity,
  moveDealStage,
  checkTalentAvailability,
  draftBookingQuote,
  createBookingDraft,
  getAssetDnaEvidence,
  suggestAssetRetakes,
  draftBulkAssetApproval,
} as const;

export type AgentToolName = keyof typeof agentTools;

export { callEdgeFunction, EdgeFunctionError } from "./edge";
