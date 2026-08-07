// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockEnsure = vi.fn();
const mockApprove = vi.fn();
const mockProgress = vi.fn();

vi.mock("@/lib/onboarding/ensure-onboarding-intake-draft", () => ({
  ensureOnboardingIntakeDraft: (...args: unknown[]) => mockEnsure(...args),
}));

vi.mock("@/app/(operator)/app/brand/[id]/actions", () => ({
  approveWorkflowDraft: (...args: unknown[]) => mockApprove(...args),
}));

vi.mock("@/lib/brand-hub/use-brand-analysis-progress", () => ({
  useBrandAnalysisProgress: (...args: unknown[]) => mockProgress(...args),
}));

import { BrandDnaPayoffScreen } from "./brand-dna-payoff-screen";

const PILLARS = [
  { title: "Voice", hint: "How your brand sounds", value: "Editorial" },
  { title: "Palette", hint: "The colours you own", value: "#111 · Bold" },
  { title: "Audience", hint: "Who you speak to", value: "DTC founders" },
  { title: "Positioning", hint: "Where you sit in the market", value: "Premium" },
];

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.clearAllMocks();
  mockProgress.mockReturnValue({
    intakeStatus: "draft_ready",
    crawl: null,
    phase: "active",
    reconnect: vi.fn(),
  });
  mockEnsure.mockResolvedValue({
    ok: true,
    intakeStatus: "draft_ready",
    runId: "run-1",
    brandName: "Maison",
    pillars: PILLARS,
  });
  mockApprove.mockResolvedValue({ ok: true });
});

describe("BrandDnaPayoffScreen (IPI-835 · D)", () => {
  it("loads generated Brand DNA pillars for the materialized brand", async () => {
    render(<BrandDnaPayoffScreen brandId="brand-1" />);
    await waitFor(() => expect(screen.getByTestId("pillar-voice")).toBeTruthy());
    expect(screen.getByText("Editorial")).toBeTruthy();
    expect(screen.getByText("DTC founders")).toBeTruthy();
    expect(mockEnsure).toHaveBeenCalledWith("brand-1");
  });

  it("leaves Loading when ensure rejects (IPI-836 resume hang)", async () => {
    mockEnsure.mockRejectedValueOnce(new Error("network"));
    render(<BrandDnaPayoffScreen brandId="brand-1" />);
    await waitFor(() =>
      expect(screen.getByTestId("dna-status").textContent).not.toMatch(/Loading your Brand DNA/i),
    );
    expect(screen.getByTestId("dna-status").textContent).toMatch(/couldn’t load|could not load/i);
    expect(screen.getByTestId("dna-load-retry")).toBeTruthy();
    expect(screen.getByTestId("dna-return-brand-hub")).toBeTruthy();
  });

  it("Retry reloads DNA after a failed ensure", async () => {
    mockEnsure
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({
        ok: true,
        intakeStatus: "draft_ready",
        runId: "run-1",
        brandName: "Maison",
        pillars: PILLARS,
      });
    render(<BrandDnaPayoffScreen brandId="brand-1" />);
    await waitFor(() => expect(screen.getByTestId("dna-load-retry")).toBeTruthy());
    fireEvent.click(screen.getByTestId("dna-load-retry"));
    await waitFor(() => expect(screen.getByTestId("approve-brand-dna")).toBeTruthy());
    expect(mockEnsure).toHaveBeenCalledTimes(2);
  });

  it("approves via existing approveWorkflowDraft and waits for durable ready", async () => {
    const onReadyChange = vi.fn();
    mockEnsure
      .mockResolvedValueOnce({
        ok: true,
        intakeStatus: "draft_ready",
        runId: "run-1",
        brandName: "Maison",
        pillars: PILLARS,
      })
      .mockResolvedValueOnce({
        ok: true,
        intakeStatus: "ready",
        runId: null,
        brandName: "Maison",
        pillars: PILLARS,
      });

    render(<BrandDnaPayoffScreen brandId="brand-1" onReadyChange={onReadyChange} />);
    await waitFor(() => expect(screen.getByTestId("approve-brand-dna")).toBeTruthy());

    fireEvent.click(screen.getByTestId("approve-brand-dna"));

    await waitFor(() => expect(mockApprove).toHaveBeenCalledWith("brand-1", "run-1"));
    await waitFor(() => expect(screen.getByTestId("dna-ready")).toBeTruthy());
    expect(onReadyChange).toHaveBeenCalledWith(true);
  });

  it("does not show ready when approve fails", async () => {
    mockApprove.mockResolvedValue({ ok: false, error: "relation brands does not exist" });
    render(<BrandDnaPayoffScreen brandId="brand-1" />);
    await waitFor(() => expect(screen.getByTestId("approve-brand-dna")).toBeTruthy());

    fireEvent.click(screen.getByTestId("approve-brand-dna"));

    await waitFor(() => expect(screen.getByTestId("dna-approve-error")).toBeTruthy());
    expect(screen.queryByTestId("dna-ready")).toBeNull();
    expect(screen.getByTestId("dna-approve-error").textContent).not.toMatch(/relation|does not exist/i);
  });

  it("advances when Realtime reports ready", async () => {
    const onReadyChange = vi.fn();
    mockProgress.mockReturnValue({
      intakeStatus: "ready",
      crawl: null,
      phase: "done",
      reconnect: vi.fn(),
    });
    mockEnsure.mockResolvedValue({
      ok: true,
      intakeStatus: "draft_ready",
      runId: "run-1",
      brandName: "Maison",
      pillars: PILLARS,
    });

    render(<BrandDnaPayoffScreen brandId="brand-1" onReadyChange={onReadyChange} />);
    await waitFor(() => expect(onReadyChange).toHaveBeenCalledWith(true));
  });

  it("advances when Realtime reports legacy scores_complete", async () => {
    const onReadyChange = vi.fn();
    mockProgress.mockReturnValue({
      intakeStatus: "scores_complete",
      crawl: null,
      phase: "done",
      reconnect: vi.fn(),
    });
    mockEnsure.mockResolvedValue({
      ok: true,
      intakeStatus: "draft_ready",
      runId: "run-1",
      brandName: "Maison",
      pillars: PILLARS,
    });

    render(<BrandDnaPayoffScreen brandId="brand-1" onReadyChange={onReadyChange} />);
    await waitFor(() => expect(onReadyChange).toHaveBeenCalledWith(true));
    await waitFor(() => expect(screen.getByTestId("dna-ready")).toBeTruthy());
  });

  it("treats already_processed as success when brand is ready", async () => {
    mockApprove.mockResolvedValue({ ok: false, error: "already_processed" });
    mockEnsure
      .mockResolvedValueOnce({
        ok: true,
        intakeStatus: "draft_ready",
        runId: "run-1",
        brandName: "Maison",
        pillars: PILLARS,
      })
      .mockResolvedValueOnce({
        ok: true,
        intakeStatus: "ready",
        runId: null,
        brandName: "Maison",
        pillars: PILLARS,
      });

    render(<BrandDnaPayoffScreen brandId="brand-1" />);
    await waitFor(() => expect(screen.getByTestId("approve-brand-dna")).toBeTruthy());
    fireEvent.click(screen.getByTestId("approve-brand-dna"));
    await waitFor(() => expect(screen.getByTestId("dna-ready")).toBeTruthy());
  });

  it("treats already_processed as success when brand is scores_complete", async () => {
    mockApprove.mockResolvedValue({ ok: false, error: "already_processed" });
    mockEnsure
      .mockResolvedValueOnce({
        ok: true,
        intakeStatus: "draft_ready",
        runId: "run-1",
        brandName: "Maison",
        pillars: PILLARS,
      })
      .mockResolvedValueOnce({
        ok: true,
        intakeStatus: "scores_complete",
        runId: null,
        brandName: "Maison",
        pillars: PILLARS,
      });

    render(<BrandDnaPayoffScreen brandId="brand-1" />);
    await waitFor(() => expect(screen.getByTestId("approve-brand-dna")).toBeTruthy());
    fireEvent.click(screen.getByTestId("approve-brand-dna"));
    await waitFor(() => expect(screen.getByTestId("dna-ready")).toBeTruthy());
  });

  it("enables ready UI when approve confirm re-read is scores_complete", async () => {
    const onReadyChange = vi.fn();
    mockEnsure
      .mockResolvedValueOnce({
        ok: true,
        intakeStatus: "draft_ready",
        runId: "run-1",
        brandName: "Maison",
        pillars: PILLARS,
      })
      .mockResolvedValueOnce({
        ok: true,
        intakeStatus: "scores_complete",
        runId: null,
        brandName: "Maison",
        pillars: PILLARS,
      });

    render(<BrandDnaPayoffScreen brandId="brand-1" onReadyChange={onReadyChange} />);
    await waitFor(() => expect(screen.getByTestId("approve-brand-dna")).toBeTruthy());
    fireEvent.click(screen.getByTestId("approve-brand-dna"));
    await waitFor(() => expect(screen.getByTestId("dna-ready")).toBeTruthy());
    expect(onReadyChange).toHaveBeenCalledWith(true);
  });

  it("does not mark a new brand ready from the previous brand's stale realtime status", async () => {
    const onReadyChange = vi.fn();
    // Brand A already reached ready over Realtime.
    mockProgress.mockReturnValue({
      intakeStatus: "ready",
      crawl: null,
      phase: "done",
      reconnect: vi.fn(),
    });
    mockEnsure.mockResolvedValue({
      ok: true,
      intakeStatus: "draft_ready",
      runId: "run-2",
      brandName: "Maison",
      pillars: PILLARS,
    });

    const { rerender } = render(
      <BrandDnaPayoffScreen brandId="brand-1" onReadyChange={onReadyChange} />,
    );
    await waitFor(() => expect(onReadyChange).toHaveBeenCalledWith(true));

    // Switch to brand B while the hook still reports the old brand's stale "ready".
    mockEnsure.mockClear();
    onReadyChange.mockClear();
    rerender(<BrandDnaPayoffScreen brandId="brand-2" onReadyChange={onReadyChange} />);

    // The new brand must land back on the review state — not approved.
    await waitFor(() => expect(mockEnsure).toHaveBeenCalledWith("brand-2"));
    await waitFor(() => expect(screen.getByTestId("approve-brand-dna")).toBeTruthy());
    expect(screen.queryByTestId("dna-ready")).toBeNull();
    expect(onReadyChange).not.toHaveBeenCalled();
  });

  it("paints the Return to Brand Hub link in readable ink on the white card", async () => {
    mockEnsure.mockRejectedValueOnce(new Error("network"));
    render(<BrandDnaPayoffScreen brandId="brand-1" />);
    await waitFor(() => expect(screen.getByTestId("dna-return-brand-hub")).toBeTruthy());
    const link = screen.getByTestId("dna-return-brand-hub");
    expect(link.className).toContain("text-[var(--onboarding-ink)]");
    expect(link.className).not.toContain("text-[var(--onboarding-card)]");
  });
});
