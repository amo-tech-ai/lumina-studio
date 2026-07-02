import Link from "next/link";
import { notFound } from "next/navigation";

import { BrandDetailWorkspace } from "@/components/brand-hub/brand-detail-workspace";
import { getBaseScores, parseAiProfile, type BrandScoreDetail } from "@/lib/brand-hub";
import { computeDnaScore } from "@/lib/brand-scores";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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
      <BrandDetailWorkspace
        brandId={id}
        brandName="Brand"
        brandUrl={null}
        intakeStatus={null}
        dnaScore={0}
        profile={{}}
        draftProfile={null}
        baseScores={[]}
        isAuthenticated={false}
      />
    );
  }

  const [{ data: brand }, { data: scores }, { data: crawls }, { data: intakeDraft }] =
    await Promise.all([
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
        .select("job_status, pages_crawled, pages_found")
        .eq("brand_id", id)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("brand_intake_drafts")
        .select("draft_profile")
        .eq("brand_id", id)
        .eq("status", "pending_approval")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  if (!brand) notFound();

  const profile = parseAiProfile(brand.ai_profile);
  const draftProfile =
    brand.intake_status === "draft_ready" ? parseAiProfile(brand.ai_profile_draft) : null;
  const dp = intakeDraft?.draft_profile as Record<string, unknown> | null;
  const workflowRunId = (dp?._workflow_run_id as string) ?? null;
  const scoreRows = (scores ?? []) as BrandScoreDetail[];
  const baseScores = getBaseScores(scoreRows);
  const dnaScore = computeDnaScore(scores);

  return (
    <BrandDetailWorkspace
      brandId={brand.id}
      brandName={brand.name}
      brandUrl={brand.brand_url}
      intakeStatus={brand.intake_status}
      dnaScore={dnaScore}
      profile={profile}
      draftProfile={draftProfile}
      workflowRunId={workflowRunId}
      baseScores={baseScores}
      crawlPages={crawls?.[0] ?? null}
      isAuthenticated
    />
  );
};

export default BrandPage;
