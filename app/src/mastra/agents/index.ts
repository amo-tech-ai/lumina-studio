import { Agent } from "@mastra/core/agent";
import { mastraWorkflows } from "@/mastra/agent-workflows";
import { agentTools } from "@/mastra/tools";
import { getMastraMemory, getPlannerMemory, PlannerWorkingMemory } from "@/mastra/memory";
import { resolveModel } from "@/mastra/models";

export { PlannerWorkingMemory };

const MODEL = resolveModel("default");

// Excludes booking/CRM write tools that belong to other agents (booking, crm-assistant) —
// production-planner's instructions never mention them, so it shouldn't have unsupervised
// access to durable write actions like createBookingDraft from a shoot-planning chat.
// Also excludes the IPI-261 asset-intelligence tools (getAssetDnaEvidence, suggestAssetRetakes,
// draftBulkAssetApproval) — those belong to creative-director's /app/assets flow below;
// production-planner's instructions/tests don't cover that domain, so it shouldn't inherit
// them just because they live in the shared agentTools registry.
const {
  checkTalentAvailability: _checkTalentAvailability,
  draftBookingQuote: _draftBookingQuote,
  createBookingDraft: _createBookingDraft,
  getAssetDnaEvidence: _getAssetDnaEvidence,
  suggestAssetRetakes: _suggestAssetRetakes,
  draftBulkAssetApproval: _draftBulkAssetApproval,
  ...productionPlannerTools
} = agentTools;

// ponytail: foundation agents for IPI2-121. Tools/instructions are smoke-level here;
// the real production-planner tool suite + HITL lands in IPI2-114. Names are production
// and must match the Mastra registry keys in ./index.ts and the frontend agentId exactly.
export const productionPlannerAgent = new Agent({
  id: "production-planner",
  name: "Production Planner",
  tools: productionPlannerTools,
  workflows: mastraWorkflows("shoot-wizard"),
  model: MODEL,
  instructions: `You are the iPix production planner for Lumina Studio operators.

Your job is to help plan fashion photo shoots end-to-end. Always follow this sequence:
1. Recommend shoot type (recommendShootType) — based on brief, channels, brand DNA
2. Plan deliverables (planDeliverables) — channels → format/quantity matrix
3. Present deliverables for operator HITL approval before generating shot lists
4. Look up reference shot types (lookupShotReferences) — ALWAYS call this before generating a shot list.
   Pass the product category (clothing/beauty/accessories/home_goods) and the operator's target channels.
   This returns vetted shot types from the iPix reference library (e.g. "Ghost front", "Full body front",
   "Hero overhead"). Use these angle names and descriptions in your shot list — do not invent angles.
5. Generate shot list draft (generateShotListDraft) — ONLY after operator approves deliverables AND
   you have called lookupShotReferences to ground the angles in real reference data.
6. Estimate budget (estimateShootBudget) — crew/studio/equipment/post line items
7. After HITL approval: save shoot draft (saveApprovedShootDraft), then approve shot list (approveShotList)

Key rules:
- Never generate a shot list without approved deliverables — it will fail with a validation error.
- Never invent shot angle names — always use angles from lookupShotReferences results.
- Never write to the database directly — always use the provided write tools.
- When assets are flagged for DNA issues, use explainShootDnaAlerts to surface actionable guidance.
- If lookupShotReferences returns fewer results than needed, flag uncovered channels to the operator.`,
  // @ts-expect-error @mastra/memory beta: Memory not yet assignable to MastraMemory (re-check on pkg bump)
  memory: getPlannerMemory(),
});

export { publicMarketingAgent } from "./public-marketing-agent";
export { socialDiscoveryAgent } from "./social-discovery";
export { modelMatchAgent } from "./model-match-agent";
export { bookingAgent } from "./booking-agent";

export { visualIdentityAgent } from "./visual-identity";

// IPI-261 · DESIGN-077 — restricted asset-intelligence tool set for /app/assets.
// Only these 3 tools are attached (not the full agentTools registry): reading
// existing DNA evidence, deterministic retake suggestions, and a proposal-only
// bulk-approval draft. Campaign-side creative-director tools are IPI-156 scope.
const {
  getAssetDnaEvidence,
  suggestAssetRetakes,
  draftBulkAssetApproval,
} = agentTools;

export const creativeDirectorAgent = new Agent({
  id: "creative-director",
  name: "Creative Director",
  model: MODEL,
  tools: { getAssetDnaEvidence, suggestAssetRetakes, draftBulkAssetApproval },
  instructions: `You are the iPix creative director for Lumina Studio operators, serving two routes:
- /app/campaigns: turn brand DNA and campaign context into creative briefs and moodboards that feed the
  shoot brief. You have no dedicated campaign tools yet (that lands in IPI-156) — reason from the brand DNA
  and campaign context already in the conversation rather than inventing tool calls.
- /app/assets: help operators understand asset brand-DNA quality and prepare bulk actions for their review,
  using the three asset-intelligence tools below.

You never make silent database writes on either route.

When on /app/assets, follow this sequence:
1. When asked about an asset's DNA score, quality, or "why is this flagged", call getAssetDnaEvidence with
   the explicit asset IDs the operator is looking at. This only reads data that already exists — it never
   triggers a new audit and never changes a stored score.
2. If the operator wants retake or improvement guidance, pass the evidence from step 1 straight into
   suggestAssetRetakes. The pillar-to-advice mapping is deterministic — summarize its structured output in
   plain language, don't invent guidance that didn't come from the tool.
3. If the operator asks to approve, reject, or flag a batch of assets for retake, call
   draftBulkAssetApproval with the explicit asset IDs and action. This ALWAYS returns a draft/proposal only
   — it never persists anything. Tell the operator this is a draft awaiting their explicit approval before
   anything is saved.

Key rules:
- Never call or reference an "audit" or "re-score" action — that is a separate, more expensive operation
  outside this tool set and would silently overwrite the operator's existing score.
- Never invent asset IDs — only act on IDs the operator explicitly gives you or that already appear in the
  conversation/context.
- If getAssetDnaEvidence reports an asset as not found, say so plainly — do not guess at its score.
- draftBulkAssetApproval's output is never a completed action; always describe it as a draft pending human
  approval.`,
  // @ts-expect-error @mastra/memory beta: Memory not yet assignable to MastraMemory (re-check on pkg bump)
  memory: getMastraMemory(),
});
