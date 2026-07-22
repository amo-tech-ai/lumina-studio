import { RequestContext } from "@mastra/core/request-context";
import { afterEach, describe, expect, it, vi } from "vitest";

import { resetAgentRoutingWarnState } from "@/lib/ai/agent-routing";
import { resolveAgentModelOutcome } from "@/lib/ai/cloudflare-models";
import { PUBLIC_MARKETING_INSTRUCTIONS } from "@/mastra/prompts/public-marketing";
import {
  LeadPayload,
  MarketingLeadState,
  SERVICE_SLUGS,
  LeadReadiness,
} from "@/mastra/types/marketing-lead";
import { publicMarketingAgent } from "./public-marketing-agent";

function contextWithCfEnv(env: Record<string, unknown> | undefined): RequestContext {
  const requestContext = new RequestContext();
  if (env) requestContext.set("cfEnv", env);
  return requestContext;
}

const fakeAiBinding = { run: vi.fn() };

// ─── Agent structure ────────────────────────────────────────────────────────

describe("publicMarketingAgent — structure", () => {
  it("has the correct id", () => {
    expect(publicMarketingAgent.id).toBe("public-marketing");
  });

  it("instructions never mention preview/experimental model ids (IPI-223)", () => {
    // Model is resolveAgentModel(..., tier: "fast") — legacy path still uses
    // resolveModel("fast"). We can't inspect the LanguageModel id through Agent;
    // assert the public prompt stays free of preview/experimental refs.
    expect(PUBLIC_MARKETING_INSTRUCTIONS).not.toMatch(/\bpreview\b|\bexperimental\b|gemini-2\.0/i);
  });

  it("carries no tools (public agent must be unauthenticated)", () => {
    // @ts-expect-error tools is internal but we want to assert it's absent/empty
    const tools = publicMarketingAgent.tools;
    expect(tools == null || Object.keys(tools).length === 0).toBe(true);
  });
});

// ─── IPI-753 · CF-MIG-230-W1 — fail-closed routing (tier: fast) ─────────────

describe("publicMarketingAgent — IPI-753 W1 routing (fail-closed)", () => {
  afterEach(() => {
    resetAgentRoutingWarnState();
    vi.restoreAllMocks();
  });

  it("flag unset / no cfEnv → legacy (ship default)", () => {
    const outcome = resolveAgentModelOutcome({
      agentId: "public-marketing",
      tier: "fast",
      requestContext: contextWithCfEnv(undefined),
    });
    expect(outcome.mode).toBe("legacy");
    expect(outcome.reason).toBe("no_cf_env");
  });

  it("flag legacy + AI binding → legacy", () => {
    const outcome = resolveAgentModelOutcome({
      agentId: "public-marketing",
      tier: "fast",
      requestContext: contextWithCfEnv({
        AI_ROUTING_AGENT_PUBLIC_MARKETING: "legacy",
        AI: fakeAiBinding,
      }),
    });
    expect(outcome.mode).toBe("legacy");
    expect(outcome.reason).toBe("legacy_flag");
  });

  it("flag native + cfEnv.AI → native Workers AI path", () => {
    const outcome = resolveAgentModelOutcome({
      agentId: "public-marketing",
      tier: "fast",
      requestContext: contextWithCfEnv({
        AI_ROUTING_AGENT_PUBLIC_MARKETING: "native",
        AI: fakeAiBinding,
      }),
    });
    expect(outcome.mode).toBe("native");
    expect(outcome.reason).toBe("native");
    expect(outcome.model).toBeDefined();
  });

  it("invalid flag → fail-closed legacy", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const outcome = resolveAgentModelOutcome({
      agentId: "public-marketing",
      tier: "fast",
      requestContext: contextWithCfEnv({
        AI_ROUTING_AGENT_PUBLIC_MARKETING: "banana",
        AI: fakeAiBinding,
      }),
    });
    expect(outcome.mode).toBe("legacy");
    expect(warn).toHaveBeenCalled();
  });

  it("native flag but missing AI binding → legacy", () => {
    const outcome = resolveAgentModelOutcome({
      agentId: "public-marketing",
      tier: "fast",
      requestContext: contextWithCfEnv({
        AI_ROUTING_AGENT_PUBLIC_MARKETING: "native",
      }),
    });
    expect(outcome.mode).toBe("legacy");
    expect(outcome.reason).toBe("missing_ai_binding");
  });

  it("rollback: native → AI_ROUTING_AGENT_PUBLIC_MARKETING=legacy → legacy", () => {
    const native = resolveAgentModelOutcome({
      agentId: "public-marketing",
      tier: "fast",
      requestContext: contextWithCfEnv({
        AI_ROUTING_AGENT_PUBLIC_MARKETING: "native",
        AI: fakeAiBinding,
      }),
    });
    expect(native.mode).toBe("native");

    const rolledBack = resolveAgentModelOutcome({
      agentId: "public-marketing",
      tier: "fast",
      requestContext: contextWithCfEnv({
        AI_ROUTING_AGENT_PUBLIC_MARKETING: "legacy",
        AI: fakeAiBinding,
      }),
    });
    expect(rolledBack.mode).toBe("legacy");
    expect(rolledBack.reason).toBe("legacy_flag");
  });
});

// ─── Security ───────────────────────────────────────────────────────────────

describe("publicMarketingAgent — security", () => {
  it("instructions forbid operator/admin tool mentions", () => {
    expect(PUBLIC_MARKETING_INSTRUCTIONS).toMatch(/NEVER violate/i);
    expect(PUBLIC_MARKETING_INSTRUCTIONS).toMatch(/operator/i);
    expect(PUBLIC_MARKETING_INSTRUCTIONS).toMatch(/admin/i);
  });

  it("instructions forbid Supabase / service-role references", () => {
    expect(PUBLIC_MARKETING_INSTRUCTIONS).toMatch(/Supabase/i);
  });

  it("internal topics only appear inside the restriction block, never as features", () => {
    // The prompt correctly names forbidden topics inside a "Hard restrictions" block.
    // What must NOT appear: service-role keys, admin API keys, or shoot-scheduling
    // instructions — none of those belong anywhere in a public prompt.
    expect(PUBLIC_MARKETING_INSTRUCTIONS).not.toMatch(/service.?role.?key|admin.*api.*key/i);
    expect(PUBLIC_MARKETING_INSTRUCTIONS).not.toMatch(/shoot.schedul.*how/i);
  });
});

// ─── Service routing (prompt coverage) ─────────────────────────────────────

describe("publicMarketingAgent — service routing coverage", () => {
  const EXPECTED_SLUGS: Array<(typeof SERVICE_SLUGS)[number]> = [
    "fashion-photography",
    "amazon",
    "shopify",
    "ecommerce-photography",
    "clothing",
    "jewellery",
    "instagram",
    "video",
    "location",
    "general",
  ];

  it.each(EXPECTED_SLUGS)(
    "instructions list the '%s' service slug",
    (slug) => {
      expect(PUBLIC_MARKETING_INSTRUCTIONS).toContain(slug);
    },
  );
});

// ─── Lead state (schema) ────────────────────────────────────────────────────

describe("MarketingLeadState schema", () => {
  it("defaults readiness to 'browsing'", () => {
    const state = MarketingLeadState.parse({});
    expect(state.readiness).toBe("browsing");
  });

  it("accepts a fully qualified lead", () => {
    const state = MarketingLeadState.parse({
      name: "Jordan Lee",
      email: "jordan@brand.co",
      company: "Cool Brand",
      service_interest: "shopify",
      budget: "$5k–$10k",
      timeline: "Q3 2026",
      website: "https://coolbrand.co",
      project_summary: "Full Shopify product photography refresh",
      readiness: "ready_to_submit",
    });
    expect(state.readiness).toBe("ready_to_submit");
    expect(state.service_interest).toBe("shopify");
  });

  it("preserves already-gathered fields on partial update", () => {
    const initial = MarketingLeadState.parse({
      name: "Jordan Lee",
      email: "jordan@brand.co",
      readiness: "interested",
    });
    // Merging in new fields should not drop existing ones.
    const updated = MarketingLeadState.parse({ ...initial, budget: "$5k" });
    expect(updated.name).toBe("Jordan Lee");
    expect(updated.email).toBe("jordan@brand.co");
    expect(updated.budget).toBe("$5k");
  });

  it("rejects an invalid service slug", () => {
    expect(() =>
      MarketingLeadState.parse({ service_interest: "not-a-real-service" }),
    ).toThrow();
  });

  it("rejects a malformed email", () => {
    expect(() =>
      MarketingLeadState.parse({ email: "not-an-email" }),
    ).toThrow();
  });
});

// ─── Lead submission payload (WEB-015.4) ────────────────────────────────────

describe("LeadPayload — submission contract", () => {
  it("requires name, email, and service_interest", () => {
    expect(() =>
      LeadPayload.parse({
        name: "Jordan",
        email: "j@brand.co",
      }),
    ).toThrow();
  });

  it("accepts a minimal ready-to-submit payload", () => {
    const payload = LeadPayload.parse({
      name: "Jordan Lee",
      email: "jordan@brand.co",
      service_interest: "shopify",
      readiness: "ready_to_submit",
    });
    expect(payload.service_interest).toBe("shopify");
    expect(payload.name).toBe("Jordan Lee");
  });

  it("rejects an invalid service slug even when other fields are present", () => {
    expect(() =>
      LeadPayload.parse({
        name: "Jordan",
        email: "j@brand.co",
        service_interest: "not-a-service",
      }),
    ).toThrow();
  });
});

// ─── Readiness progression ──────────────────────────────────────────────────

describe("LeadReadiness — progression logic", () => {
  const toReady = (fields: Partial<typeof MarketingLeadState._type>) =>
    MarketingLeadState.parse(fields);

  it("starts as 'browsing' with no data", () => {
    expect(toReady({}).readiness).toBe("browsing");
  });

  it("accepts 'interested' when explicitly set", () => {
    const s = toReady({ readiness: "interested" });
    expect(s.readiness).toBe("interested");
  });

  it("accepts 'qualified' when explicitly set", () => {
    const s = toReady({ readiness: "qualified" });
    expect(s.readiness).toBe("qualified");
  });

  it("accepts 'ready_to_submit' when explicitly set", () => {
    const s = toReady({ readiness: "ready_to_submit" });
    expect(s.readiness).toBe("ready_to_submit");
  });

  it("LeadReadiness enum covers expected values", () => {
    const values = LeadReadiness.options;
    expect(values).toEqual([
      "browsing",
      "interested",
      "qualified",
      "ready_to_submit",
    ]);
  });
});

// ─── Registry presence ──────────────────────────────────────────────────────

describe("Mastra registry — public-marketing agent", () => {
  it("is exported from the agents barrel", async () => {
    const { publicMarketingAgent: agent } = await import("./public-marketing-agent");
    expect(agent).toBeDefined();
    expect(agent.id).toBe("public-marketing");
  });

  it(
    "is NOT in the shared operator registry (C5 fix — must stay in publicMastra only)",
    async () => {
      // @/mastra/index cold-imports the full agent/workflow/storage graph —
      // measured 1.2-1.3s idle, too little headroom against the 5s default
      // under any real machine load. Scoped timeout, not a global bump.
      const { agents } = await import("@/mastra/index");
      expect(agents).not.toHaveProperty("public-marketing");
    },
    15_000,
  );
});
