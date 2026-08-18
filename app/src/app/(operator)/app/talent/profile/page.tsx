import Link from "next/link";
import { TalentProfileWorkspace } from "@/components/talent/talent-profile-workspace";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function TalentProfilePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const raw = params.talent ?? params.id ?? params.talentId;
  const talentId = Array.isArray(raw) ? raw[0] : raw;

  if (!talentId || typeof talentId !== "string") {
    return (
      <div style={{ padding: "40px 28px", maxWidth: 920, margin: "0 auto" }}>
        <EmptyState
          heading="No talent selected"
          body="Open a profile from Matching, or create yours if you don't have one yet."
          action={
            <Link href="/app/talent/onboarding" className="inline-flex">
              <Button size="sm">Create talent profile</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return <TalentProfileWorkspace talentId={talentId} />;
}
