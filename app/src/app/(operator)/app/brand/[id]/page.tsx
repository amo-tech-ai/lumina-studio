import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ id: string }>;
}

const scoreBadgeColor = (score: number) => {
  if (score >= 70) return "#059669"; // approved
  if (score >= 40) return "#D97706"; // review
  return "#DC2626";                  // blocked
};

export default async function BrandPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const [{ data: brand }, { data: scores }, { data: { user } }] = await Promise.all([
    supabase
      .from("brands")
      .select("id, name, ai_profile, org_id, created_at, organizations(name)")
      .eq("id", id)
      .single(),
    supabase
      .from("brand_scores")
      .select("score_type, score")
      .eq("brand_id", id),
    supabase.auth.getUser(),
  ]);

  if (!brand) notFound();

  const dnaScore = scores?.find((s) => s.score_type === "dna_readiness")?.score ?? 0;
  const orgName = (brand.organizations as { name?: string } | null)?.name ?? "";
  const profile = (brand.ai_profile ?? {}) as Record<string, unknown>;
  const createdDate = new Date(brand.created_at).toLocaleDateString("en-CA", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="min-h-screen p-8" style={{ background: "#FBF8F5" }}>
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-serif text-4xl text-[#1E293B]">{brand.name}</h1>
            {orgName && (
              <p className="font-sans text-[#64748B] mt-1">{orgName}</p>
            )}
            <p className="font-sans text-xs text-[#94A3B8] mt-1">Created {createdDate}</p>
          </div>

          {/* DNA Readiness score badge */}
          <div className="text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white font-sans font-semibold text-lg"
              style={{ background: scoreBadgeColor(dnaScore) }}
            >
              {dnaScore}
            </div>
            <p className="font-sans text-xs text-[#64748B] mt-1">DNA Score</p>
          </div>
        </div>

        {/* AI Profile */}
        <section className="rounded-2xl border border-[#E8E0D8] bg-white p-6 space-y-4">
          <h2 className="font-serif text-xl text-[#1E293B]">Brand Intelligence</h2>
          {Object.keys(profile).length > 0 ? (
            <dl className="space-y-3">
              {Object.entries(profile).map(([key, val]) => (
                <div key={key}>
                  <dt className="font-sans text-xs font-medium text-[#94A3B8] uppercase tracking-wide">
                    {key.replace(/_/g, " ")}
                  </dt>
                  <dd className="font-sans text-sm text-[#1E293B] mt-0.5">
                    {typeof val === "object" ? JSON.stringify(val) : String(val)}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="font-sans text-sm text-[#94A3B8]">
              No AI profile yet. Run Brand Intelligence to analyze this brand.
            </p>
          )}
        </section>

        {/* Quick actions */}
        <section className="flex gap-3 flex-wrap">
          <a
            href="/app"
            className="px-5 py-2.5 rounded-full font-sans text-sm font-medium text-[#64748B] border border-[#D1C9C0] hover:border-[#94A3B8] transition-colors"
          >
            ← Dashboard
          </a>
          <a
            href="/app/assets"
            className="px-5 py-2.5 rounded-full font-sans text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: "#E87C4D" }}
          >
            View Assets
          </a>
        </section>

      </div>
    </div>
  );
}
