import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandHubClient } from "@/components/brand-hub/brand-hub-client";
import {
  buildActivityTimeline,
  filterDisplayScores,
  getBaseScores,
  parseAiProfile,
  type BrandScoreDetail,
} from "@/lib/brand-hub";
import { computeDnaScore } from "@/lib/brand-scores";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ id: string }>;
}

const BrandPage = async ({ params }: Props) => {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen p-8" style={{ background: "#FBF8F5" }}>
        <p className="font-sans text-sm text-[#64748B]">
          Sign in to view this brand profile.
        </p>
        <Link
          href={`/login?redirect=/app/brand/${id}`}
          className="mt-4 inline-block rounded-full px-5 py-2.5 font-sans text-sm font-medium text-white"
          style={{ background: "#E87C4D" }}
        >
          Sign in
        </Link>
      </div>
    );
  }

  const [{ data: brand }, { data: scores }, { data: crawls }] = await Promise.all([
    supabase
      .from("brands")
      .select(
        "id, name, brand_url, ai_profile, ai_profile_draft, org_id, created_at, intake_status, organizations(name, plan)",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("brand_scores")
      .select("score_type, score, details, source, score_version")
      .eq("brand_id", id),
    supabase
      .from("brand_crawls")
      .select("status, pages_crawled, pages_found")
      .eq("brand_id", id)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  if (!brand) notFound();

  const org = brand.organizations as { name?: string; plan?: string } | null;
  const profile = parseAiProfile(brand.ai_profile);
  const draftProfile = brand.intake_status === "draft_ready" ? parseAiProfile(brand.ai_profile_draft) : null;
  const scoreRows = (scores ?? []) as BrandScoreDetail[];
  const displayScores = filterDisplayScores(scoreRows);
  const baseScores = getBaseScores(scoreRows);
  const dnaScore = computeDnaScore(scores);
  const createdDate = new Date(brand.created_at).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const activityEvents = buildActivityTimeline({
    createdAt: brand.created_at,
    intakeStatus: brand.intake_status,
    profile,
  });

  return (
    <BrandHubClient
      brandId={brand.id}
      brandName={brand.name}
      brandUrl={brand.brand_url}
      orgName={org?.name}
      orgPlan={org?.plan}
      createdDate={createdDate}
      intakeStatus={brand.intake_status}
      draftProfile={draftProfile}
      crawlPages={crawls?.[0] ?? null}
      dnaScore={dnaScore}
      profile={profile}
      displayScores={displayScores}
      baseScores={baseScores}
      activityEvents={activityEvents}
    />
  );
};

export default BrandPage;
