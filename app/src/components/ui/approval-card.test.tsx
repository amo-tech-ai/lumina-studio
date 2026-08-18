// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ApprovalCard } from "./approval-card";

afterEach(() => cleanup());

describe("ApprovalCard", () => {
  it("applies chip styles through style, not a CSS string className", () => {
    const { container } = render(
      <ApprovalCard label="Handle" value="@kara" isEditing={false} status="ai" />,
    );
    const chip = screen.getByText("AI · review");
    expect(chip.className.includes("flex-shrink: 0")).toBe(false);
    expect(chip.getAttribute("style") ?? "").toContain("border");
    expect(container.querySelector("[style*='flex-shrink']")).toBeNull();
  });
});
