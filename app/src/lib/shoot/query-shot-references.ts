/**
 * AGENT-PLAN-001 — DB query for shot_type_references (shared by tool + workflow).
 */
import { createSupabaseAdminClient } from "@/app/api/_lib/supabase-admin";
import type { ReferenceShotType } from "./shot-list-from-references";
import { toReferenceChannel } from "./shot-list-from-references";

export async function queryShotReferences(
  category: "clothing" | "beauty" | "accessories" | "home_goods" | "ai_services",
  channels: string[],
  limit = 20,
): Promise<ReferenceShotType[]> {
  const supabase = createSupabaseAdminClient();
  const refChannels = [...new Set(channels.map(toReferenceChannel))];

  const { data, error } = await supabase
    .from("shot_type_references_view")
    .select("id, angle, description, channel_fit, background")
    .eq("category", category)
    .overlaps("channel_fit", refChannels)
    .limit(limit);

  if (error) throw new Error(`queryShotReferences failed: ${error.message}`);

  return (data ?? []) as ReferenceShotType[];
}
