// @vitest-environment jsdom
import { describe, expect, it, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

vi.mock("@/components/shoot/shoot-wizard.module.css", () => ({
  default: new Proxy({}, { get: (_, k) => String(k) }),
}));

import { ShotListApprovalCard } from "./ShotListApprovalCard";

afterEach(() => cleanup());

type Shot = { shot_number: number; description: string; angle: string; lighting: string; deliverable_ids: string[] };

function shots(): Shot[] {
  return [
    { shot_number: 1, description: "Hero, full body", angle: "eye-level", lighting: "soft daylight", deliverable_ids: ["d1"] },
    { shot_number: 2, description: "Detail, texture", angle: "macro", lighting: "studio strobe", deliverable_ids: ["d1", "d2"] },
  ];
}

describe("ShotListApprovalCard", () => {
  it("renders shot count, deliverable count, and one row per shot", () => {
    render(<ShotListApprovalCard shots={shots()} deliverableCount={2} onChange={vi.fn()} />);
    expect(screen.getByText("2 shots · 2 deliverable types")).toBeDefined();
    expect(screen.getByLabelText("Description for shot 1")).toHaveProperty("value", "Hero, full body");
    expect(screen.getByLabelText("Description for shot 2")).toHaveProperty("value", "Detail, texture");
  });

  it("editing a shot's description calls onChange with only that shot patched", () => {
    const onChange = vi.fn();
    render(<ShotListApprovalCard shots={shots()} deliverableCount={2} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Description for shot 1"), {
      target: { value: "Hero, close crop" },
    });
    expect(onChange).toHaveBeenCalledOnce();
    const next = onChange.mock.calls[0][0] as Shot[];
    expect(next[0].description).toBe("Hero, close crop");
    expect(next[1]).toEqual(shots()[1]);
  });

  it("editing angle and lighting fields patches the correct shot", () => {
    const onChange = vi.fn();
    render(<ShotListApprovalCard shots={shots()} deliverableCount={2} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Angle for shot 2"), { target: { value: "overhead" } });
    expect((onChange.mock.calls[0][0] as Shot[])[1].angle).toBe("overhead");

    fireEvent.change(screen.getByLabelText("Lighting for shot 2"), { target: { value: "natural window" } });
    expect((onChange.mock.calls[1][0] as Shot[])[1].lighting).toBe("natural window");
  });

  it("shows coverage-gap warnings when present", () => {
    render(
      <ShotListApprovalCard
        shots={shots()}
        deliverableCount={2}
        uncoveredWarnings={["No shot covers pinterest deliverable"]}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText(/No shot covers pinterest deliverable/)).toBeDefined();
  });

  it("renders zero-padded shot numbers", () => {
    render(<ShotListApprovalCard shots={shots()} deliverableCount={2} onChange={vi.fn()} />);
    expect(screen.getByText("01")).toBeDefined();
    expect(screen.getByText("02")).toBeDefined();
  });
});
