// AGENT-CTX-001 — server-side consumer tests. These prove the read end of the
// context wire: @ag-ui/mastra writes the client-side useAgentContext payload
// into the per-run RequestContext under "ag-ui", and this tool must surface it
// to the model. The fixture below replicates exactly what applyInputContext
// stores (`{ context: [...] }`).
import { describe, expect, it, vi } from "vitest";
import { RequestContext } from "@mastra/core/request-context";
import type { SupabaseClient } from "@supabase/supabase-js";

vi.mock("./crm/_shared", () => ({
  getCrmUserClient: vi.fn(),
}));

import { getCrmUserClient } from "./crm/_shared";
import {
  getCurrentPageContext,
  readPageContextFromRequestContext,
  verifyPageContextClaims,
} from "./currentPageContext";
import type { PageContextIdentity } from "./currentPageContext";

const SHOOT_DETAIL_ENTRY = {
  description:
    'Shoot detail — operator is viewing "Spring Campaign" for brand Acme. Status: active. 3 shots on the list.',
  value: {
    surface: "shoot-detail",
    shoot_id: "shoot-1",
    shoot_name: "Spring Campaign",
    shoot_status: "active",
    brand_id: "brand-1",
    brand_name: "Acme",
    selected_channels: ["instagram"],
    shot_count: 3,
    deliverable_count: 2,
    dna_score: 87,
    brief_present: true,
    suggested_next_actions: ["summarize this shoot"],
  },
};

const ROUTE_ENTRY = { description: "Route — operator is on /app/shoots", value: { surface: "route" } };

function contextWithAgUi(context: unknown): RequestContext {
  const requestContext = new RequestContext();
  requestContext.set("ag-ui", { context });
  return requestContext;
}

describe("readPageContextFromRequestContext", () => {
  it("reports unavailable when there is no request context", () => {
    expect(readPageContextFromRequestContext(undefined)).toEqual({
      available: false,
      contexts: [],
    });
  });

  it("reports unavailable when the ag-ui key was never written", () => {
    const requestContext = new RequestContext();
    requestContext.set("userId", "user-1");
    expect(readPageContextFromRequestContext(requestContext)).toEqual({
      available: false,
      contexts: [],
    });
  });

  it("returns the shoot-detail entry written by @ag-ui/mastra's applyInputContext", () => {
    const requestContext = contextWithAgUi([SHOOT_DETAIL_ENTRY]);
    const result = readPageContextFromRequestContext(requestContext);
    expect(result.available).toBe(true);
    expect(result.contexts).toHaveLength(1);
    expect(result.contexts[0].value).toMatchObject({
      surface: "shoot-detail",
      shoot_id: "shoot-1",
      brand_id: "brand-1",
      shot_count: 3,
    });
    expect(result.contexts[0].description).toContain("Spring Campaign");
  });

  it("returns every attached entry (route/brand contexts may coexist with shoot-detail)", () => {
    const requestContext = contextWithAgUi([SHOOT_DETAIL_ENTRY, ROUTE_ENTRY]);
    const result = readPageContextFromRequestContext(requestContext);
    expect(result.available).toBe(true);
    expect(result.contexts).toHaveLength(2);
    expect(result.contexts.map((c) => c.value.surface)).toEqual([
      "shoot-detail",
      "route",
    ]);
  });

  it("drops malformed entries (non-objects, empty description with empty value)", () => {
    const requestContext = contextWithAgUi([
      "junk",
      null,
      42,
      { description: "" },
      SHOOT_DETAIL_ENTRY,
    ]);
    const result = readPageContextFromRequestContext(requestContext);
    expect(result.contexts).toHaveLength(1);
    expect(result.contexts[0].value.surface).toBe("shoot-detail");
  });
});

function mockSupabaseClient(opts: {
  shoots?: { id: string; brand_id: string | null }[];
  brands?: { id: string; org_id: string | null }[];
  error?: { message: string };
}): SupabaseClient {
  const shootsQuery = {
    select: vi.fn().mockReturnValue({
      in: vi.fn().mockResolvedValue(
        opts.error
          ? { data: null, error: opts.error }
          : { data: opts.shoots ?? [], error: null },
      ),
    }),
  };
  const brandsQuery = {
    select: vi.fn().mockReturnValue({
      in: vi.fn().mockReturnValue({
        eq: vi
          .fn()
          .mockResolvedValue(
            opts.error
              ? { data: null, error: opts.error }
              : { data: opts.brands ?? [], error: null },
          ),
      }),
    }),
  };
  return {
    from: vi.fn((table: string) =>
      table === "shoot_portfolio_view" ? shootsQuery : brandsQuery,
    ),
  } as unknown as SupabaseClient;
}

const identity = (client: SupabaseClient, orgId = "org-1"): PageContextIdentity => ({
  client,
  orgId,
});

describe("verifyPageContextClaims — org verification of browser-supplied IDs", () => {
  it("fails closed when no operator identity is resolvable (claims stripped, entries marked unverified)", async () => {
    const raw = {
      available: true,
      contexts: [SHOOT_DETAIL_ENTRY, ROUTE_ENTRY],
    };
    const result = await verifyPageContextClaims(raw, null);
    expect(result.contexts[0]).toEqual({
      ...SHOOT_DETAIL_ENTRY,
      value: {},
      verified: false,
    });
    expect(result.contexts[1]).toEqual({ ...ROUTE_ENTRY, verified: true });
  });

  it("keeps claims that resolve to the operator's org (verified)", async () => {
    const client = mockSupabaseClient({
      shoots: [{ id: "shoot-1", brand_id: "brand-1" }],
      brands: [{ id: "brand-1", org_id: "org-1" }],
    });
    const result = await verifyPageContextClaims(
      { available: true, contexts: [SHOOT_DETAIL_ENTRY] },
      identity(client),
    );
    expect(result.contexts[0]).toEqual({ ...SHOOT_DETAIL_ENTRY, verified: true });
  });

  it("strips a foreign shoot_id (not visible to the operator)", async () => {
    const client = mockSupabaseClient({
      shoots: [],
      brands: [{ id: "brand-1", org_id: "org-1" }],
    });
    const result = await verifyPageContextClaims(
      { available: true, contexts: [SHOOT_DETAIL_ENTRY] },
      identity(client),
    );
    expect(result.contexts[0].verified).toBe(false);
    expect(result.contexts[0].value).toEqual({});
  });

  it("strips a foreign brand_id (not in the operator's org)", async () => {
    const client = mockSupabaseClient({
      shoots: [{ id: "shoot-1", brand_id: "brand-1" }],
      brands: [],
    });
    const result = await verifyPageContextClaims(
      { available: true, contexts: [SHOOT_DETAIL_ENTRY] },
      identity(client),
    );
    expect(result.contexts[0].verified).toBe(false);
    expect(result.contexts[0].value).toEqual({});
  });

  it("strips a real shoot_id claimed alongside a foreign brand_id", async () => {
    const client = mockSupabaseClient({
      shoots: [{ id: "shoot-1", brand_id: "brand-2" }],
      brands: [{ id: "brand-1", org_id: "org-1" }],
    });
    const result = await verifyPageContextClaims(
      { available: true, contexts: [SHOOT_DETAIL_ENTRY] },
      identity(client),
    );
    expect(result.contexts[0].verified).toBe(false);
    expect(result.contexts[0].value).toEqual({});
  });

  it("verifies a brand-only entry (shoot wizard before commit) without touching shoots", async () => {
    const wizardEntry = {
      description: "Shoot wizard — operator is on the Basics step.",
      value: { wizard_step: "Basics", brand_id: "brand-1", shoot_name: "SS26" },
    };
    const client = mockSupabaseClient({
      brands: [{ id: "brand-1", org_id: "org-1" }],
    });
    const result = await verifyPageContextClaims(
      { available: true, contexts: [wizardEntry] },
      identity(client),
    );
    expect(result.contexts[0].verified).toBe(true);
    expect(result.contexts[0].value).toEqual(wizardEntry.value);
    expect(client.from).not.toHaveBeenCalledWith("shoot_portfolio_view");
  });

  it("fails closed when the verification query errors", async () => {
    const client = mockSupabaseClient({ error: { message: "boom" } });
    const result = await verifyPageContextClaims(
      { available: true, contexts: [SHOOT_DETAIL_ENTRY, ROUTE_ENTRY] },
      identity(client),
    );
    expect(result.contexts[0].verified).toBe(false);
    expect(result.contexts[0].value).toEqual({});
    expect(result.contexts[1].verified).toBe(true);
  });
});

describe("getCurrentPageContext tool", () => {
  it("forwards the run requestContext into the result (execute wiring)", async () => {
    vi.mocked(getCrmUserClient).mockResolvedValue({
      client: null,
      error: "Access token not available in request context",
    });
    const requestContext = contextWithAgUi([SHOOT_DETAIL_ENTRY]);
    const result = await getCurrentPageContext.execute(
      {} as never,
      { requestContext } as never,
    );
    expect(result).toMatchObject({
      available: true,
      contexts: [{ description: expect.stringContaining("Spring Campaign") }],
    });
  });

  it("reports unavailable when the turn carried no page context", async () => {
    const result = await getCurrentPageContext.execute({} as never, {} as never);
    expect(result).toEqual({ available: false, contexts: [] });
  });

  it("verifies claims in execute: authorized shoot/brand resolve to verified", async () => {
    const client = mockSupabaseClient({
      shoots: [{ id: "shoot-1", brand_id: "brand-1" }],
      brands: [{ id: "brand-1", org_id: "org-1" }],
    });
    vi.mocked(getCrmUserClient).mockResolvedValue({
      client,
      orgId: "org-1",
      userId: "user-1",
    });
    const requestContext = contextWithAgUi([SHOOT_DETAIL_ENTRY]);
    const result = await getCurrentPageContext.execute(
      {} as never,
      { requestContext } as never,
    );
    expect(result).toMatchObject({
      available: true,
      contexts: [
        {
          verified: true,
          value: expect.objectContaining({ shoot_id: "shoot-1", brand_id: "brand-1" }),
        },
      ],
    });
  });
});
