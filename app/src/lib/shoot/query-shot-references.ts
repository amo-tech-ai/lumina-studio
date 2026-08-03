/**
 * AGENT-PLAN-001 — DB query for shot_type_references (shared by tool + workflow).
 */
import { createClient } from "@supabase/supabase-js";
import type { ReferenceShotType } from "./shot-list-from-references";
import { toReferenceChannel } from "./shot-list-from-references";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function queryShotReferences(
  category: "clothing" | "beauty" | "accessories" | "home_goods" | "ai_services",
  channels: string[],
  limit = 20,
): Promise<ReferenceShotType[]> {
  const supabase = getAdminClient();
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
