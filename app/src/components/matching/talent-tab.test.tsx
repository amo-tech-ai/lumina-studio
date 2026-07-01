// @vitest-environment jsdom
// IPI-308 review fixes — regression coverage for the two confirmed runtime
// bugs: stale search responses overwriting fresher ones, and shortlist state
// not rehydrating from the DB on mount.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { IntelligenceDetailProvider } from "@/context/intelligence-detail-context";
import type { TalentResult } from "@/lib/talent/types";

type RpcCall = { fn: string; params: Record<string, unknown>; resolve: (v: unknown) => void };

const { rpc, rpcCalls } = vi.hoisted(() => {
  const rpcCalls: RpcCall[] = [];
  const rpc = vi.fn((fn: string, params: Record<string, unknown>) => {
    return new Promise((resolve) => {
      rpcCalls.push({ fn, params, resolve });
    });
  });
  return { rpc, rpcCalls };
});

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({ rpc }),
}));

import { TalentTab } from "./talent-tab";

function talent(id: string, name: string): TalentResult {
  return {
    id,
    display_name: name,
    bio: null,
    measurements: {},
    languages: ["en"],
    travel_ready: true,
    verification_status: "unverified",
    ai_tags: {},
    is_agency_represented: false,
    rate_tier: "$$",
    is_available: true,
  };
}

function renderTab() {
  return render(
    <IntelligenceDetailProvider>
      <TalentTab />
    </IntelligenceDetailProvider>,
  );
}

function searchCalls(onlyShortlistId: string | null = null) {
  return rpcCalls.filter(
    (c) => c.fn === "search_talent" && c.params.p_only_shortlist_id === onlyShortlistId,
  );
}

beforeEach(() => {
  rpc.mockClear();
  rpcCalls.length = 0;
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("TalentTab — search request ordering", () => {
  it("keeps the latest filter's result even when an older request resolves last", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    renderTab();

    await waitFor(() => expect(searchCalls(null)).toHaveLength(1));
    const firstCall = searchCalls(null)[0];

    fireEvent.change(screen.getByLabelText("Available from"), {
      target: { value: "2026-08-01" },
    });

    await waitFor(() => expect(searchCalls(null)).toHaveLength(2));
    const secondCall = searchCalls(null)[1];

    // Newer request (the filter change) resolves first — normal network timing.
    secondCall.resolve({ data: [talent("b", "Bailey Rivers")], error: null });
    await screen.findByText("Bailey Rivers");

    // Older, now-stale request resolves after. It must not overwrite the result.
    firstCall.resolve({ data: [talent("a", "Alex Stone")], error: null });
    await new Promise((r) => setTimeout(r, 0));

    expect(screen.queryByText("Alex Stone")).toBeNull();
    expect(screen.getByText("Bailey Rivers")).toBeTruthy();
  });
});

describe("TalentTab — shortlist rehydration", () => {
  it("seeds shortlist state from the DB on mount, not just local session toggles", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ orgId: "org-1" }) }),
    );
    renderTab();

    await waitFor(() => expect(searchCalls(null)).toHaveLength(1));
    searchCalls(null).forEach((c) => c.resolve({ data: [], error: null }));

    await waitFor(() => expect(rpcCalls.some((c) => c.fn === "get_or_create_shortlist")).toBe(true));
    rpcCalls
      .filter((c) => c.fn === "get_or_create_shortlist")
      .forEach((c) => c.resolve({ data: "sl-1", error: null }));

    await waitFor(() => expect(searchCalls("sl-1")).toHaveLength(1));
    searchCalls("sl-1").forEach((c) =>
      c.resolve({ data: [talent("c", "Casey Vance")], error: null }),
    );

    await waitFor(() => expect(screen.getByText(/Shortlist \(1\)/)).toBeTruthy());

    fireEvent.click(screen.getByText(/Shortlist \(1\)/));
    expect(await screen.findByText("Casey Vance")).toBeTruthy();
  });
});
