import Link from "next/link";
import type { AiProfile, BrandScoreDetail } from "@/lib/brand-hub";
import { scoreColor, scoreLabel } from "@/lib/brand-utils";

type Props = {
  profile: AiProfile;
  baseScores: BrandScoreDetail[];
};

// AC1 — Gaps: derived from existing AiProfile fields, no new data needed
const GapsSection = ({ profile }: { profile: AiProfile }) => {
  const gaps: { label: string; hint: string }[] = [];
  // confidenceScore is 0–100 (not 0–1)
  if (profile.confidenceScore !== undefined && profile.confidenceScore < 60)
    gaps.push({ label: "Low analysis confidence", hint: `${Math.round(profile.confidenceScore)}% — more web presence may improve accuracy` });
  if (!profile.instagram_handle)
    gaps.push({ label: "Weak social presence", hint: "No Instagram handle detected" });
  if (!profile.evidenceSources || profile.evidenceSources.length < 2)
    gaps.push({ label: "Limited source coverage", hint: "Fewer than 2 sources found during crawl" });
  if (!profile.uvp)
    gaps.push({ label: "UVP not identified", hint: "Unique value proposition missing from web content" });
  if (gaps.length === 0) return null;
  return (
    <section className="rounded-2xl border border-[#FEE2E2] bg-[#FFF8F8] p-5">
      <h3 className="mb-3 font-serif text-base text-[#1E293B]">Gaps to address</h3>
      <ul className="space-y-2">
        {gaps.map((g) => (
          <li key={g.label} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#DC2626]" aria-hidden />
            <span className="font-sans text-sm text-[#1E293B]">
              <strong className="font-medium">{g.label}</strong>
              <span className="text-[#64748B]"> — {g.hint}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};

// AC4 — Recommended actions: uses profile.recommendedServices when available
const DEFAULT_ACTIONS = [
  { label: "Plan Shoot", href: "/app/shoots", hint: "Schedule a content shoot" },
  { label: "Create Campaign", href: "/app/campaigns", hint: "Build a campaign brief" },
  { label: "Analyze Assets", href: "/app/assets", hint: "Score content DNA compliance" },
];

const RecommendedActionsPanel = ({ services }: { services?: string[] }) => {
  const actions =
    services && services.length > 0
      ? services.slice(0, 3).map((s) => ({ label: s.trim(), href: "/app", hint: `AI-recommended: ${s.trim()}` }))
      : DEFAULT_ACTIONS;
  return (
    <section className="rounded-2xl border border-[#E8E0D8] bg-white p-5">
      <h3 className="mb-3 font-serif text-base text-[#1E293B]">Recommended next steps</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        {actions.map((a, i) => (
          <Link
            key={`${a.label}-${i}`}
            href={a.href}
            className="group flex flex-col gap-1 rounded-xl border border-[#E8E0D8] p-4 transition-colors hover:border-[#E87C4D]"
          >
            <span className="font-sans text-sm font-medium text-[#1E293B] group-hover:text-[#E87C4D]">
              {a.label}
            </span>
            <span className="font-sans text-xs text-[#64748B]">{a.hint}</span>
          </Link>
        ))}
      </div>
    </section>
  );
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

      <GapsSection profile={profile} />

      <RecommendedActionsPanel services={profile.recommendedServices} />

      <BrandHubCTAs />
    </div>
  );
};

export const BrandHubCTAs = () => (
  <section className="flex flex-wrap gap-3">
    <Link
      href="/app"
      className="rounded-full border border-[#D1C9C0] px-5 py-2.5 font-sans text-sm font-medium text-[#64748B] transition-colors hover:border-[#94A3B8]"
    >
      ← Dashboard
    </Link>
    <Link
      href="/app/shoots"
      className="rounded-full px-5 py-2.5 font-sans text-sm font-medium text-white transition-opacity hover:opacity-90"
      style={{ background: "#E87C4D" }}
    >
      Plan Shoot
    </Link>
    <Link
      href="/app/campaigns"
      className="rounded-full px-5 py-2.5 font-sans text-sm font-medium text-white transition-opacity hover:opacity-90"
      style={{ background: "#1E293B" }}
    >
      Create Campaign
    </Link>
    <Link
      href="/app/assets"
      className="rounded-full border border-[#D1C9C0] px-5 py-2.5 font-sans text-sm font-medium text-[#64748B] transition-colors hover:border-[#94A3B8]"
    >
      Analyze Assets
    </Link>
  </section>
);
