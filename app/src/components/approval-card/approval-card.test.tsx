// @vitest-environment jsdom
// IPI-304 — shell + primitives shared by BrandApprovalCard, BudgetApprovalCard,
// DeliverableApprovalCard, ShotListApprovalCard.
import { describe, expect, it, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

import { ApprovalCardShell } from "./approval-card-shell";
import { ApprovalHeader } from "./approval-header";
import { ApprovalEvidence } from "./approval-evidence";
import { ApprovalComparison } from "./approval-comparison";
import { ApprovalActions } from "./approval-actions";

afterEach(() => cleanup());

describe("ApprovalCardShell", () => {
  it("renders children inside a div with the given className", () => {
    const { container } = render(
      <ApprovalCardShell className="my-shell">
        <p>content</p>
      </ApprovalCardShell>,
    );
    const root = container.firstElementChild;
    expect(root?.tagName).toBe("DIV");
    expect(root?.className).toBe("my-shell");
    expect(screen.getByText("content")).toBeDefined();
  });
});

describe("ApprovalHeader", () => {
  it("renders title only when no subtitle or right content is given", () => {
    render(<ApprovalHeader title="Budget estimate" titleClassName="title-class" />);
    expect(screen.getByText("Budget estimate")).toBeDefined();
  });

  it("renders subtitle grouped with the title when given", () => {
    render(
      <ApprovalHeader
        title="Brand intelligence draft ready for review"
        subtitle="Review the AI-generated profile, then approve to publish or reject to discard."
      />,
    );
    expect(screen.getByText("Brand intelligence draft ready for review")).toBeDefined();
    expect(
      screen.getByText("Review the AI-generated profile, then approve to publish or reject to discard."),
    ).toBeDefined();
  });

  it("renders arbitrary right-side content (badge or button)", () => {
    render(<ApprovalHeader title="Budget estimate" right={<span>Override active</span>} />);
    expect(screen.getByText("Override active")).toBeDefined();
  });
});

describe("ApprovalEvidence", () => {
  it("renders nothing when there are no fields", () => {
    const { container } = render(<ApprovalEvidence fields={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders one label/value pair per field", () => {
    render(
      <ApprovalEvidence
        fields={[
          { key: "tagline", label: "Tagline", value: "Spring drop hero" },
          { key: "confidence", label: "AI Confidence", value: "87%" },
        ]}
      />,
    );
    expect(screen.getByText("Tagline")).toBeDefined();
    expect(screen.getByText("Spring drop hero")).toBeDefined();
    expect(screen.getByText("AI Confidence")).toBeDefined();
    expect(screen.getByText("87%")).toBeDefined();
  });
});

describe("ApprovalComparison", () => {
  it("renders nothing when there are no rows", () => {
    const { container } = render(<ApprovalComparison rows={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders one row per item with label, delta, and value", () => {
    render(
      <ApprovalComparison
        rows={[
          { key: "brand_fit", label: "brand fit", value: <span>82</span>, delta: <span>+4</span> },
          { key: "visual_dna", label: "visual dna", value: <span>75</span> },
        ]}
      />,
    );
    expect(screen.getByText("brand fit")).toBeDefined();
    expect(screen.getByText("+4")).toBeDefined();
    expect(screen.getByText("82")).toBeDefined();
    expect(screen.getByText("visual dna")).toBeDefined();
    expect(screen.getByText("75")).toBeDefined();
  });
});

describe("ApprovalActions", () => {
  it("fires onApprove and onReject", () => {
    const onApprove = vi.fn();
    const onReject = vi.fn();
    render(<ApprovalActions state="idle" onApprove={onApprove} onReject={onReject} />);
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    fireEvent.click(screen.getByRole("button", { name: "Reject" }));
    expect(onApprove).toHaveBeenCalledOnce();
    expect(onReject).toHaveBeenCalledOnce();
  });

  it("shows in-flight labels and disables both buttons while approving", () => {
    render(
      <ApprovalActions state="approving" onApprove={vi.fn()} onReject={vi.fn()} disabled />,
    );
    expect(screen.getByRole("button", { name: "Approving…" })).toHaveProperty("disabled", true);
    expect(screen.getByRole("button", { name: "Reject" })).toHaveProperty("disabled", true);
  });

  it("shows in-flight label while rejecting", () => {
    render(<ApprovalActions state="rejecting" onApprove={vi.fn()} onReject={vi.fn()} disabled />);
    expect(screen.getByRole("button", { name: "Rejecting…" })).toHaveProperty("disabled", true);
  });
});
