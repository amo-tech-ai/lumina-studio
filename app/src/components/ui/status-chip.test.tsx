// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

// Proxy stub: styles.pill → "pill", so we can assert the variant class by name.
import { vi } from "vitest";
vi.mock("./status-chip.module.css", () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));

import { StatusChip } from "./status-chip";
import {
  crmStatusLabel,
  crmStatusDotToken,
  crmDealStageLabel,
  crmDealStageDotToken,
} from "@/lib/crm/status-tokens";

afterEach(() => cleanup());

describe("StatusChip", () => {
  it("renders the label and applies the dot color inline (token var, not hex)", () => {
    render(<StatusChip dot="var(--color-approved)" label="Active" />);
    expect(screen.getByText("Active")).toBeDefined();
    const dot = document.querySelector("[aria-hidden]") as HTMLElement;
    expect(dot.style.background).toBe("var(--color-approved)");
  });

  it("defaults to the pill variant", () => {
    const { container } = render(<StatusChip dot="var(--color-info)" label="Prospect" />);
    expect(container.firstElementChild?.className).toContain("pill");
  });

  it("uses the bare variant when bare (and bare wins over onImage)", () => {
    const { container } = render(
      <StatusChip dot="var(--color-info)" label="Prospect" bare onImage />,
    );
    const cls = container.firstElementChild?.className ?? "";
    expect(cls).toContain("bare");
    expect(cls).not.toContain("onImage");
  });

  it("uses the onImage variant for glassmorphism over photography", () => {
    const { container } = render(
      <StatusChip dot="var(--color-approved)" label="Active" onImage />,
    );
    expect(container.firstElementChild?.className).toContain("onImage");
  });
});

describe("crm company status tokens", () => {
  it("maps every constraint value to a label + token", () => {
    expect(crmStatusLabel("prospect")).toBe("Prospect");
    expect(crmStatusDotToken("prospect")).toBe("var(--color-info)");
    expect(crmStatusLabel("active")).toBe("Active");
    expect(crmStatusDotToken("active")).toBe("var(--color-approved)");
    expect(crmStatusLabel("inactive")).toBe("Inactive");
    expect(crmStatusDotToken("inactive")).toBe("var(--color-text-muted)");
    expect(crmStatusLabel("lost")).toBe("Lost");
    expect(crmStatusDotToken("lost")).toBe("var(--color-blocked)");
  });

  it("falls back to Unknown + muted for missing/invalid status (not the first enum)", () => {
    expect(crmStatusLabel(null)).toBe("Unknown");
    expect(crmStatusLabel("bogus")).toBe("Unknown");
    expect(crmStatusDotToken(undefined)).toBe("var(--color-text-muted)");
  });
});

describe("crm deal stage tokens", () => {
  it("maps every constraint value to a label + token", () => {
    for (const [stage, label] of [
      ["lead", "Lead"],
      ["qualified", "Qualified"],
      ["proposal", "Proposal"],
      ["negotiation", "Negotiation"],
      ["won", "Won"],
      ["lost", "Lost"],
    ] as const) {
      expect(crmDealStageLabel(stage)).toBe(label);
      expect(crmDealStageDotToken(stage)).toMatch(/^var\(--/);
    }
  });

  it("falls back to Unknown + muted for an invalid stage", () => {
    expect(crmDealStageLabel("closed")).toBe("Unknown");
    expect(crmDealStageDotToken("closed")).toBe("var(--color-text-muted)");
  });
});
