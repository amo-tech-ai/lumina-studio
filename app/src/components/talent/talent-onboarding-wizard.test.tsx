// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth-client", () => ({
  useAuthUser: () => ({ user: { id: "user-1" }, loading: false }),
}));

import { TalentOnboardingWizard } from "./talent-onboarding-wizard";

const analyzed = {
  success: true,
  fields: [
    { key: "name", value: "Kara", confidence: 90, evidence: "a" },
    { key: "handle", value: "@kara", confidence: 90, evidence: "a" },
    { key: "niche", value: "Run", confidence: 90, evidence: "a" },
    { key: "tier", value: "Micro", confidence: 90, evidence: "a" },
    { key: "loc", value: "London", confidence: 90, evidence: "a" },
    { key: "rate", value: "£1,200", confidence: 90, evidence: "a" },
    { key: "bio", value: "Bio", confidence: 90, evidence: "a" },
  ],
};

describe("TalentOnboardingWizard", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders a visible analysis error with retry", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ success: false, error: "Analysis failed" }),
    } as Response);

    render(<TalentOnboardingWizard />);
    fireEvent.change(screen.getByPlaceholderText("e.g. Alex Rivera"), { target: { value: "Kara" } });
    fireEvent.change(screen.getByPlaceholderText("https://instagram.com/yourhandle"), {
      target: { value: "https://instagram.com/kara" },
    });
    fireEvent.click(screen.getByRole("button", { name: /analyse profile/i }));

    await waitFor(() => expect(screen.getByText("Couldn't analyse profile")).toBeDefined());
    expect(screen.getByRole("button", { name: /retry analysis/i })).toBeDefined();
  });

  it("disables Finish while publishing and only sends one create request", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce({ json: async () => analyzed } as Response)
      .mockImplementationOnce(() => new Promise(() => undefined) as Promise<Response>);

    render(<TalentOnboardingWizard />);
    fireEvent.change(screen.getByPlaceholderText("e.g. Alex Rivera"), { target: { value: "Kara" } });
    fireEvent.change(screen.getByPlaceholderText("https://instagram.com/yourhandle"), {
      target: { value: "https://instagram.com/kara" },
    });
    fireEvent.click(screen.getByRole("button", { name: /analyse profile/i }));

    await waitFor(() => expect(screen.getByText("Review your drafted profile")).toBeDefined(), { timeout: 4000 });
    for (const button of screen.getAllByRole("button", { name: "Approve" })) fireEvent.click(button);

    const finish = screen.getByRole("button", { name: /finish & publish/i });
    fireEvent.click(finish);
    fireEvent.click(finish);
    await waitFor(() => {
      const publishing = screen.getByRole("button", { name: /publishing/i }) as HTMLButtonElement;
      expect(publishing.disabled).toBe(true);
    });
    expect(fetchMock.mock.calls.filter((call) => String(call[0]).includes("profile-create"))).toHaveLength(1);
    const createCall = fetchMock.mock.calls.find((call) => String(call[0]).includes("profile-create"));
    const body = JSON.parse(String(createCall?.[1] && typeof createCall[1] === "object" && "body" in createCall[1] ? createCall[1].body : "{}")) as {
      analyzedFields: Array<{ status: string }>;
    };
    expect(body.analyzedFields.every((field) => field.status === "approved")).toBe(true);
  });

  it("hides the photography sidebar in the mobile-first grid", () => {
    const { container } = render(<TalentOnboardingWizard />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("grid-cols-1");
    expect(root.className).toContain("md:grid-cols-[min(400px,36vw)_minmax(0,1fr)]");
    expect(container.querySelector("aside")?.className).toContain("hidden");
    expect(container.querySelector("aside")?.className).toContain("md:flex");
  });
});
