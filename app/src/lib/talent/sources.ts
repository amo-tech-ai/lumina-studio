import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface TalentProfileSource {
  id: string;
  talent_profile_id: string;
  field_name: string;
  source_url: string;
  confidence: number;
  extracted_at: string;
}

/**
 * Get the current authenticated user from Supabase session.
 */
async function getCurrentUser() {
  const supabase = createSupabaseBrowserClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error("Authentication required");
  }
  return user;
}

/**
 * Insert a verified source into talent_profile_sources.
 * Uses RLS - requires authenticated user to be profile owner or editor-or-above on agency_org_id.
 * RLS policy talent_profile_sources_insert_owner enforces:
 * - talent_profile_id must belong to a profile owned by auth.uid()
 * - OR talent_profile_id must belong to a profile where user is org_editor_or_above on agency_org_id
 */
export async function insertTalentProfileSource(
  talentProfileId: string,
  fieldName: string,
  sourceUrl: string,
  confidence: number
): Promise<TalentProfileSource | null> {
  const supabase = createSupabaseBrowserClient();

  // Verify user is authenticated (defense in depth - RLS also enforces this)
  await getCurrentUser();
  
  const { data, error } = await supabase
    .from("talent_profile_sources")
    .insert({
      talent_profile_id: talentProfileId,
      field_name: fieldName,
      source_url: sourceUrl,
      confidence: confidence,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to insert talent_profile_sources:", error);
    return null;
  }

  return data;
}

/**
 * Fetch all sources for a talent profile.
 */
export async function fetchTalentProfileSources(
  talentProfileId: string
): Promise<TalentProfileSource[]> {
  const supabase = createSupabaseBrowserClient();
  
  const { data, error } = await supabase
    .from("talent_profile_sources")
    .select("*")
    .eq("talent_profile_id", talentProfileId);

  if (error) {
    console.error("Failed to fetch talent_profile_sources:", error);
    return [];
  }

  return data || [];
}
