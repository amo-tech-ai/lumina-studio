"use client";

import { SectionPlaceholder } from "@/components/section-placeholder";
import { useCampaignsContext } from "./campaigns-context";

export function CampaignsWorkspace() {
  useCampaignsContext();

  return (
    <SectionPlaceholder
      title="Campaigns"
      blurb="Turn brand DNA into creative briefs, moodboards, and content."
      issue="IPI-156 · CAMP-001 — Creative Director"
    />
  );
}
