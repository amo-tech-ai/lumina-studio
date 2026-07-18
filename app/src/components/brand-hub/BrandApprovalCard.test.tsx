// @vitest-environment jsdom
// IPI-304 — BrandApprovalCard (formerly approval-card.tsx / `ApprovalCard`),
// now composed through the shared ApprovalCardShell/Header/Evidence/Comparison/
// Actions primitives. No dedicated test existed for this component before —
// added as the next-best proof in place of live browser QA, since no brand
// in the QA dataset currently has a pending AI draft to exercise this card
// live (see PR description for the browser-proof attempt + blocker).
import { describe, expect, it, afterEach, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import type { AiProfile, BrandScoreDetail } from "@/lib/brand-hub";

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

const approveWorkflowDraft = vi.fn();
const rejectWorkflowDraft = vi.fn();
vi.mock("@/app/(operator)/app/brand/[id]/actions", () => ({
  approveWorkflowDraft: (...args: unknown[]) => approveWorkflowDraft(...args),
  rejectWorkflowDraft: (...args: unknown[]) => rejectWorkflowDraft(...args),
}));

import { BrandApprovalCard } from "./BrandApprovalCard";

afterEach(() => cleanup());
beforeEach(() => {
  mockRefresh.mockReset();
  approveWorkflowDraft.mockReset();
  rejectWorkflowDraft.mockReset();
});

const DRAFT: AiProfile = {
  tagline: "Spring drop hero",
  category: "Athletic apparel",
  confidenceScore: 87,
  productionReadiness: 64,
};

const DRAFT_SCORES: BrandScoreDetail[] = [
  { score_type: "brand_fit", score: 82 },
  { score_type: "visual_dna", score: 75 },
];

const LIVE_SCORES: BrandScoreDetail[] = [{ score_type: "brand_fit", score: 78 }];

describe("BrandApprovalCard", () => {
  it("renders the evidence fields and comparison rows for the draft", () => {
    render(
      <BrandApprovalCard
        brandId="brand-1"
        runId="run-1"
        draft={DRAFT}
        draftScores={DRAFT_SCORES}
        liveScores={LIVE_SCORES}
      />,
    );
    expect(screen.getByText("Brand intelligence draft ready for review")).toBeDefined();
    expect(screen.getByText("Spring drop hero")).toBeDefined();
    expect(screen.getByText("Athletic apparel")).toBeDefined();
    expect(screen.getByText("87%")).toBeDefined();
    expect(screen.getByText("64%")).toBeDefined();
    expect(screen.getByText("brand fit")).toBeDefined();
    expect(screen.getByText("visual dna")).toBeDefined();
    expect(screen.getByText("+4")).toBeDefined(); // 82 - 78 delta
  });

  it("approving calls approveWorkflowDraft and refreshes on success", async () => {
    approveWorkflowDraft.mockResolvedValue({ ok: true });
    render(
      <BrandApprovalCard
        brandId="brand-1"
        runId="run-1"
        draft={DRAFT}
        draftScores={[]}
        liveScores={[]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(approveWorkflowDraft).toHaveBeenCalledWith("brand-1", "run-1"));
    await waitFor(() => expect(mockRefresh).toHaveBeenCalledOnce());
  });

  it("rejecting calls rejectWorkflowDraft", async () => {
    rejectWorkflowDraft.mockResolvedValue({ ok: true });
    render(
      <BrandApprovalCard
        brandId="brand-1"
        runId="run-1"
        draft={DRAFT}
        draftScores={[]}
        liveScores={[]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Reject" }));
    await waitFor(() => expect(rejectWorkflowDraft).toHaveBeenCalledWith("brand-1", "run-1"));
  });

  it("shows the already-processed message and no actions when the draft was already handled", async () => {
    approveWorkflowDraft.mockResolvedValue({ ok: false, error: "already_processed" });
    render(
      <BrandApprovalCard
        brandId="brand-1"
        runId="run-1"
        draft={DRAFT}
        draftScores={[]}
        liveScores={[]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    await waitFor(() =>
      expect(screen.getByText("This draft has already been processed.")).toBeDefined(),
    );
    expect(screen.queryByRole("button", { name: "Approve" })).toBeNull();
  });

  it("shows an inline error and re-enables actions on failure", async () => {
    approveWorkflowDraft.mockResolvedValue({ ok: false, error: "Something went wrong" });
    render(
      <BrandApprovalCard
        brandId="brand-1"
        runId="run-1"
        draft={DRAFT}
        draftScores={[]}
        liveScores={[]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(screen.getByText("Something went wrong")).toBeDefined());
    expect(screen.getByRole("button", { name: "Approve" })).toHaveProperty("disabled", false);
  });
});
