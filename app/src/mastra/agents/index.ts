import { Agent } from "@mastra/core/agent";
import { mastraWorkflows } from "@/mastra/agent-workflows";
import { agentTools } from "@/mastra/tools";
import { getMastraMemory, getPlannerMemory, PlannerWorkingMemory } from "@/mastra/memory";
import { resolveModel } from "@/mastra/models";

export { PlannerWorkingMemory };

const MODEL = resolveModel("default");

// ponytail: foundation agents for IPI2-121. Tools/instructions are smoke-level here;
// the real production-planner tool suite + HITL lands in IPI2-114. Names are production
// and must match the Mastra registry keys in ./index.ts and the frontend agentId exactly.
export const productionPlannerAgent = new Agent({
  id: "production-planner",
  name: "Production Planner",
  tools: agentTools,
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

export { visualIdentityAgent } from "./visual-identity";

export const creativeDirectorAgent = new Agent({
  id: "creative-director",
  name: "Creative Director",
  model: MODEL,
  instructions:
    "You are the iPix creative director. Turn brand DNA and campaigns into creative briefs and moodboards that feed the shoot brief.",
  // @ts-expect-error @mastra/memory beta: Memory not yet assignable to MastraMemory (re-check on pkg bump)
  memory: getMastraMemory(),
});
