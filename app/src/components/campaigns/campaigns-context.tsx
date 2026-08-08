"use client";

import { useAgentContext } from "@copilotkit/react-core/v2";
import { useActiveBrand } from "@/context/active-brand-context";

/** Expose campaigns workspace context to creative-director on /app/campaigns. */
export function useCampaignsContext() {
  const { activeBrandId } = useActiveBrand();

  useAgentContext({
    description:
      "Campaigns workspace — operator is planning campaign creative on /app/campaigns. " +
      "Use draftCampaignBrief with the active brand when they want a structured brief draft.",
    value: {
      route: "/app/campaigns",
      active_brand_id: activeBrandId,
    },
  });
}
