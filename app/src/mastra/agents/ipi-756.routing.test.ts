import { RequestContext } from "@mastra/core/request-context";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resetAgentRoutingWarnState } from "@/lib/ai/agent-routing";
import * as cloudflareModels from "@/lib/ai/cloudflare-models";
import { GEMINI_MODELS } from "@/lib/ai/gemini-registry";
import { bookingAgent } from "./booking-agent";
import { modelMatchAgent } from "./model-match-agent";
import { socialDiscoveryAgent } from "./social-discovery";
import { visualIdentityAgent } from "./visual-identity";

function ctx(env: Record<string, unknown> | undefined): RequestContext {
  const c = new RequestContext();
  if (env) (c as { set: (k: string, v: unknown) => void }).set("cfEnv", env);
  return c;
}
const fakeAI = { run: vi.fn() };

const REMAINING = [
  {
    agent: visualIdentityAgent,
    agentId: "visual-identity",
    envKey: "AI_ROUTING_AGENT_VISUAL_IDENTITY",
    warn: "[visualIdentity] resolveAgentModel failed (agentId: visual-identity, tier: default); falling back to legacy vision model",
  },
  {
    agent: socialDiscoveryAgent,
    agentId: "social-discovery",
    envKey: "AI_ROUTING_AGENT_SOCIAL_DISCOVERY",
    warn: "[socialDiscovery] resolveAgentModel failed (agentId: social-discovery, tier: default); falling back to legacy model",
  },
  {
    agent: modelMatchAgent,
    agentId: "model-match",
    envKey: "AI_ROUTING_AGENT_MODEL_MATCH",
    warn: "[modelMatch] resolveAgentModel failed (agentId: model-match, tier: default); falling back to legacy model",
  },
  {
    agent: bookingAgent,
    agentId: "booking",
    envKey: "AI_ROUTING_AGENT_BOOKING",
    warn: "[booking] resolveAgentModel failed (agentId: booking, tier: default); falling back to legacy model",
  },
] as const;

describe("IPI-756 remaining agents — routing (fail-closed, reuse harness)", () => {
  afterEach(() => {
    resetAgentRoutingWarnState();
    vi.restoreAllMocks();
  });

  it.each(REMAINING)("$agentId has correct id and uses dynamic model", ({ agent, agentId }) => {
    expect(agent.id).toBe(agentId);
    expect(typeof (agent as { getModel?: unknown }).getModel).toBe("function");
  });

  it.each(REMAINING)(
    "$agentId getModel with native cfEnv calls resolveAgentModel with correct args",
    async ({ agent, agentId, envKey }) => {
      const spy = vi.spyOn(cloudflareModels, "resolveAgentModel");
      const requestContext = ctx({ [envKey]: "native", AI: fakeAI });
      const model = await (agent as { getModel: (a: unknown) => Promise<unknown> }).getModel({
        requestContext,
      });
      expect(model).toBeDefined();
      expect(spy).toHaveBeenCalledWith({
        agentId,
        tier: "default",
        requestContext,
      });
      expect((model as { modelId?: string }).modelId).toBe("@cf/moonshotai/kimi-k2.6");
    },
  );

  it.each(REMAINING)("$agentId getModel without cfEnv falls back to legacy (no throw)", async ({ agent, agentId }) => {
    const model = await (agent as { getModel: (a: unknown) => Promise<unknown> }).getModel({
      requestContext: ctx(undefined),
    });
    expect(model).toBeDefined();
    const { resolveAgentModelOutcome } = await import("@/lib/ai/cloudflare-models");
    const outcome = resolveAgentModelOutcome({
      agentId,
      requestContext: ctx(undefined),
    });
    expect(outcome.mode).toBe("legacy");
  });

  it.each(REMAINING)("$agentId rollback: native → legacy restores legacy model", async ({ agent, envKey }) => {
    const nativeModel = await (agent as { getModel: (a: unknown) => Promise<unknown> }).getModel({
      requestContext: ctx({ [envKey]: "native", AI: fakeAI }),
    });
    const legacyModel = await (agent as { getModel: (a: unknown) => Promise<unknown> }).getModel({
      requestContext: ctx({ [envKey]: "legacy", AI: fakeAI }),
    });
    expect((nativeModel as { modelId?: string }).modelId).toBe("@cf/moonshotai/kimi-k2.6");
    expect((legacyModel as { modelId?: string }).modelId).not.toBe("@cf/moonshotai/kimi-k2.6");
  });

  it.each(REMAINING)(
    "$agentId resolveAgentModel throw falls back to legacy with a sanitized warning",
    async ({ agent, envKey, warn }) => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      vi.spyOn(cloudflareModels, "resolveAgentModel").mockRejectedValue(
        new Error("boom: secret-should-not-leak"),
      );
      const model = await (agent as { getModel: (a: unknown) => Promise<unknown> }).getModel({
        requestContext: ctx({ [envKey]: "native", AI: fakeAI }),
      });
      expect(model).toBeDefined();
      expect((model as { modelId?: string }).modelId).not.toBe("@cf/moonshotai/kimi-k2.6");
      expect(warnSpy).toHaveBeenCalledWith(warn);
      expect(warnSpy.mock.calls.flat().join(" ")).not.toContain("secret-should-not-leak");
    },
  );

  it("visual-identity non-native outcomes keep resolveModel(vision), including Groq-unset", async () => {
    vi.stubEnv("AI_PROVIDER", "groq");
    vi.stubEnv("GROQ_API_KEY", "");
    vi.stubEnv("GROQ_MODEL_VISION", "");
    const getModel = (requestContext: RequestContext) =>
      (visualIdentityAgent as { getModel: (a: unknown) => Promise<{ modelId?: string }> }).getModel({
        requestContext,
      });
    const unset = await getModel(ctx(undefined));
    const legacy = await getModel(ctx({ AI_ROUTING_AGENT_VISUAL_IDENTITY: "legacy", AI: fakeAI }));
    const missingAi = await getModel(ctx({ AI_ROUTING_AGENT_VISUAL_IDENTITY: "native" }));
    expect(unset.modelId).toBe(GEMINI_MODELS.default);
    expect(legacy.modelId).toBe(GEMINI_MODELS.default);
    expect(missingAi.modelId).toBe(GEMINI_MODELS.default);
    vi.unstubAllEnvs();
  });

  it("booking write tools stay wired; canary must not select them", async () => {
    const tools = await bookingAgent.listTools();
    const names = Object.keys(tools ?? {});
    expect(names).toContain("checkTalentAvailability");
    expect(names).toContain("draftBookingQuote");
    expect(names).toContain("createBookingDraft");
    expect(names).not.toContain("confirmBooking");
  });

  it("model-match write tool stays wired; canary must not select it", async () => {
    const tools = await modelMatchAgent.listTools();
    const names = Object.keys(tools ?? {});
    expect(names).toContain("searchTalentByFilters");
    expect(names).toContain("computeTalentMatchScore");
    expect(names).toContain("manageShortlist");
  });
});
