"use client";

import { useAgentContext } from "@copilotkit/react-core/v2";

/**
 * IPI AGENT-CTX-001 — Inject shoot detail into CopilotKit so production-planner
 * knows the open shoot/brand without asking for UUIDs.
 * Mirrors shoot-wizard-context / brand-context patterns.
 */
export function useShootDetailContext({
  shootId,
  shootName,
  shootStatus,
  brandId,
  brandName,
  channels,
  shotCount,
  deliverableCount,
  dnaScore,
  hasBrief,
}: {
  shootId: string;
  shootName: string;
  shootStatus: string;
  brandId: string;
  brandName: string;
  channels: string[];
  shotCount: number;
  deliverableCount: number;
  dnaScore: number | null;
  hasBrief: boolean;
}) {
  const nextActions =
    shotCount === 0
      ? ["generate a shot list from Brand DNA", "open the shoot wizard", "review deliverables"]
      : ["summarize this shoot", "review shots", "check budget", "help with approvals"];

  useAgentContext({
    description: `Shoot detail — operator is viewing "${shootName}" for brand ${brandName || "unknown"}. Status: ${shootStatus}. ${shotCount === 0 ? "Shot list is empty." : `${shotCount} shots on the list.`} You already have shootId and brandId — never ask the operator to paste them. You can help with: ${nextActions.join(", ")}.`,
    value: {
      surface: "shoot-detail",
      shoot_id: shootId,
      shoot_name: shootName,
      shoot_status: shootStatus,
      brand_id: brandId,
      brand_name: brandName,
      selected_channels: channels,
      shot_count: shotCount,
      deliverable_count: deliverableCount,
      dna_score: dnaScore,
      brief_present: hasBrief,
      suggested_next_actions: nextActions,
    },
  });
}
