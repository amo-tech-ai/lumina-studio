// @vitest-environment jsdom
import type { CSSProperties } from "react";
import { describe, expect, it, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import type { LucideIcon } from "lucide-react";
import { WizardStep } from "./wizard-step";

const Icon = ((props: { style?: CSSProperties }) => (
  <svg data-testid="step-icon" {...props} />
)) as LucideIcon;

afterEach(() => cleanup());

const STEPS = [
  { icon: Icon, label: "Search", sub: "Find talent" },
  { icon: Icon, label: "Review", sub: "Score matches" },
  { icon: Icon, label: "Approve", sub: "Lock shortlist" },
];

describe("WizardStep", () => {
  it("renders completed, active, and upcoming steps with token styles and a11y", () => {
    render(<WizardStep steps={STEPS} currentStep={2} />);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0].getAttribute("data-state")).toBe("completed");
    expect(items[1].getAttribute("data-state")).toBe("active");
    expect(items[2].getAttribute("data-state")).toBe("future");
    expect(items[1].getAttribute("aria-current")).toBe("step");
    expect(items[0].getAttribute("aria-current")).toBeNull();
    expect(screen.getByText("Completed")).toBeDefined();

    const dots = items.map((item) => item.querySelector("[aria-hidden]") as HTMLElement);
    expect(dots[0].style.background).toBe("var(--color-dna-high)");
    expect(dots[1].style.background).toBe("rgb(255, 255, 255)");
    expect(dots[2].style.background).toBe("rgba(255, 255, 255, 0.14)");

    expect(screen.getByText("Search").style.color).toBe("rgb(255, 255, 255)");
    expect(screen.getByText("Review").style.color).toBe("rgb(255, 255, 255)");
    expect(screen.getByText("Approve").style.color).toBe("rgba(255, 255, 255, 0.7)");
  });
});
