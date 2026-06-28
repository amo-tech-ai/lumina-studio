"use client";

import { useAgentContext } from "@copilotkit/react-core/v2";

const STEP_LABELS = ["Basics", "Brief", "Deliverables", "Shot List", "Budget", "Done"];

const STEP_NEXT_ACTIONS: Record<number, string[]> = {
  0: ["confirm brand and channels, then continue to brief"],
  1: ["improve the brief", "make it shorter", "adjust the tone", "continue to deliverables"],
  2: ["review deliverables", "suggest additional formats", "continue to shot list"],
  3: ["review the shot list", "suggest locations", "add more shots", "continue to budget"],
  4: ["review the budget", "suggest cost savings", "finalize the shoot"],
  5: ["save the shoot", "share with the team"],
};

export function useShootWizardContext({
  step,
  shootName,
  brandId,
  brandName,
  channels,
  brief,
  deliverables,
  shots,
  budget,
}: {
  step: number;
  shootName: string;
  brandId: string;
  brandName: string;
  channels: string[];
  brief: string;
  deliverables: unknown[];
  shots: unknown[];
  budget: unknown;
}) {
  const stepLabel = STEP_LABELS[step] ?? `Step ${step + 1}`;
  const nextActions = STEP_NEXT_ACTIONS[step] ?? [];

  useAgentContext({
    description: `Shoot wizard — operator is on the ${stepLabel} step. ${brandName ? `Planning a shoot for ${brandName}` : "No brand selected yet"}. Campaign: "${shootName || "unnamed"}". Channels: ${channels.length ? channels.join(", ") : "none selected"}. ${brief ? "Creative brief has been written." : "Brief not yet generated."} You can help with: ${nextActions.join(", ")}.`,
    value: {
      wizard_step: stepLabel,
      step_number: step + 1,
      shoot_name: shootName,
      brand_id: brandId,
      brand_name: brandName,
      selected_channels: channels,
      current_brief: brief || null,
      brief_written: (brief ?? "").trim().length > 50,
      deliverable_count: ((deliverables ?? []) as unknown[]).length,
      shot_count: ((shots ?? []) as unknown[]).length,
      budget_total: budget ? (budget as { total?: number }).total ?? null : null,
      suggested_next_actions: nextActions,
    },
  });
}
