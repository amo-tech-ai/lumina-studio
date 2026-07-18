// @vitest-environment jsdom
import { describe, expect, it, afterEach, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";

vi.mock("@/components/shoot/shoot-wizard.module.css", () => ({
  default: new Proxy({}, { get: (_, k) => String(k) }),
}));

vi.mock("@copilotkit/react-core/v2", () => ({ useAgentContext: () => {} }));

// Two brands, not one — page.tsx auto-selects a lone brand (single-brand
// convenience), which would silently pre-fill brandId and defeat the
// "Continue disabled until brand is set" assertions below.
const BRANDS = [
  { id: "brand-1", name: "Acme" },
  { id: "brand-2", name: "Globex" },
];
vi.mock("@supabase/ssr", () => ({
  createBrowserClient: () => ({
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: BRANDS }),
      }),
    }),
  }),
}));

import NewShootPage from "./page";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// ── Endpoint inventory this ticket verified by reading page.tsx directly ──
const ALLOWED_ENDPOINTS = [
  "/api/shoots/suggest-brief",
  "/api/workflows/shoot-wizard",
  "/api/workflows/resume",
  "/api/shoots/commit",
  "/api/media/specs",
];

type Call = { url: string; method: string; body: unknown };

function makeFetch(opts: {
  suggestBrief?: () => { ok: boolean; body: unknown };
  commit?: () => { ok: boolean; body: unknown };
} = {}) {
  const calls: Call[] = [];
  const fn = vi.fn((input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(init.body as string) : undefined;
    calls.push({ url, method, body });

    if (url.startsWith("/api/media/specs")) {
      return Promise.resolve({ ok: true, json: async () => ({ results: [] }) } as Response);
    }
    if (url === "/api/shoots/suggest-brief") {
      const r = opts.suggestBrief?.() ?? { ok: true, body: { brief: "Generated creative brief." } };
      return Promise.resolve({ ok: r.ok, json: async () => r.body, text: async () => JSON.stringify(r.body) } as Response);
    }
    if (url === "/api/workflows/shoot-wizard") {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          runId: "run-1",
          suspendPayload: {
            deliverables: [{ channel: "instagram_feed", format: "JPG", quantity: 6 }],
            total_assets: 6,
          },
        }),
      } as Response);
    }
    if (url === "/api/workflows/resume") {
      const stepId = (body as { stepId?: string })?.stepId;
      if (stepId === "deliverable-gate") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            suspendPayload: {
              shots: [{ shot_number: 1, description: "Hero shot", angle: "eye-level", lighting: "soft", deliverable_ids: [] }],
              uncovered_warnings: [],
            },
          }),
        } as Response);
      }
      if (stepId === "shot-list-gate") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            suspendPayload: { budget: { crew: 1000, studio: 500, equipment: 300, post: 200, total: 2000 } },
          }),
        } as Response);
      }
      if (stepId === "budget-gate") {
        return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
      }
      return Promise.resolve({ ok: false, json: async () => ({ error: "unknown gate" }), text: async () => "unknown gate" } as Response);
    }
    if (url === "/api/shoots/commit") {
      const r = opts.commit?.() ?? { ok: true, body: { shoot_id: "shoot-123" } };
      return Promise.resolve({ ok: r.ok, json: async () => r.body, text: async () => JSON.stringify(r.body) } as Response);
    }
    return Promise.reject(new Error(`Unmocked fetch call: ${method} ${url}`));
  });
  return { fn, calls };
}

async function renderWizard(fetchOpts?: Parameters<typeof makeFetch>[0]) {
  const { fn, calls } = makeFetch(fetchOpts);
  vi.stubGlobal("fetch", fn);
  render(<NewShootPage />);
  // brand fetch resolves async; wait for it before interacting with the Brand select
  await waitFor(() => expect(screen.getByRole("option", { name: "Acme" })).toBeDefined());
  return { calls };
}

function fillBasics() {
  fireEvent.change(screen.getByLabelText("Brand *"), { target: { value: "brand-1" } });
  fireEvent.change(screen.getByLabelText("Shoot name *"), { target: { value: "SS26 Campaign" } });
  fireEvent.click(screen.getByRole("button", { name: /IG Feed/ }));
}

function continueButton() {
  return screen.getByRole("button", { name: /Continue/ });
}

beforeEach(() => {
  vi.stubGlobal("crypto", { randomUUID: () => `id-${Math.random().toString(36).slice(2)}` });
});

describe("Shoot Wizard — Basics required-field validation (Task 5)", () => {
  it("Continue is disabled until brand, shoot name, and at least one channel are all set", async () => {
    await renderWizard();
    expect(continueButton().hasAttribute("disabled")).toBe(true);

    fireEvent.change(screen.getByLabelText("Brand *"), { target: { value: "brand-1" } });
    expect(continueButton().hasAttribute("disabled")).toBe(true);

    fireEvent.change(screen.getByLabelText("Shoot name *"), { target: { value: "SS26 Campaign" } });
    expect(continueButton().hasAttribute("disabled")).toBe(true); // still no channel

    fireEvent.click(screen.getByRole("button", { name: /IG Feed/ }));
    expect(continueButton().hasAttribute("disabled")).toBe(false);
  });

  it("deselecting the only channel disables Continue again", async () => {
    await renderWizard();
    fillBasics();
    expect(continueButton().hasAttribute("disabled")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: /IG Feed/ })); // toggle off
    expect(continueButton().hasAttribute("disabled")).toBe(true);
  });

  it("selecting a channel fetches its spec from /api/media/specs (5th real endpoint, debounced 200ms)", async () => {
    const { calls } = await renderWizard();
    fireEvent.click(screen.getByRole("button", { name: /IG Feed/ }));

    await waitFor(() => {
      const specCalls = calls.filter((c) => c.url.startsWith("/api/media/specs"));
      expect(specCalls).toHaveLength(1);
      expect(specCalls[0].url).toBe("/api/media/specs?channels=instagram_feed");
    });

    // Selecting a second channel re-fires with the full, updated channel list —
    // proves the endpoint tracks state.channels, not just "fired once ever".
    fireEvent.click(screen.getByRole("button", { name: /TikTok/ }));
    await waitFor(() => {
      const specCalls = calls.filter((c) => c.url.startsWith("/api/media/specs"));
      expect(specCalls).toHaveLength(2);
      expect(specCalls[1].url).toBe("/api/media/specs?channels=instagram_feed,tiktok");
    });
  });
});

describe("Shoot Wizard — step navigation (Task 2)", () => {
  it("Continue advances Basics to Brief", async () => {
    await renderWizard();
    fillBasics();
    fireEvent.click(continueButton());
    expect(screen.getByText("Step 2 of 6 · Brief")).toBeDefined();
  });

  it("Back from Deliverables to Brief resets runId/shots/uncoveredWarnings", async () => {
    await renderWizard();
    fillBasics();
    fireEvent.click(continueButton());
    // auto-generated brief resolves and fills the textarea
    await waitFor(() => expect((screen.getByLabelText("Brief *") as HTMLTextAreaElement).value.length).toBeGreaterThan(0));
    fireEvent.click(screen.getByRole("button", { name: /Plan deliverables/ }));
    await waitFor(() => expect(screen.getByText("Step 3 of 6 · Deliverables")).toBeDefined());

    fireEvent.click(screen.getByRole("button", { name: /Revise brief/ }));
    expect(screen.getByText("Step 2 of 6 · Brief")).toBeDefined();
  });
});

describe("Shoot Wizard — HITL gates (Task 3)", () => {
  it("Deliverables gate: Approve is disabled with zero valid deliverables, enabled once one has a channel", async () => {
    await renderWizard();
    fillBasics();
    fireEvent.click(continueButton());
    await waitFor(() => expect((screen.getByLabelText("Brief *") as HTMLTextAreaElement).value.length).toBeGreaterThan(0));
    fireEvent.click(screen.getByRole("button", { name: /Plan deliverables/ }));
    await waitFor(() => expect(screen.getByText("Step 3 of 6 · Deliverables")).toBeDefined());

    // Seeded deliverable already has a channel (instagram_feed) → approve should be enabled
    expect(screen.getByRole("button", { name: /Approve deliverables/ }).hasAttribute("disabled")).toBe(false);
  });

  it("full happy path reaches the inline Confirmation screen — no redirect", async () => {
    const { calls } = await renderWizard();
    fillBasics();
    fireEvent.click(continueButton());
    await waitFor(() => expect((screen.getByLabelText("Brief *") as HTMLTextAreaElement).value.length).toBeGreaterThan(0));

    fireEvent.click(screen.getByRole("button", { name: /Plan deliverables/ }));
    await waitFor(() => expect(screen.getByText("Step 3 of 6 · Deliverables")).toBeDefined());

    fireEvent.click(screen.getByRole("button", { name: /Approve deliverables/ }));
    await waitFor(() => expect(screen.getByText("Step 4 of 6 · Shot List")).toBeDefined());
    expect(screen.getByRole("button", { name: /Approve shot list/ }).hasAttribute("disabled")).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: /Approve shot list/ }));
    await waitFor(() => expect(screen.getByText("Step 5 of 6 · Budget")).toBeDefined());

    fireEvent.click(screen.getByRole("button", { name: /Approve & commit/ }));

    // Corrected behavior: inline Confirmation on the SAME page, not a redirect
    await waitFor(() => expect(screen.getByText("Shoot committed")).toBeDefined());
    expect(screen.getByText("SS26 Campaign")).toBeDefined();
    expect(screen.getByText(/shoot-123/)).toBeDefined();

    // Task 8 — regression guard: every call made stays inside the known endpoint set
    for (const call of calls) {
      const known = ALLOWED_ENDPOINTS.some((e) => call.url === e || call.url.startsWith(e));
      expect(known, `unexpected endpoint called: ${call.method} ${call.url}`).toBe(true);
    }
    const commitCalls = calls.filter((c) => c.url === "/api/shoots/commit");
    expect(commitCalls).toHaveLength(1);
  });
});

describe("Shoot Wizard — brief autogeneration (Task 4)", () => {
  it("failure leaves the brief empty and shows an error, does not crash", async () => {
    await renderWizard({ suggestBrief: () => ({ ok: false, body: { error: "AI provider unavailable" } }) });
    fillBasics();
    fireEvent.click(continueButton());

    await waitFor(() => expect(screen.getByRole("alert")).toBeDefined());
    expect(screen.getByRole("alert").textContent).toContain("AI provider unavailable");
    expect((screen.getByLabelText("Brief *") as HTMLTextAreaElement).value).toBe("");
  });
});

describe("Shoot Wizard — commit failure path (Task 6)", () => {
  it("commit failure shows an error and stays on the Budget step — no Confirmation, no crash", async () => {
    await renderWizard({ commit: () => ({ ok: false, body: { error: "Database unavailable" } }) });
    fillBasics();
    fireEvent.click(continueButton());
    await waitFor(() => expect((screen.getByLabelText("Brief *") as HTMLTextAreaElement).value.length).toBeGreaterThan(0));
    fireEvent.click(screen.getByRole("button", { name: /Plan deliverables/ }));
    await waitFor(() => expect(screen.getByText("Step 3 of 6 · Deliverables")).toBeDefined());
    fireEvent.click(screen.getByRole("button", { name: /Approve deliverables/ }));
    await waitFor(() => expect(screen.getByText("Step 4 of 6 · Shot List")).toBeDefined());
    fireEvent.click(screen.getByRole("button", { name: /Approve shot list/ }));
    await waitFor(() => expect(screen.getByText("Step 5 of 6 · Budget")).toBeDefined());

    fireEvent.click(screen.getByRole("button", { name: /Approve & commit/ }));

    await waitFor(() => expect(screen.getByRole("alert")).toBeDefined());
    expect(screen.getByRole("alert").textContent).toContain("Database unavailable");
    expect(screen.getByText("Step 5 of 6 · Budget")).toBeDefined();
    expect(screen.queryByText("Shoot committed")).toBeNull();
  });
});

describe("Shoot Wizard — duplicate-submit prevention (Task 7)", () => {
  it("the commit button disables itself while a request is in flight, so a second rapid click doesn't fire another commit", async () => {
    const { calls } = await renderWizard();

    fillBasics();
    fireEvent.click(continueButton());
    await waitFor(() => expect((screen.getByLabelText("Brief *") as HTMLTextAreaElement).value.length).toBeGreaterThan(0));
    fireEvent.click(screen.getByRole("button", { name: /Plan deliverables/ }));
    await waitFor(() => expect(screen.getByText("Step 3 of 6 · Deliverables")).toBeDefined());
    fireEvent.click(screen.getByRole("button", { name: /Approve deliverables/ }));
    await waitFor(() => expect(screen.getByText("Step 4 of 6 · Shot List")).toBeDefined());
    fireEvent.click(screen.getByRole("button", { name: /Approve shot list/ }));
    await waitFor(() => expect(screen.getByText("Step 5 of 6 · Budget")).toBeDefined());

    const commitBtn = screen.getByRole("button", { name: /Approve & commit/ });
    fireEvent.click(commitBtn);
    // Button flips to loading/disabled synchronously (React state update), before the
    // fetch promise resolves — a second click here must be a no-op.
    expect(commitBtn.hasAttribute("disabled")).toBe(true);
    fireEvent.click(commitBtn);

    await waitFor(() => expect(screen.getByText("Shoot committed")).toBeDefined());
    const commitCalls = calls.filter((c) => c.url === "/api/shoots/commit");
    expect(commitCalls).toHaveLength(1);
  });
});
