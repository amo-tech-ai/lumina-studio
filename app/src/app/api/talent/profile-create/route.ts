import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";

interface CreateTalentProfileRequest {
  displayName: string;
  bio?: string;
  handle?: string;
  niche?: string;
  tier?: string;
  location?: string;
  dayRate?: string;
  languages?: string[];
  sourceUrl: string;
  profileId?: string;
  agencyOrgId?: string;
  analyzedFields: Array<{ 
    key: string; 
    value: string; 
    confidence: number; 
    evidence: string 
  }>;
}

interface CreateTalentProfileResponse {
  success: boolean;
  profile?: {
    id: string;
    displayName: string;
    bio: string | null;
    verificationStatus: string;
    createdAt: string;
  };
  sourcesInserted: number;
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body: CreateTalentProfileRequest = await req.json();
    const {
      displayName,
      bio,
      handle,
      niche,
      tier,
      location,
      dayRate,
      languages,
      sourceUrl,
      profileId,
      agencyOrgId,
      analyzedFields,
    } = body;

    // Validate exactly one owner
    if (!profileId && !agencyOrgId) {
      return NextResponse.json(
        { success: false, error: "Either profileId or agencyOrgId must be provided" },
        { status: 400 }
      );
    }
    if (profileId && agencyOrgId) {
      return NextResponse.json(
        { success: false, error: "Only one of profileId or agencyOrgId should be provided" },
        { status: 400 }
      );
    }

    // Authorization check: user can only create profile for themselves (self-managed)
    if (profileId && profileId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Cannot create profile for another user" },
        { status: 403 }
      );
    }

    // Create the talent profile in talent schema
    const { data: profile, error: profileError } = await supabase
      .from("talent_profiles")
      .insert({
        profile_id: profileId || null,
        agency_org_id: agencyOrgId || null,
        display_name: displayName,
        bio: bio || null,
        measurements: {
          handle: handle || null,
          niche: niche || null,
          location: location || null,
        },
        rates: {
          tier: tier || null,
          day_rate: dayRate || null,
        },
        languages: languages || [],
        travel_ready: false,
        verification_status: "pending",
      })
      .select()
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: "Failed to create talent profile" },
        { status: 500 }
      );
    }

    // Insert sources for each analyzed field
    let sourcesInserted = 0;
    const sourceErrors: string[] = [];

    for (const field of analyzedFields) {
      const { error: sourceError } = await supabase
        .from("talent_profile_sources")
        .insert({
          talent_profile_id: profile.id,
          field_name: field.key,
          source_url: sourceUrl,
          confidence: field.confidence,
        });

      if (sourceError) {
        sourceErrors.push(`Failed to insert source for ${field.key}`);
      } else {
        sourcesInserted++;
      }
    }

    // If any source insert failed, treat as partial failure
    if (sourceErrors.length > 0) {
      return NextResponse.json(
        { success: false, error: "Failed to insert all provenance rows" },
        { status: 500 }
      );
    }

    return NextResponse.json<CreateTalentProfileResponse>({
      success: true,
      profile: {
        id: profile.id,
        displayName: profile.display_name,
        bio: profile.bio,
        verificationStatus: profile.verification_status,
        createdAt: profile.created_at,
      },
      sourcesInserted,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to create talent profile" },
      { status: 500 }
    );
  }
}
