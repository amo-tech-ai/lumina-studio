// AGENT-CTX-001 — server-side consumer tests. These prove the read end of the
// context wire: @ag-ui/mastra writes the client-side useAgentContext payload
// into the per-run RequestContext under "ag-ui", and this tool must surface it
// to the model. The fixture below replicates exactly what applyInputContext
// stores (`{ context: [...] }`).
import { describe, expect, it } from "vitest";
import { RequestContext } from "@mastra/core/request-context";
import { getCurrentPageContext, readPageContextFromRequestContext } from "./currentPageContext";

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
    const requestContext = contextWithAgUi([
      SHOOT_DETAIL_ENTRY,
      { description: "Route — operator is on /app/shoots", value: { surface: "route" } },
    ]);
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

describe("getCurrentPageContext tool", () => {
  it("forwards the run requestContext into the result (execute wiring)", async () => {
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
});
