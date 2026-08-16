import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("ai", () => ({
  generateText: vi.fn(),
  generateObject: vi.fn(),
}));

import { generateText } from "ai";
import { suggestShootBriefTool } from "./suggestShootBrief";

const MOCK_BRIEF = "A warm editorial shoot brief...";

const fakeAI = { run: vi.fn() } as any;

describe("suggestShootBrief routing — IPI-752 nested canary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("native request context selects production-planner + default + Kimi K2.6", async () => {
    const { RequestContext } = await import("@mastra/core/request-context");
    const cloudflareModels = await import("@/lib/ai/cloudflare-models");
    const spy = vi.spyOn(cloudflareModels, "resolveAgentModel");
    const rc = new RequestContext();
    (rc as unknown as { set: (k: string, v: unknown) => void }).set("cfEnv", {
      AI_ROUTING_AGENT_PRODUCTION_PLANNER: "native",
      AI: fakeAI,
    });
    vi.mocked(generateText).mockResolvedValue({ text: MOCK_BRIEF } as never);
    await suggestShootBriefTool.execute!(
      { channels: ["instagram"], shootName: "Spring Glow" } as never,
      { requestContext: rc } as never,
    );
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ agentId: "production-planner", tier: "default" }));
    const modelArg = vi.mocked(generateText).mock.calls[0][0].model as { modelId?: string };
    expect(modelArg.modelId).toBe("@cf/moonshotai/kimi-k2.6");
  });

  it("request-aware native path succeeds even when legacy resolveModel throws", async () => {
    const models = await import("../models");
    vi.spyOn(models, "resolveModel").mockImplementation(() => {
      throw new Error("unsupported direct provider");
    });
    const { RequestContext } = await import("@mastra/core/request-context");
    const rc = new RequestContext();
    (rc as unknown as { set: (k: string, v: unknown) => void }).set("cfEnv", {
      AI_ROUTING_AGENT_PRODUCTION_PLANNER: "native",
      AI: fakeAI,
    });
    vi.mocked(generateText).mockResolvedValue({ text: MOCK_BRIEF } as never);
    await suggestShootBriefTool.execute!(
      { channels: ["instagram"], shootName: "Spring Glow" } as never,
      { requestContext: rc } as never,
    );
    const modelArg = vi.mocked(generateText).mock.calls[0][0].model as { modelId?: string };
    expect(modelArg.modelId).toBe("@cf/moonshotai/kimi-k2.6");
  });

  it("missing request context uses legacy model", async () => {
    vi.mocked(generateText).mockResolvedValue({ text: MOCK_BRIEF } as never);
    await suggestShootBriefTool.execute!(
      { channels: ["instagram"], shootName: "Spring Glow" } as never,
      {} as never,
    );
    const modelArg = vi.mocked(generateText).mock.calls[0][0].model as { modelId?: string };
    expect(modelArg.modelId).not.toBe("@cf/moonshotai/kimi-k2.6");
  });

  it("resolver failure logs sanitized warning and uses legacy model", async () => {
    const cloudflareModels = await import("@/lib/ai/cloudflare-models");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const modelSpy = vi.spyOn(cloudflareModels, "resolveAgentModel").mockRejectedValue(
      new Error("secret config leak: token=abc123\nstack: at foo"),
    );
    const { RequestContext } = await import("@mastra/core/request-context");
    const rc = new RequestContext();
    (rc as unknown as { set: (k: string, v: unknown) => void }).set("cfEnv", {
      AI_ROUTING_AGENT_PRODUCTION_PLANNER: "native",
      AI: fakeAI,
    });
    vi.mocked(generateText).mockResolvedValue({ text: MOCK_BRIEF } as never);
    await suggestShootBriefTool.execute!(
      { channels: ["instagram"], shootName: "Spring Glow" } as never,
      { requestContext: rc } as never,
    );
    const modelArg = vi.mocked(generateText).mock.calls[0][0].model as { modelId?: string };
    expect(modelArg.modelId).not.toBe("@cf/moonshotai/kimi-k2.6");
    expect(warnSpy).toHaveBeenCalledWith(
      "[suggestShootBrief] resolveAgentModel failed (agentId: production-planner, tier: default); falling back to legacy model",
    );
    expect(warnSpy.mock.calls[0][0]).not.toMatch(/abc123|token=|stack:/);
    warnSpy.mockRestore();
    modelSpy.mockRestore();
  });

  it("turning flag off immediately restores legacy routing", async () => {
    const { RequestContext } = await import("@mastra/core/request-context");
    const rcNative = new RequestContext();
    (rcNative as unknown as { set: (k: string, v: unknown) => void }).set("cfEnv", {
      AI_ROUTING_AGENT_PRODUCTION_PLANNER: "native",
      AI: fakeAI,
    });
    const rcLegacy = new RequestContext();
    (rcLegacy as unknown as { set: (k: string, v: unknown) => void }).set("cfEnv", {
      AI_ROUTING_AGENT_PRODUCTION_PLANNER: "legacy",
      AI: fakeAI,
    });
    vi.mocked(generateText).mockResolvedValue({ text: MOCK_BRIEF } as never);
    await suggestShootBriefTool.execute!(
      { channels: ["instagram"], shootName: "Spring Glow" } as never,
      { requestContext: rcNative } as never,
    );
    const nativeModel = vi.mocked(generateText).mock.calls[0][0].model as { modelId?: string };
    vi.clearAllMocks();
    vi.mocked(generateText).mockResolvedValue({ text: MOCK_BRIEF } as never);
    await suggestShootBriefTool.execute!(
      { channels: ["instagram"], shootName: "Spring Glow" } as never,
      { requestContext: rcLegacy } as never,
    );
    const legacyModel = vi.mocked(generateText).mock.calls[0][0].model as { modelId?: string };
    expect(nativeModel.modelId).toBe("@cf/moonshotai/kimi-k2.6");
    expect(legacyModel.modelId).not.toBe("@cf/moonshotai/kimi-k2.6");
  });
});
