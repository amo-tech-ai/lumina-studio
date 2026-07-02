// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import type { AiProfile, BrandScoreDetail } from "@/lib/brand-hub";

const mockUseAgentContext = vi.fn();
vi.mock("@copilotkit/react-core/v2", () => ({
  useAgentContext: (...args: unknown[]) => mockUseAgentContext(...args),
}));
vi.mock("@/lib/brand-utils", () => ({
  scoreLabel: (t: string) => t,
}));

import { useBrandContext } from "./brand-context";

const brandId = "aaaaaaaa-0000-0000-0000-000000000001";
const profile: AiProfile = {
  tagline: "Test tagline",
  category: "Fashion",
  industry: "Retail",
  targetAudience: "Gen Z",
  brandVoice: "Bold",
  uvp: "Unique",
  mission: "Inspire",
  confidenceScore: 0.9,
  analyzedAt: "2026-01-01T00:00:00Z",
};
const scores: BrandScoreDetail[] = [
  { score_type: "visual", score: 72, details: { confidence: 0.8 } } as BrandScoreDetail,
  { score_type: "audience", score: 58, details: { confidence: 0.7 } } as BrandScoreDetail,
];

beforeEach(() => mockUseAgentContext.mockClear());

describe("useBrandContext — agent context wiring (IPI-123 DASH-003 AC6)", () => {
  it("calls useAgentContext twice (identity + scores)", () => {
    renderHook(() =>
      useBrandContext({ brandId, brandName: "Lumina", dnaScore: 75, intakeStatus: "ready", profile, scores }),
    );
    expect(mockUseAgentContext).toHaveBeenCalledTimes(2);
  });

  it("injects brandId, dna_score and intake_status into the identity context", () => {
    renderHook(() =>
      useBrandContext({
        brandId,
        brandName: "Lumina",
        dnaScore: 75,
        intakeStatus: "draft_ready",
        profile,
        scores,
        workflowRunId: "run-123",
      }),
    );
    const [identityCall] = mockUseAgentContext.mock.calls;
    expect(identityCall[0].value).toMatchObject({
      brandId,
      dna_score: 75,
      intake_status: "draft_ready",
      pending_draft_run_id: "run-123",
      has_pending_draft: true,
      name: "Lumina",
    });
  });

  it("maps scores to dimension/score/confidence tuples", () => {
    renderHook(() =>
      useBrandContext({ brandId, brandName: "Lumina", dnaScore: 75, intakeStatus: null, profile, scores }),
    );
    const [, scoresCall] = mockUseAgentContext.mock.calls;
    expect(scoresCall[0].value).toEqual([
      { dimension: "visual", score: 72, confidence: 0.8 },
      { dimension: "audience", score: 58, confidence: 0.7 },
    ]);
  });

  it("coerces null intakeStatus to null (not undefined)", () => {
    renderHook(() =>
      useBrandContext({ brandId, brandName: "Lumina", dnaScore: 75, intakeStatus: null, profile, scores }),
    );
    const [identityCall] = mockUseAgentContext.mock.calls;
    expect(identityCall[0].value.intake_status).toBeNull();
  });
});

describe("BrandDetailWorkspace — useBrandContext integration (IPI-123 DASH-003 AC6)", () => {
  it("workspace source passes brandId, dnaScore, intakeStatus, profile and scores to useBrandContext", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const src = readFileSync(
      resolve(process.cwd(), "src/components/brand-hub/brand-detail-workspace.tsx"),
      "utf8",
    );
    expect(src).toMatch(/useBrandContext\(/);
    expect(src).toMatch(/brandId/);
    expect(src).toMatch(/dnaScore/);
    expect(src).toMatch(/intakeStatus/);
    expect(src).toMatch(/profile/);
    expect(src).toMatch(/baseScores/);
  });
});
