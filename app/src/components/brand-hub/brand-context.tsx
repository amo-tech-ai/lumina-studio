"use client";

import { useAgentContext } from "@copilotkit/react-core/v2";
import type { AiProfile, BrandScoreDetail } from "@/lib/brand-hub";
import { scoreLabel } from "@/lib/brand-utils";

// AC6 — IPI-123 DASH-003 PR C
// Injects brand identity + scores into the CopilotKit agent context so the
// production-planner can answer "explain this score" without re-fetching.
// v2 equivalent of useCopilotReadable — see .claude/skills/copilotkit/references/upgrade/ipix-v2-conventions.md
export function useBrandContext({
  brandId,
  brandName,
  dnaScore,
  intakeStatus,
  profile,
  scores,
  workflowRunId,
}: {
  brandId: string;
  brandName: string;
  dnaScore: number;
  intakeStatus: string | null;
  profile: AiProfile;
  scores: BrandScoreDetail[];
  workflowRunId?: string | null;
}) {
  useAgentContext({
    description: "Brand currently open in the Brand Hub",
    value: {
      brandId,
      name: brandName,
      dna_score: dnaScore,
      intake_status: intakeStatus ?? null,
      pending_draft_run_id: workflowRunId ?? null,
      has_pending_draft: intakeStatus === "draft_ready" && Boolean(workflowRunId),
      tagline: profile.tagline ?? null,
      category: profile.category ?? null,
      industry: profile.industry ?? null,
      targetAudience: profile.targetAudience ?? null,
      brandVoice: profile.brandVoice ?? null,
      uvp: profile.uvp ?? null,
      mission: profile.mission ?? null,
      confidenceScore: profile.confidenceScore ?? null,
      analyzedAt: profile.analyzedAt ?? null,
    },
  });

  useAgentContext({
    description: "Brand intelligence scores for the current brand",
    value: scores.map((s) => ({
      dimension: scoreLabel(s.score_type),
      score: s.score,
      confidence: s.details?.confidence ?? null,
    })),
  });
}
