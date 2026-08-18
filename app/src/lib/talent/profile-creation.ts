import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { insertTalentProfileSource } from "./sources";

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

export interface CreateTalentProfileInput {
  displayName: string;
  bio?: string;
  handle?: string;
  niche?: string;
  tier?: string;
  location?: string;
  dayRate?: string;
  languages?: string[];
  sourceUrl: string;
  profileId?: string; // For self-managed talent (auth.uid())
  agencyOrgId?: string; // For agency-managed talent
}

export interface CreatedTalentProfile {
  id: string;
  displayName: string;
  bio: string | null;
  measurements: Record<string, unknown>;
  rates: Record<string, unknown>;
  languages: string[];
  travelReady: boolean;
  verificationStatus: string;
  createdAt: string;
}

/**
 * Create a talent profile with verified source evidence.
 * Uses RLS - requires authenticated user to be profile owner or editor-or-above on agency_org_id.
 */
export async function createTalentProfileWithSources(
  input: CreateTalentProfileInput,
  analyzedFields: Array<{ key: string; value: string; confidence: number; evidence: string }>
): Promise<{ profile: CreatedTalentProfile | null; sourcesInserted: number }> {
  const supabase = createSupabaseBrowserClient();

  // Get current authenticated user
  const user = await getCurrentUser();

  // Validate exactly one owner
  if (!input.profileId && !input.agencyOrgId) {
    throw new Error("Either profileId or agencyOrgId must be provided");
  }
  if (input.profileId && input.agencyOrgId) {
    throw new Error("Only one of profileId or agencyOrgId should be provided");
  }

  // Authorization check: user can only create profile for themselves (self-managed)
  // or if they have org editor permissions (agency-managed)
  if (input.profileId && input.profileId !== user.id) {
    throw new Error("Cannot create profile for another user");
  }

  // For agency-managed profiles, we rely on RLS to check org permissions
  // since client-side cannot verify org membership without additional queries

  // Create the talent profile
  const { data: profile, error: profileError } = await supabase
    .from("talent_profiles")
    .insert({
      profile_id: input.profileId || null,
      agency_org_id: input.agencyOrgId || null,
      display_name: input.displayName,
      bio: input.bio || null,
      measurements: {},
      rates: {
        tier: input.tier || null,
        day_rate: input.dayRate || null,
      },
      languages: input.languages || [],
      travel_ready: false,
      verification_status: "pending",
    })
    .select()
    .single();

  if (profileError || !profile) {
    console.error("Failed to create talent profile:", profileError);
    return { profile: null, sourcesInserted: 0 };
  }

  // Insert sources for each analyzed field
  let sourcesInserted = 0;
  for (const field of analyzedFields) {
    const source = await insertTalentProfileSource(
      profile.id,
      field.key,
      input.sourceUrl,
      field.confidence
    );
    if (source) sourcesInserted++;
  }

  return { profile, sourcesInserted };
}
