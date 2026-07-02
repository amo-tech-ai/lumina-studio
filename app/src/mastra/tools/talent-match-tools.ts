// IPI-308 · MODEL-P2 — Model Match Agent tools.
// READ/write via public.search_talent / get_or_create_shortlist / toggle_shortlist_item
// RPCs (IPI-308 migration) — talent.* tables aren't exposed via PostgREST directly
// (same isolation as shoot schema), so every access goes through these RPCs.
//
// search_talent/get_or_create_shortlist/toggle_shortlist_item all require
// auth.uid() (directly, or via is_org_member()) — a service-role client has
// no user JWT and would fail every call. Use the operator's real token via
// requestToken (AsyncLocalStorage, populated per-request in the CopilotKit
// route — see brand-intelligence-tools.ts for the same pattern) + a
// user-scoped Supabase client, so auth.uid() resolves inside the RPCs
// without the LLM ever seeing or supplying the token.

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { TalentResultSchema } from "@/lib/talent/types";
import { computeMatchScore } from "@/lib/talent/match-score";
import { createUserScopedClient } from "@/lib/shoot/commit-shoot-draft";
import { requestToken } from "@/lib/request-token";

function getUserScopedClient() {
  const accessToken = requestToken.getStore();
  if (!accessToken) throw new Error("Access token not available in request context");
  return createUserScopedClient(accessToken);
}

export const searchTalentByFilters = createTool({
  id: "searchTalentByFilters",
  description:
    "Browse/filter marketplace-safe talent profiles for the Matching screen's Talent tab. " +
    "Filter-based for MVP — no embedding similarity (that rides on IPI2-123 landing later).",
  inputSchema: z.object({
    shootType: z.string().optional().describe("Editorial/Commercial/Runway/UGC"),
    budgetTier: z.enum(["$", "$$", "$$$"]).optional(),
    dateStart: z.string().optional().describe("ISO date — availability window start"),
    dateEnd: z.string().optional().describe("ISO date — availability window end"),
    representation: z.enum(["independent", "agency"]).optional(),
    onlyShortlistId: z.string().optional().describe("Restrict results to this shortlist's items"),
  }),
  outputSchema: z.object({ results: z.array(TalentResultSchema) }),
  execute: async ({ shootType, budgetTier, dateStart, dateEnd, representation, onlyShortlistId }) => {
    const supabase = getUserScopedClient();
    const { data, error } = await supabase.rpc("search_talent", {
      p_shoot_type: shootType ?? null,
      p_budget_tier: budgetTier ?? null,
      p_date_start: dateStart ?? null,
      p_date_end: dateEnd ?? null,
      p_representation: representation ?? null,
      p_only_shortlist_id: onlyShortlistId ?? null,
    });
    if (error) throw new Error(`searchTalentByFilters failed: ${error.message}`);
    return { results: (data ?? []) as z.infer<typeof TalentResultSchema>[] };
  },
});

export const computeTalentMatchScore = createTool({
  id: "computeTalentMatchScore",
  description:
    "Score a talent profile's fit against a shoot brief (0-100) with a plain-language reason, " +
    "for EvidenceBlock's score/confidence/why fields. Filter-based scoring for MVP — no embeddings.",
  inputSchema: z.object({
    talent: TalentResultSchema,
    shootType: z.string().optional(),
    representationPreferred: z.enum(["independent", "agency"]).optional(),
  }),
  outputSchema: z.object({
    score: z.number().min(0).max(100),
    confidence: z.number().min(0).max(100),
    why: z.string(),
  }),
  execute: async ({ talent, shootType, representationPreferred }) =>
    computeMatchScore({ talent, shootType, representationPreferred }),
});

export const manageShortlist = createTool({
  id: "manageShortlist",
  description:
    "Add or remove a talent profile from the calling brand's shortlist (swipe-right / remove). " +
    "Minimal list for MVP — not a board.",
  inputSchema: z.object({
    orgId: z.string().describe("Brand organization id"),
    talentProfileId: z.string(),
    add: z.boolean().describe("true to add, false to remove"),
  }),
  outputSchema: z.object({ shortlistId: z.string(), added: z.boolean() }),
  execute: async ({ orgId, talentProfileId, add }) => {
    const supabase = getUserScopedClient();

    const { data: shortlistId, error: shortlistErr } = await supabase.rpc(
      "get_or_create_shortlist",
      { p_org_id: orgId },
    );
    if (shortlistErr || !shortlistId) {
      throw new Error(`manageShortlist: get_or_create_shortlist failed: ${shortlistErr?.message}`);
    }

    const { error: toggleErr } = await supabase.rpc("toggle_shortlist_item", {
      p_shortlist_id: shortlistId,
      p_talent_profile_id: talentProfileId,
      p_add: add,
    });
    if (toggleErr) throw new Error(`manageShortlist: toggle failed: ${toggleErr.message}`);

    return { shortlistId: shortlistId as string, added: add };
  },
});
