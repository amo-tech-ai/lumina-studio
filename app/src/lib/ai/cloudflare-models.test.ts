import { Agent } from "@mastra/core/agent";
import { RequestContext } from "@mastra/core/request-context";
import { afterEach, describe, expect, it, vi } from "vitest";

import { resetAgentRoutingWarnState } from "./agent-routing";
import { resolveAgentModel, resolveAgentModelOutcome } from "./cloudflare-models";

function contextWithCfEnv(env: Record<string, unknown> | undefined): RequestContext {
  const requestContext = new RequestContext();
  if (env) requestContext.set("cfEnv", env);
  return requestContext;
}

const fakeAiBinding = { run: vi.fn() };

describe("IPI-750 cloudflare-models resolver", () => {
  afterEach(() => {
    resetAgentRoutingWarnState();
    vi.restoreAllMocks();
  });

  it("compiles as a real Mastra Agent model callback (contract test)", () => {
    // Never instantiated at runtime beyond this module-level construction —
    // if this compiles, resolveAgentModel satisfies Agent's real model type.
    const agent = new Agent({
      id: "contract-test-agent",
      name: "Contract Test Agent",
      instructions: "unused",
      model: ({ requestContext }) =>
        resolveAgentModel({ agentId: "production-planner", tier: "default", requestContext }),
    });
    expect(agent).toBeDefined();
  });

  it("no cfEnv at all (Vercel / Node / Vitest) → legacy", () => {
    const outcome = resolveAgentModelOutcome({
      agentId: "production-planner",
      requestContext: contextWithCfEnv(undefined),
    });
    expect(outcome.mode).toBe("legacy");
    expect(outcome.reason).toBe("no_cf_env");
  });

  it("cfEnv present, native flag, no env.AI binding → legacy", () => {
    const outcome = resolveAgentModelOutcome({
      agentId: "production-planner",
      requestContext: contextWithCfEnv({
        AI_ROUTING_AGENT_PRODUCTION_PLANNER: "native",
      }),
    });
    expect(outcome.mode).toBe("legacy");
    expect(outcome.reason).toBe("missing_ai_binding");
  });

  it("cfEnv present, no native flag, env.AI present → legacy", () => {
    const outcome = resolveAgentModelOutcome({
      agentId: "production-planner",
      requestContext: contextWithCfEnv({ AI: fakeAiBinding }),
    });
    expect(outcome.mode).toBe("legacy");
    expect(outcome.reason).toBe("legacy_flag");
  });

  it("native flag + env.AI + supported tier → native Workers AI model", () => {
    const outcome = resolveAgentModelOutcome({
      agentId: "production-planner",
      tier: "default",
      requestContext: contextWithCfEnv({
        AI_ROUTING_AGENT_PRODUCTION_PLANNER: "native",
        AI: fakeAiBinding,
      }),
    });
    expect(outcome.mode).toBe("native");
    expect(outcome.reason).toBe("native");
    expect(outcome.model).toBeDefined();
  });

  it("native flag + env.AI but unsupported tier → legacy", () => {
    const outcome = resolveAgentModelOutcome({
      agentId: "booking",
      tier: "stt",
      requestContext: contextWithCfEnv({
        AI_ROUTING_AGENT_BOOKING: "native",
        AI: fakeAiBinding,
      }),
    });
    expect(outcome.mode).toBe("legacy");
    expect(outcome.reason).toBe("unsupported_tier");
  });

  it("unknown agent id → legacy, distinct reason", () => {
    const outcome = resolveAgentModelOutcome({
      agentId: "exports-agent",
      requestContext: contextWithCfEnv({ AI: fakeAiBinding }),
    });
    expect(outcome.mode).toBe("legacy");
    expect(outcome.reason).toBe("unknown_agent");
  });

  it("invalid flag value → legacy (fails closed, matches agent-routing.ts)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const outcome = resolveAgentModelOutcome({
      agentId: "production-planner",
      requestContext: contextWithCfEnv({
        AI_ROUTING_AGENT_PRODUCTION_PLANNER: "banana",
        AI: fakeAiBinding,
      }),
    });
    expect(outcome.mode).toBe("legacy");
    expect(warn).toHaveBeenCalled();
  });

  it("marketing-chat's public-marketing agent works the same way (no surface param needed)", () => {
    const outcome = resolveAgentModelOutcome({
      agentId: "public-marketing",
      tier: "fast",
      requestContext: contextWithCfEnv({
        AI_ROUTING_AGENT_PUBLIC_MARKETING: "native",
        AI: fakeAiBinding,
      }),
    });
    expect(outcome.mode).toBe("native");
  });

  it("a flag only in process.env is never honored — cfEnv must be explicit (IPI-607 risk note)", () => {
    const previous = process.env.AI_ROUTING_AGENT_PRODUCTION_PLANNER;
    process.env.AI_ROUTING_AGENT_PRODUCTION_PLANNER = "native";
    try {
      const outcome = resolveAgentModelOutcome({
        agentId: "production-planner",
        // cfEnv present but lacks the flag — process.env must not leak in.
        requestContext: contextWithCfEnv({ AI: fakeAiBinding }),
      });
      expect(outcome.mode).toBe("legacy");
      expect(outcome.reason).toBe("legacy_flag");
    } finally {
      if (previous === undefined) {
        delete process.env.AI_ROUTING_AGENT_PRODUCTION_PLANNER;
      } else {
        process.env.AI_ROUTING_AGENT_PRODUCTION_PLANNER = previous;
      }
    }
  });

  it("a flag only in cfEnv is honored even when process.env has nothing", () => {
    const previous = process.env.AI_ROUTING_AGENT_PRODUCTION_PLANNER;
    delete process.env.AI_ROUTING_AGENT_PRODUCTION_PLANNER;
    try {
      const outcome = resolveAgentModelOutcome({
        agentId: "production-planner",
        requestContext: contextWithCfEnv({
          AI_ROUTING_AGENT_PRODUCTION_PLANNER: "native",
          AI: fakeAiBinding,
        }),
      });
      expect(outcome.mode).toBe("native");
    } finally {
      if (previous !== undefined) process.env.AI_ROUTING_AGENT_PRODUCTION_PLANNER = previous;
    }
  });
});
