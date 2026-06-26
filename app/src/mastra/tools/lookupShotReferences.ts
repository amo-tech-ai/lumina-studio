// IPI-184 SHOOT-DATA-002 — lookupShotReferences tool
// Queries shoot.shot_type_references (via public view) to give the
// production-planner agent real, DB-backed shot type suggestions filtered
// by product category and target channels.
//
// READ tool — uses service-role client directly (no edge fn needed for reads).

import { createTool } from "@mastra/core/tools";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

const ShotReferenceSchema = z.object({
  id: z.string(),
  category: z.string(),
  subcategory: z.string(),
  angle: z.string(),
  description: z.string(),
  channel_fit: z.array(z.string()),
  model_type: z.string().nullable(),
  background: z.string().nullable(),
  tags: z.array(z.string()),
});

export const lookupShotReferences = createTool({
  id: "lookupShotReferences",
  description:
    "Fetch vetted shot types from the iPix reference library filtered by product category and target channels. " +
    "Use this BEFORE generateShotListDraft to ground shot recommendations in real, curated shot types. " +
    "Returns angle names, descriptions, and which channels each shot covers.",
  inputSchema: z.object({
    category: z
      .enum(["clothing", "beauty", "accessories", "home_goods", "ai_services"])
      .describe("Product category to filter shot types"),
    channels: z
      .array(z.string())
      .min(1)
      .describe("Target channels (e.g. ['instagram_feed','amazon','shopify_pdp'])"),
    subcategory: z
      .enum(["flat_lay", "ghost", "model", "product", "swatch", "lifestyle", "ai", "any"])
      .optional()
      .default("any")
      .describe("Subcategory filter — use 'any' to get all subcategories"),
    limit: z.number().int().min(1).max(20).optional().default(10),
  }),
  outputSchema: z.object({
    shot_types: z.array(ShotReferenceSchema),
    total_found: z.number(),
    category: z.string(),
    channels_matched: z.array(z.string()),
  }),
  execute: async ({ category, channels, subcategory, limit }) => {
    const supabase = getAdminClient();

    // Query via the public view (service role bypasses RLS either way)
    let query = supabase
      .from("shot_type_references_view")
      .select("id, category, subcategory, angle, description, channel_fit, model_type, background, tags")
      .eq("category", category)
      // Filter rows where at least one of the requested channels appears in channel_fit
      .overlaps("channel_fit", channels);

    if (subcategory && subcategory !== "any") {
      query = query.eq("subcategory", subcategory);
    }

    const { data, error } = await query.limit(limit ?? 10);

    if (error) throw new Error(`lookupShotReferences failed: ${error.message}`);

    const rows = (data ?? []) as z.infer<typeof ShotReferenceSchema>[];

    // Derive which of the requested channels are actually covered by results
    const channelsCovered = new Set<string>();
    for (const row of rows) {
      for (const ch of row.channel_fit) {
        if (channels.includes(ch)) channelsCovered.add(ch);
      }
    }

    const uncovered = channels.filter((c) => !channelsCovered.has(c));
    if (uncovered.length) {
      // ponytail: don't throw — return what we have + note uncovered channels in output
      // The agent can flag gaps to the operator via explainShootDnaAlerts later
    }

    return {
      shot_types: rows,
      total_found: rows.length,
      category,
      channels_matched: [...channelsCovered],
    };
  },
});
