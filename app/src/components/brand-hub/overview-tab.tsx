import type { AiProfile, BrandScoreDetail } from "@/lib/brand-hub";
import { scoreColor, scoreLabel } from "@/lib/brand-utils";

type Props = {
  profile: AiProfile;
  baseScores: BrandScoreDetail[];
};

export const OverviewTab = ({ profile, baseScores }: Props) => {
  const scores = baseScores;

  return (
    <div className="space-y-6">
      {profile.tagline && (
        <p className="font-serif text-2xl italic text-[#1E293B]">{profile.tagline}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {profile.category && (
          <span className="rounded-full bg-[#F8F5F2] px-3 py-1 font-sans text-xs text-[#64748B]">
            {profile.category}
          </span>
        )}
        {profile.industry && (
          <span className="rounded-full bg-[#F8F5F2] px-3 py-1 font-sans text-xs text-[#64748B]">
            {profile.industry}
          </span>
        )}
        {profile.goal && (
          <span className="rounded-full bg-[#FEF3E8] px-3 py-1 font-sans text-xs text-[#E87C4D]">
            {profile.goal}
          </span>
        )}
      </div>

      {scores.length > 0 && (
        <section className="rounded-2xl border border-[#E8E0D8] bg-white p-6">
          <h3 className="mb-4 font-serif text-lg text-[#1E293B]">Quick scores</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {scores.map((s) => (
              <div key={s.score_type} className="text-center">
                <div
                  className="mx-auto flex h-12 w-12 items-center justify-center rounded-full font-sans text-sm font-medium text-white"
                  style={{ background: scoreColor(s.score) }}
                >
                  {s.score}
                </div>
                <p className="mt-1 font-sans text-xs text-[#64748B]">
                  {scoreLabel(s.score_type)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <BrandHubCTAs />
    </div>
  );
};

export const BrandHubCTAs = () => (
  <section className="flex flex-wrap gap-3">
    <a
      href="/app"
      className="rounded-full border border-[#D1C9C0] px-5 py-2.5 font-sans text-sm font-medium text-[#64748B] transition-colors hover:border-[#94A3B8]"
    >
      ← Dashboard
    </a>
    <a
      href="/app/shoots"
      className="rounded-full px-5 py-2.5 font-sans text-sm font-medium text-white transition-opacity hover:opacity-90"
      style={{ background: "#E87C4D" }}
    >
      Plan Shoot
    </a>
    <a
      href="/app/campaigns"
      className="rounded-full px-5 py-2.5 font-sans text-sm font-medium text-white transition-opacity hover:opacity-90"
      style={{ background: "#1E293B" }}
    >
      Create Campaign
    </a>
    <a
      href="/app/assets"
      className="rounded-full border border-[#D1C9C0] px-5 py-2.5 font-sans text-sm font-medium text-[#64748B] transition-colors hover:border-[#94A3B8]"
    >
      Analyze Assets
    </a>
  </section>
);
