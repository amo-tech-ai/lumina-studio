import { RequestContext } from "@mastra/core/request-context";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resetAgentRoutingWarnState } from "@/lib/ai/agent-routing";
import * as cloudflareModels from "@/lib/ai/cloudflare-models";
import { productionPlannerAgent } from "./index";

function ctx(env: Record<string, unknown> | undefined): RequestContext {
  const c = new RequestContext();
  if (env) (c as any).set("cfEnv", env);
  return c;
}
const fakeAI = { run: vi.fn() } as any;

describe("productionPlannerAgent — IPI-752 W3 routing (fail-closed, reuse harness)", () => {
  afterEach(() => {
    resetAgentRoutingWarnState();
    vi.restoreAllMocks();
  });

  it("has correct id and uses dynamic model", () => {
    expect(productionPlannerAgent.id).toBe("production-planner");
    // dynamic model via getModel, not static LanguageModel
    expect(typeof (productionPlannerAgent as any).getModel).toBe("function");
  });

  it("getModel with native cfEnv calls resolveAgentModel with correct args", async () => {
    const spy = vi.spyOn(cloudflareModels, "resolveAgentModel");
    const requestContext = ctx({ AI_ROUTING_AGENT_PRODUCTION_PLANNER: "native", AI: fakeAI });
    const model = await (productionPlannerAgent as any).getModel({ requestContext });
    expect(model).toBeDefined();
    expect(spy).toHaveBeenCalledWith({ agentId: "production-planner", tier: "default", requestContext });
    // native should return Workers AI model with modelId
    expect((model as any).modelId).toBe("@cf/moonshotai/kimi-k2.6");
  });

  it("getModel without cfEnv falls back to legacy (no throw)", async () => {
    const model = await (productionPlannerAgent as any).getModel({ requestContext: ctx(undefined) });
    expect(model).toBeDefined();
    // legacy model has provider google or groq, not workers-ai
    // we just prove it doesn't throw and mode is legacy via helper
    const { resolveAgentModelOutcome } = await import("@/lib/ai/cloudflare-models");
    const outcome = resolveAgentModelOutcome({ agentId: "production-planner", requestContext: ctx(undefined) });
    expect(outcome.mode).toBe("legacy");
  });

  it("rollback: native → legacy restores legacy model", async () => {
    const nativeCtx = ctx({ AI_ROUTING_AGENT_PRODUCTION_PLANNER: "native", AI: fakeAI });
    const legacyCtx = ctx({ AI_ROUTING_AGENT_PRODUCTION_PLANNER: "legacy", AI: fakeAI });
    const nativeModel = await (productionPlannerAgent as any).getModel({ requestContext: nativeCtx });
    const legacyModel = await (productionPlannerAgent as any).getModel({ requestContext: legacyCtx });
    expect((nativeModel as any).modelId).toBe("@cf/moonshotai/kimi-k2.6");
    expect((legacyModel as any).modelId).not.toBe("@cf/moonshotai/kimi-k2.6");
  });
});
