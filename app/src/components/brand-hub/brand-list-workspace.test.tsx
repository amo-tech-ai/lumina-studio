// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

const mockUseAgentContext = vi.fn();
vi.mock("@copilotkit/react-core/v2", () => ({
  useAgentContext: (...args: unknown[]) => mockUseAgentContext(...args),
}));

vi.mock("./brand-list.module.css", () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock("next/image", () => ({
  default: () => null,
}));

import { BrandListWorkspace } from "./brand-list-workspace";

const SAMPLE_BRANDS = [
  {
    id: "1",
    name: "Nike",
    brandUrl: "https://nike.com",
    intakeStatus: "ready",
    dnaScore: 87,
    pillars: [{ score_type: "visual", score: 72 }],
  },
  {
    id: "2",
    name: "Adidas",
    brandUrl: "https://adidas.com",
    intakeStatus: "ready",
    dnaScore: 91,
    pillars: [{ score_type: "visual", score: 88 }],
  },
  {
    id: "3",
    name: "Zara",
    brandUrl: "https://zara.com",
    intakeStatus: "brand_created",
    dnaScore: 0,
    pillars: [],
  },
];

beforeEach(() => mockUseAgentContext.mockClear());
afterEach(() => cleanup());

describe("BrandListWorkspace", () => {
  it("renders grid cards for populated list", () => {
    render(<BrandListWorkspace brands={SAMPLE_BRANDS} isAuthenticated />);
    expect(screen.getByTestId("brand-list-grid")).toBeTruthy();
    expect(screen.getAllByTestId("brand-list-card")).toHaveLength(3);
  });

  it("filters by search query", () => {
    render(<BrandListWorkspace brands={SAMPLE_BRANDS} isAuthenticated />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "nike" } });
    expect(screen.getAllByTestId("brand-list-card")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Nike" })).toBeTruthy();
  });

  it("shows no-match when search has no results", () => {
    render(<BrandListWorkspace brands={SAMPLE_BRANDS} isAuthenticated />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "puma" } });
    expect(screen.getByTestId("brand-list-no-match")).toBeTruthy();
  });

  it("filters by draft chip", () => {
    render(<BrandListWorkspace brands={SAMPLE_BRANDS} isAuthenticated />);
    fireEvent.click(screen.getByRole("button", { name: "Draft" }));
    expect(screen.getAllByTestId("brand-list-card")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Zara" })).toBeTruthy();
  });

  it("injects filtered brands into agent context", () => {
    render(<BrandListWorkspace brands={SAMPLE_BRANDS} isAuthenticated />);
    fireEvent.click(screen.getByRole("button", { name: "Draft" }));
    expect(mockUseAgentContext).toHaveBeenCalled();
    const lastCall = mockUseAgentContext.mock.calls.at(-1)?.[0];
    expect(lastCall.value.count).toBe(1);
    expect(lastCall.value.brands[0].name).toBe("Zara");
  });
});
