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

  const [{ data: brand }, { data: scores }] = await Promise.all([
    supabase
      .from("brands")
      .select(
        "id, name, brand_url, ai_profile, org_id, created_at, intake_status, organizations(name, plan)",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("brand_scores")
      .select("score_type, score, details, source, score_version")
      .eq("brand_id", id),
  ]);

  if (!brand) notFound();

  const org = brand.organizations as { name?: string; plan?: string } | null;
  const profile = parseAiProfile(brand.ai_profile);
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
      dnaScore={dnaScore}
      profile={profile}
      displayScores={displayScores}
      baseScores={baseScores}
      activityEvents={activityEvents}
    />
  );
};

export default BrandPage;
