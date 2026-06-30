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

  it("rounds confidence for dot color and label", () => {
    const { container } = render(
      <EvidenceBlock
        title="Rounding"
        score={70}
        confidence={84.6}
        why="Test"
      />,
    );
    expect(screen.getByText("85% confidence")).toBeTruthy();
    const dot = container.querySelector('[aria-hidden="true"].rounded-full');
    expect(dot?.className).toContain("bg-[#059669]");
  });

  it("quotes image URLs in background-image", () => {
    const { container } = render(
      <EvidenceBlock
        title="URL"
        score={70}
        confidence={80}
        why="Test"
        evidenceImgs={['https://example.com/a b.jpg)']}
      />,
    );
    const thumb = container.querySelector('[role="img"][aria-label="Evidence source"]');
    expect(thumb?.getAttribute("style")).toContain('url("https://example.com/a b.jpg)"');
  });

  it("uses score semantics for after label when potential is absent", () => {
    render(
      <EvidenceBlock
        title="Before after"
        score={72}
        confidence={80}
        why="Test"
        beforeImg="https://example.com/before.jpg"
        afterImg="https://example.com/after.jpg"
      />,
    );
    expect(screen.getByRole("img", { name: "After · score 72" })).toBeTruthy();
  });

  it("announces score updates to screen readers", () => {
    const { container } = render(<EvidenceBlock {...baseProps} />);
    const live = container.querySelector('[aria-live="polite"]');
    expect(live?.textContent).toContain("score 72");
    expect(live?.textContent).toContain("88% confidence");
    expect(live?.textContent).toContain("potential 84");
  });

  it("uses shared brand-utils scoreColor thresholds", () => {
    render(
      <EvidenceBlock title="Score color" score={75} confidence={80} why="Test" />,
    );
    const scoreEl = screen.getByText("75");
    expect(scoreEl.getAttribute("style")).toMatch(/059669|rgb\(5,\s*150,\s*105\)/);
  });

  it("formats negative suggestion gain without double sign", () => {
    render(
      <EvidenceBlock
        title="Gain"
        score={70}
        confidence={80}
        why="Test"
        suggestions={[{ text: "Reduce saturation", gain: -3 }]}
      />,
    );
    expect(screen.getByText("-3")).toBeTruthy();
    expect(screen.queryByText("+-3")).toBeNull();
  });

  it("disables action buttons while loading", () => {
    render(
      <EvidenceBlock
        {...baseProps}
        loading
        onApprove={() => undefined}
        onImprove={() => undefined}
        onRegenerate={() => undefined}
      />,
    );
    expect(screen.getByRole("button", { name: "Approve fixes" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "Improve" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "Regenerate" }).hasAttribute("disabled")).toBe(true);
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
