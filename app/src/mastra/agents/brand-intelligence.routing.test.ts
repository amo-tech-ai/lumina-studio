import { RequestContext } from "@mastra/core/request-context";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resetAgentRoutingWarnState } from "@/lib/ai/agent-routing";
import * as cloudflareModels from "@/lib/ai/cloudflare-models";
import { brandIntelligenceAgent } from "./brand-intelligence-agent";

function ctx(env: Record<string, unknown> | undefined): RequestContext {
  const c = new RequestContext();
  if (env) (c as { set: (k: string, v: unknown) => void }).set("cfEnv", env);
  return c;
}
const fakeAI = { run: vi.fn() };

describe("brandIntelligenceAgent — IPI-754 W4 routing (fail-closed, reuse harness)", () => {
  afterEach(() => {
    resetAgentRoutingWarnState();
    vi.restoreAllMocks();
  });

  it("has correct id and uses dynamic model", () => {
    expect(brandIntelligenceAgent.id).toBe("brand-intelligence");
    expect(typeof (brandIntelligenceAgent as { getModel?: unknown }).getModel).toBe("function");
  });

  it("getModel with native cfEnv calls resolveAgentModel with correct args", async () => {
    const spy = vi.spyOn(cloudflareModels, "resolveAgentModel");
    const requestContext = ctx({ AI_ROUTING_AGENT_BRAND_INTELLIGENCE: "native", AI: fakeAI });
    const model = await (brandIntelligenceAgent as { getModel: (a: unknown) => Promise<unknown> }).getModel({
      requestContext,
    });
    expect(model).toBeDefined();
    expect(spy).toHaveBeenCalledWith({
      agentId: "brand-intelligence",
      tier: "default",
      requestContext,
    });
    expect((model as { modelId?: string }).modelId).toBe("@cf/moonshotai/kimi-k2.6");
  });

  it("getModel without cfEnv falls back to legacy (no throw)", async () => {
    const model = await (brandIntelligenceAgent as { getModel: (a: unknown) => Promise<unknown> }).getModel({
      requestContext: ctx(undefined),
    });
    expect(model).toBeDefined();
    const { resolveAgentModelOutcome } = await import("@/lib/ai/cloudflare-models");
    const outcome = resolveAgentModelOutcome({
      agentId: "brand-intelligence",
      requestContext: ctx(undefined),
    });
    expect(outcome.mode).toBe("legacy");
  });

  it("rollback: native → legacy restores legacy model", async () => {
    const nativeCtx = ctx({ AI_ROUTING_AGENT_BRAND_INTELLIGENCE: "native", AI: fakeAI });
    const legacyCtx = ctx({ AI_ROUTING_AGENT_BRAND_INTELLIGENCE: "legacy", AI: fakeAI });
    const nativeModel = await (brandIntelligenceAgent as { getModel: (a: unknown) => Promise<unknown> }).getModel({
      requestContext: nativeCtx,
    });
    const legacyModel = await (brandIntelligenceAgent as { getModel: (a: unknown) => Promise<unknown> }).getModel({
      requestContext: legacyCtx,
    });
    expect((nativeModel as { modelId?: string }).modelId).toBe("@cf/moonshotai/kimi-k2.6");
    expect((legacyModel as { modelId?: string }).modelId).not.toBe("@cf/moonshotai/kimi-k2.6");
  });

  it("resolveAgentModel throw falls back to legacy with a sanitized warning", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(cloudflareModels, "resolveAgentModel").mockRejectedValue(
      new Error("boom: secret-should-not-leak"),
    );
    const model = await (brandIntelligenceAgent as { getModel: (a: unknown) => Promise<unknown> }).getModel({
      requestContext: ctx({ AI_ROUTING_AGENT_BRAND_INTELLIGENCE: "native", AI: fakeAI }),
    });
    expect(model).toBeDefined();
    expect((model as { modelId?: string }).modelId).not.toBe("@cf/moonshotai/kimi-k2.6");
    expect(warn).toHaveBeenCalledWith(
      "[brandIntelligence] resolveAgentModel failed (agentId: brand-intelligence, tier: default); falling back to legacy model",
    );
    expect(warn.mock.calls.flat().join(" ")).not.toContain("secret-should-not-leak");
  });
});
