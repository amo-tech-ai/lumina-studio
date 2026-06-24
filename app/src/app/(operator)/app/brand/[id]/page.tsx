import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { scoreColor, scoreLabel } from "@/lib/brand-utils";

interface Props {
  params: Promise<{ id: string }>;
}

interface AiProfile {
  tagline?: string;
  category?: string;
  targetAudience?: string;
  brandVoice?: string;
  contentPillars?: string[];
  recommendedServices?: string[];
  productionReadiness?: string;
  visualIdentity?: { colors?: string[]; mood?: string };
  score?: number;
}

const BrandPage = async ({ params }: Props) => {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const [{ data: brand }, { data: scores }] = await Promise.all([
    supabase
      .from("brands")
      .select("id, name, brand_url, ai_profile, org_id, created_at, organizations(name, plan)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("brand_scores").select("score_type, score").eq("brand_id", id),
  ]);

  if (!brand) notFound();

  const dnaScore = scores?.find((s) => s.score_type === "dna_readiness")?.score ?? 0;
  const org = brand.organizations as { name?: string; plan?: string } | null;
  const profile = (brand.ai_profile ?? {}) as AiProfile;
  const hasProfile = Object.keys(profile).length > 0;
  const createdDate = new Date(brand.created_at).toLocaleDateString("en-CA", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="min-h-screen p-8" style={{ background: "#FBF8F5" }}>
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="font-serif text-4xl text-[#1E293B]">{brand.name}</h1>
            {org?.name && (
              <p className="font-sans text-[#64748B] mt-1">
                {org.name}{org.plan ? ` · ${org.plan}` : ""}
              </p>
            )}
            {brand.brand_url && (
              <a
                href={brand.brand_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-xs text-[#E87C4D] hover:underline mt-0.5 block"
              >
                {brand.brand_url}
              </a>
            )}
            <p className="font-sans text-xs text-[#94A3B8] mt-1">Created {createdDate}</p>
          </div>

          {/* DNA Readiness badge */}
          <div className="text-center shrink-0">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white font-sans font-semibold text-lg"
              style={{ background: scoreColor(dnaScore) }}
            >
              {dnaScore}
            </div>
            <p className="font-sans text-xs text-[#64748B] mt-1">DNA Score</p>
          </div>
        </div>

        {/* All scores */}
        {scores && scores.length > 1 && (
          <section className="rounded-2xl border border-[#E8E0D8] bg-white p-6">
            <h2 className="font-serif text-xl text-[#1E293B] mb-4">Scores</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {scores.map((s) => (
                <div key={s.score_type} className="text-center">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-sans font-medium text-sm mx-auto"
                    style={{ background: scoreColor(s.score) }}
                  >
                    {s.score}
                  </div>
                  <p className="font-sans text-xs text-[#64748B] mt-1">{scoreLabel(s.score_type)}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* AI Profile */}
        <section className="rounded-2xl border border-[#E8E0D8] bg-white p-6 space-y-5">
          <h2 className="font-serif text-xl text-[#1E293B]">Brand Intelligence</h2>

          {!hasProfile ? (
            <p className="font-sans text-sm text-[#94A3B8]">Brand profile not analyzed yet.</p>
          ) : (
            <dl className="space-y-4">
              {profile.tagline && (
                <ProfileField label="Tagline" value={profile.tagline} />
              )}
              {profile.category && (
                <ProfileField label="Category" value={profile.category} />
              )}
              {profile.targetAudience && (
                <ProfileField label="Target Audience" value={profile.targetAudience} />
              )}
              {profile.brandVoice && (
                <ProfileField label="Brand Voice" value={profile.brandVoice} />
              )}
              {profile.productionReadiness && (
                <ProfileField label="Production Readiness" value={profile.productionReadiness} />
              )}
              {profile.visualIdentity?.mood && (
                <ProfileField label="Visual Mood" value={profile.visualIdentity.mood} />
              )}
              {profile.visualIdentity?.colors && profile.visualIdentity.colors.length > 0 && (
                <div>
                  <dt className="font-sans text-xs font-medium text-[#94A3B8] uppercase tracking-wide">Colors</dt>
                  <dd className="flex gap-2 mt-1 flex-wrap">
                    {profile.visualIdentity.colors.map((c) => (
                      <span key={c} className="font-sans text-xs bg-[#F8F5F2] px-2 py-0.5 rounded">{c}</span>
                    ))}
                  </dd>
                </div>
              )}
              {profile.contentPillars && profile.contentPillars.length > 0 && (
                <div>
                  <dt className="font-sans text-xs font-medium text-[#94A3B8] uppercase tracking-wide">Content Pillars</dt>
                  <dd className="flex gap-2 mt-1 flex-wrap">
                    {profile.contentPillars.map((p) => (
                      <span key={p} className="font-sans text-xs bg-[#FEF3E8] text-[#E87C4D] px-2 py-0.5 rounded">{p}</span>
                    ))}
                  </dd>
                </div>
              )}
              {profile.recommendedServices && profile.recommendedServices.length > 0 && (
                <div>
                  <dt className="font-sans text-xs font-medium text-[#94A3B8] uppercase tracking-wide">Recommended Services</dt>
                  <dd className="flex gap-2 mt-1 flex-wrap">
                    {profile.recommendedServices.map((s) => (
                      <span key={s} className="font-sans text-xs bg-[#F0FDF4] text-[#059669] px-2 py-0.5 rounded">{s}</span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          )}
        </section>

        {/* CTAs */}
        <section className="flex gap-3 flex-wrap">
          <a
            href="/app"
            className="px-5 py-2.5 rounded-full font-sans text-sm font-medium text-[#64748B] border border-[#D1C9C0] hover:border-[#94A3B8] transition-colors"
          >
            ← Dashboard
          </a>

          <a
            href="/app/shoots"
            className="px-5 py-2.5 rounded-full font-sans text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: "#E87C4D" }}
          >
            Plan Shoot
          </a>
          <a
            href="/app/campaigns"
            className="px-5 py-2.5 rounded-full font-sans text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: "#1E293B" }}
          >
            Create Campaign
          </a>
          <a
            href="/app/assets"
            className="px-5 py-2.5 rounded-full font-sans text-sm font-medium text-[#64748B] border border-[#D1C9C0] hover:border-[#94A3B8] transition-colors"
          >
            Analyze Assets
          </a>
        </section>

      </div>
    </div>
  );
};

export default BrandPage;

const ProfileField = ({ label, value }: { label: string; value: string }) => (
  <div>
    <dt className="font-sans text-xs font-medium text-[#94A3B8] uppercase tracking-wide">{label}</dt>
    <dd className="font-sans text-sm text-[#1E293B] mt-0.5">{value}</dd>
  </div>
);
