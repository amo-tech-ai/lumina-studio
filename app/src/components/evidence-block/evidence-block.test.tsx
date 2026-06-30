// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EvidenceBlock } from "./evidence-block";

afterEach(() => cleanup());

const baseProps = {
  title: "Visual DNA match",
  score: 72,
  potential: 84,
  confidence: 88,
  why: "Palette and crop align with brand guidelines.",
  reasoning: "Weighted against 1,240 on-brand assets.",
  evidence: [{ text: "Palette within 4% of brandbook swatches." }],
  suggestions: [{ text: "Tighten crop to 4:5 for IG Feed", gain: 6 }],
};

describe("EvidenceBlock", () => {
  it("renders required sections per DESIGN-046", () => {
    render(<EvidenceBlock {...baseProps} />);
    expect(screen.getByRole("group", { name: /Evidence for Visual DNA match/i })).toBeTruthy();
    expect(screen.getByText("Why this score")).toBeTruthy();
    expect(screen.getByText(/Palette and crop align/)).toBeTruthy();
    expect(screen.getByText("AI reasoning")).toBeTruthy();
    expect(screen.getByText("Evidence")).toBeTruthy();
    expect(screen.getByText("Suggested improvements")).toBeTruthy();
    expect(screen.getByText("72")).toBeTruthy();
    expect(screen.getByText("84")).toBeTruthy();
    expect(screen.getByText("88% confidence")).toBeTruthy();
  });

  it("hides optional sections when props empty", () => {
    render(
      <EvidenceBlock
        title="Campaign health"
        score={65}
        confidence={71}
        why="Engagement forecast below target."
      />,
    );
    expect(screen.queryByText("AI reasoning")).toBeNull();
    expect(screen.queryByText("Evidence")).toBeNull();
    expect(screen.queryByText("Suggested improvements")).toBeNull();
  });

  it("fires action callbacks", () => {
    const onApprove = vi.fn();
    const onImprove = vi.fn();
    const onRegenerate = vi.fn();
    render(
      <EvidenceBlock
        {...baseProps}
        onApprove={onApprove}
        onImprove={onImprove}
        onRegenerate={onRegenerate}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Approve fixes" }));
    fireEvent.click(screen.getByRole("button", { name: "Improve" }));
    fireEvent.click(screen.getByRole("button", { name: "Regenerate" }));
    expect(onApprove).toHaveBeenCalledOnce();
    expect(onImprove).toHaveBeenCalledOnce();
    expect(onRegenerate).toHaveBeenCalledOnce();
  });
});
