"use client";

// IPI-308 · MODEL-P2 — Matching tab shell. Talent is the only live tab;
// Creator/Asset/Product stay disabled shells (IPI2-123).
import { TalentMatchTabs } from "@/components/matching/talent-match-tabs";
import { TalentTab } from "@/components/matching/talent-tab";

export default function MatchingPage() {
  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div>
        <h1 className="font-sans text-lg font-semibold text-[#111]">Matching</h1>
      </div>
      <TalentMatchTabs />
      <div className="flex-1 overflow-hidden">
        <TalentTab />
      </div>
    </div>
  );
}
