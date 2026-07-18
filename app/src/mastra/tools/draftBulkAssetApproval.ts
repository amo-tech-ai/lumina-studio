// IPI-261 · DESIGN-077 — draftBulkAssetApproval Mastra tool
// Proposal-only: validates the requested assets are RLS-visible to the
// operator and belong to a single brand, then returns a DRAFT approval
// object for human review. Performs a read to validate the selection —
// NEVER an insert/update/upsert/delete. Any future durable approval action
// must pause for explicit human approval via this repo's CopilotKit v2
// useInterrupt convention (not built here — backend-tools-only PR).
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createUserScopedClient } from "@/lib/shoot/commit-shoot-draft";
import { requestToken } from "@/lib/request-token";

const ACTIONS = ["approve", "reject", "request_retake"] as const;

type AssetRow = {
  id: string;
  brand_id: string | null;
};

const UNASSIGNED_BRAND_KEY = "__unassigned__";

export const draftBulkAssetApproval = createTool({
  id: "draftBulkAssetApproval",
  description:
    "Build a bulk-approval PROPOSAL for explicit asset IDs. Validates the assets are RLS-visible to the " +
    "operator and belong to a single brand, then returns a draft object for human review. Performs zero " +
    "persistence — this tool never writes to any table. A durable approval action must land in a later PR " +
    "gated behind explicit useInterrupt HITL approval.",
  inputSchema: z.object({
    assetIds: z.array(z.string().uuid()).min(1).max(50),
    action: z.enum(ACTIONS),
    note: z.string().max(2000).optional(),
  }),
  outputSchema: z.object({
    ok: z.boolean(),
    reason: z.string().nullable(),
    invalidAssetIds: z.array(z.string()),
    proposal: z
      .object({
        status: z.literal("draft"),
        action: z.enum(ACTIONS),
        assetIds: z.array(z.string()),
        assetCount: z.number(),
        brandId: z.string(),
        note: z.string().nullable(),
        summary: z.string(),
        requiresHumanApproval: z.literal(true),
      })
      .nullable(),
  }),
  execute: async ({ assetIds, action, note }) => {
    const accessToken = requestToken.getStore();
    if (!accessToken) throw new Error("Access token not available in request context");

    const supabase = createUserScopedClient(accessToken);
    const { data, error } = await supabase
      .from("assets")
      .select("id, brand_id")
      .in("id", assetIds);

    if (error) throw new Error(`draftBulkAssetApproval failed: ${error.message}`);

    const rows = (data ?? []) as AssetRow[];
    const byId = new Map(rows.map((row) => [row.id, row]));
    const invalidAssetIds = assetIds.filter((id) => !byId.has(id));

    if (invalidAssetIds.length) {
      return {
        ok: false,
        reason: `${invalidAssetIds.length} asset(s) not found or not accessible to this operator`,
        invalidAssetIds,
        proposal: null,
      };
    }

    const brandKeys = new Set(rows.map((row) => row.brand_id ?? UNASSIGNED_BRAND_KEY));
    if (brandKeys.size > 1) {
      return {
        ok: false,
        reason: "Selected assets span multiple brands — bulk approval must be scoped to a single brand",
        invalidAssetIds: [],
        proposal: null,
      };
    }

    const brandId = rows[0]?.brand_id;
    if (!brandId) {
      return {
        ok: false,
        reason: "Selected assets have no brand association — cannot bulk-approve unassigned assets",
        invalidAssetIds: [],
        proposal: null,
      };
    }

    return {
      ok: true,
      reason: null,
      invalidAssetIds: [],
      proposal: {
        status: "draft" as const,
        action,
        assetIds,
        assetCount: assetIds.length,
        brandId,
        note: note ?? null,
        summary: `Draft: ${action} ${assetIds.length} asset${assetIds.length === 1 ? "" : "s"} for brand ${brandId}. Awaiting human approval — no changes have been made.`,
        requiresHumanApproval: true as const,
      },
    };
  },
});
