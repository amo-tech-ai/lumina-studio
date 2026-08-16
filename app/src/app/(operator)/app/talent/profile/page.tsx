import { TalentProfileWorkspace } from "@/components/talent/talent-profile-workspace";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function TalentProfilePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const raw = params.talent ?? params.id ?? params.talentId;
  const talentId = Array.isArray(raw) ? raw[0] : raw;

  if (!talentId || typeof talentId !== "string") {
    return (
      <div style={{ padding: "40px 28px", maxWidth: 920, margin: "0 auto" }}>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>Talent profile</h1>
        <p style={{ color: "#6b7280", marginTop: 8 }}>
          No talent selected. Open a profile from <a href="/app/matching" style={{ color: "#111", textDecoration: "underline" }}>Matching</a>.
        </p>
      </div>
    );
  }

  return <TalentProfileWorkspace talentId={talentId} />;
}
