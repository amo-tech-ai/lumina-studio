// @vitest-environment jsdom
import { describe, expect, it, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

vi.mock("@/components/shoot/shoot-wizard.module.css", () => ({
  default: new Proxy({}, { get: (_, k) => String(k) }),
}));

import { DeliverableApprovalCard } from "./DeliverableApprovalCard";

afterEach(() => cleanup());

type Deliverable = { id: string; channel: string; format: string; quantity: number };

function deliverables(): Deliverable[] {
  return [
    { id: "d1", channel: "instagram_feed", format: "JPG", quantity: 6 },
    { id: "d2", channel: "tiktok", format: "MP4", quantity: 3 },
  ];
}

describe("DeliverableApprovalCard", () => {
  it("renders deliverable count, total assets, and one row per deliverable", () => {
    render(
      <DeliverableApprovalCard
        deliverables={deliverables()}
        totalAssets={9}
        onChange={vi.fn()}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByText("2 deliverables · 9 total assets")).toBeDefined();
    expect(screen.getByLabelText("Channel for deliverable 1")).toHaveProperty("value", "instagram_feed");
    expect(screen.getByLabelText("Channel for deliverable 2")).toHaveProperty("value", "tiktok");
  });

  it("editing the channel field calls onChange with the patched deliverable, others untouched", () => {
    const onChange = vi.fn();
    render(
      <DeliverableApprovalCard
        deliverables={deliverables()}
        totalAssets={9}
        onChange={onChange}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText("Channel for deliverable 1"), {
      target: { value: "pinterest" },
    });
    expect(onChange).toHaveBeenCalledOnce();
    const next = onChange.mock.calls[0][0] as Deliverable[];
    expect(next[0]).toEqual({ id: "d1", channel: "pinterest", format: "JPG", quantity: 6 });
    expect(next[1]).toEqual(deliverables()[1]);
  });

  it("editing quantity floors and clamps to a minimum of 1", () => {
    const onChange = vi.fn();
    render(
      <DeliverableApprovalCard
        deliverables={deliverables()}
        totalAssets={9}
        onChange={onChange}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText("Quantity for deliverable 1"), {
      target: { value: "0" },
    });
    const next = onChange.mock.calls[0][0] as Deliverable[];
    expect(next[0].quantity).toBe(1);
  });

  it("clicking + Add fires onAdd", () => {
    const onAdd = vi.fn();
    render(
      <DeliverableApprovalCard
        deliverables={deliverables()}
        totalAssets={9}
        onChange={vi.fn()}
        onAdd={onAdd}
        onRemove={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "+ Add" }));
    expect(onAdd).toHaveBeenCalledOnce();
  });

  it("clicking remove fires onRemove with that deliverable's id", () => {
    const onRemove = vi.fn();
    render(
      <DeliverableApprovalCard
        deliverables={deliverables()}
        totalAssets={9}
        onChange={vi.fn()}
        onAdd={vi.fn()}
        onRemove={onRemove}
      />,
    );
    fireEvent.click(screen.getByLabelText("Remove deliverable 2"));
    expect(onRemove).toHaveBeenCalledWith("d2");
  });

  it("shows uncovered-channel warnings when present", () => {
    render(
      <DeliverableApprovalCard
        deliverables={deliverables()}
        totalAssets={9}
        uncoveredWarnings={["No deliverable for pinterest"]}
        onChange={vi.fn()}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByText(/No deliverable for pinterest/)).toBeDefined();
  });
});
