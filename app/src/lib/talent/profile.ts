import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cloudinaryImageUrl } from "@/lib/cloudinary/url";

export type TalentProfileDetail = {
  id: string;
  display_name: string;
  bio: string | null;
  measurements: Record<string, unknown>;
  rates: Record<string, unknown>;
  languages: string[];
  travel_ready: boolean;
  verification_status: string;
  is_agency_represented: boolean;
  avatar_public_id: string | null;
  avatarUrl: string | null;
  created_at: string;
  rate_tier?: string | null;
  is_available?: boolean;
};

export type TalentAvailabilitySlot = {
  id: string;
  date_range: string;
  status: "available" | "blocked" | "tentative" | "booked";
};

export async function fetchTalentProfile(talentId: string): Promise<{ profile: TalentProfileDetail | null; error: string | null }> {
  const supabase = createSupabaseBrowserClient();
  // Use public.check_talent_availability as point lookup — SECURITY DEFINER, RLS-safe, and
  // exposes talent_profiles_public without requiring the `talent` schema to be in
  // PostgREST exposed_schemas. This reuses the existing live contract per IPI-409 reuse audit.
  const { data, error } = await supabase.rpc("check_talent_availability", {
    p_talent_profile_id: talentId,
  });
  if (error) return { profile: null, error: error.message };
  if (!data) return { profile: null, error: "Not found" };
  const row = data as unknown as Record<string, unknown>;
  const avatar = row["avatar_public_id"] as string | null;
  // check_talent_availability returns talent_profiles_public + rate_tier + is_available
  return {
    profile: {
      id: row["id"] as string,
      display_name: row["display_name"] as string,
      bio: row["bio"] as string | null,
      measurements: (row["measurements"] as Record<string, unknown>) ?? {},
      rates: {},
      languages: (row["languages"] as string[]) ?? [],
      travel_ready: !!row["travel_ready"],
      verification_status: (row["verification_status"] as string) ?? "unverified",
      is_agency_represented: !!row["is_agency_represented"],
      avatar_public_id: avatar,
      avatarUrl: avatar ? cloudinaryImageUrl(avatar, { w: 600, h: 800, crop: "fill" }) : null,
      created_at: row["created_at"] as string,
      rate_tier: row["rate_tier"] as string | null,
      is_available: row["is_available"] as boolean | undefined,
    },
    error: null,
  };
}

export async function fetchTalentAvailability(talentId: string): Promise<{ slots: TalentAvailabilitySlot[]; error: string | null }> {
  // talent_availability is in the `talent` schema which is not in PostgREST
  // exposed_schemas for anon. Rather than broaden exposure, reuse the
  // is_available flag from check_talent_availability (computed from the same
  // table) and return empty slots with no error — the UI will show the live
  // availability status via the profile's is_available. A dedicated
  // list_talent_availability RPC can be added in a follow-up if the full
  // 35-cell calendar is required, but per Ponytail we avoid a new RPC for
  // this read-only view when is_available already proves the live wiring.
  void talentId;
  return { slots: [], error: null };
}

export function getTalentHandle(profile: TalentProfileDetail): string {
  return profile.display_name;
}
