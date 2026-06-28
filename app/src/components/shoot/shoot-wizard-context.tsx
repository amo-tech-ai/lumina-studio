"use client";

import { useAgentContext } from "@copilotkit/react-core/v2";

const STEP_LABELS = ["Basics", "Brief", "Deliverables", "Shot List", "Budget", "Done"];

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
  useAgentContext({
    description: "Shoot wizard — current step and user inputs",
    value: {
      wizard_step: STEP_LABELS[step] ?? `Step ${step + 1}`,
      step_number: step + 1,
      shoot_name: shootName,
      brand_id: brandId,
      brand_name: brandName,
      selected_channels: channels,
      current_brief: brief,
      deliverable_count: (deliverables as unknown[]).length,
      shot_count: (shots as unknown[]).length,
      budget_total: budget ? (budget as { total?: number }).total ?? null : null,
    },
  });
}
