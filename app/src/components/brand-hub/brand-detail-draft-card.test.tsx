/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { BrandDetailDraftCard } from "./brand-detail-draft-card";

vi.mock("./brand-detail.module.css", () => ({
  default: new Proxy({}, { get: (_t, key) => String(key) }),
}));

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ refresh: vi.fn() })),
}));

vi.mock("@/app/(operator)/app/brand/[id]/actions", () => ({
  approveWorkflowDraft: vi.fn(),
  rejectWorkflowDraft: vi.fn(),
}));

const { approveWorkflowDraft, rejectWorkflowDraft } = await import(
  "@/app/(operator)/app/brand/[id]/actions"
);

const draft = {
  tagline: "Test tagline",
  category: "Apparel",
  confidenceScore: 88,
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("BrandDetailDraftCard", () => {
  it("shows approval confirmation after Approve succeeds", async () => {
    vi.mocked(approveWorkflowDraft).mockResolvedValue({ ok: true });

    render(<BrandDetailDraftCard brandId="brand-1" runId="run-1" draft={draft} />);

    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() => {
      expect(screen.getByText(/Approved — profile updated/i)).toBeTruthy();
    });
    expect(screen.queryByText(/Discarded/i)).toBeNull();
  });

  it("shows discard confirmation after Discard succeeds", async () => {
    vi.mocked(rejectWorkflowDraft).mockResolvedValue({ ok: true });

    render(<BrandDetailDraftCard brandId="brand-1" runId="run-1" draft={draft} />);

    fireEvent.click(screen.getByRole("button", { name: "Discard" }));

    await waitFor(() => {
      expect(screen.getByText(/Discarded — draft removed/i)).toBeTruthy();
    });
    expect(screen.queryByText(/Approved — profile updated/i)).toBeNull();
  });
});
