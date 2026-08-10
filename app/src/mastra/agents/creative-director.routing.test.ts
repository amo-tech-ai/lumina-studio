import { RequestContext } from "@mastra/core/request-context";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resetAgentRoutingWarnState } from "@/lib/ai/agent-routing";
import * as cloudflareModels from "@/lib/ai/cloudflare-models";
import { creativeDirectorAgent } from "./index";

function ctx(env: Record<string, unknown> | undefined): RequestContext {
  const c = new RequestContext();
  if (env) (c as any).set("cfEnv", env);
  return c;
}
const fakeAI = { run: vi.fn() } as any;

describe("creativeDirectorAgent — IPI-751 W2 routing (fail-closed, reuse harness)", () => {
  afterEach(() => {
    resetAgentRoutingWarnState();
    vi.restoreAllMocks();
  });

  it("has correct id and uses dynamic model", () => {
    expect(creativeDirectorAgent.id).toBe("creative-director");
    // model is now a function, not static LanguageModel
    // @ts-expect-error internal
    expect(typeof creativeDirectorAgent.model).toBe("function");
  });

  it("getModel with native cfEnv calls resolveAgentModel with correct args", async () => {
    const spy = vi.spyOn(cloudflareModels, "resolveAgentModel");
    const requestContext = ctx({ AI_ROUTING_AGENT_CREATIVE_DIRECTOR: "native", AI: fakeAI });
    const model = await (creativeDirectorAgent as any).getModel({ requestContext });
    expect(model).toBeDefined();
    expect(spy).toHaveBeenCalledWith({ agentId: "creative-director", tier: "default", requestContext });
    // native should return Workers AI model with modelId
    expect((model as any).modelId).toBe("@cf/moonshotai/kimi-k2.6");
  });

  it("getModel without cfEnv falls back to legacy (no throw)", async () => {
    const model = await (creativeDirectorAgent as any).getModel({ requestContext: ctx(undefined) });
    expect(model).toBeDefined();
    // legacy model has provider google or groq, not workers-ai
    // we just prove it doesn't throw and mode is legacy via helper
    const { resolveAgentModelOutcome } = await import("@/lib/ai/cloudflare-models");
    const outcome = resolveAgentModelOutcome({ agentId: "creative-director", requestContext: ctx(undefined) });
    expect(outcome.mode).toBe("legacy");
  });

  it("rollback: native → legacy restores legacy model", async () => {
    const nativeCtx = ctx({ AI_ROUTING_AGENT_CREATIVE_DIRECTOR: "native", AI: fakeAI });
    const legacyCtx = ctx({ AI_ROUTING_AGENT_CREATIVE_DIRECTOR: "legacy", AI: fakeAI });
    const nativeModel = await (creativeDirectorAgent as any).getModel({ requestContext: nativeCtx });
    const legacyModel = await (creativeDirectorAgent as any).getModel({ requestContext: legacyCtx });
    expect((nativeModel as any).modelId).toBe("@cf/moonshotai/kimi-k2.6");
    expect((legacyModel as any).modelId).not.toBe("@cf/moonshotai/kimi-k2.6");
  });
});
