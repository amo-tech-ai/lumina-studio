import { RequestContext } from "@mastra/core/request-context";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resetAgentRoutingWarnState } from "@/lib/ai/agent-routing";
import * as cloudflareModels from "@/lib/ai/cloudflare-models";
import { crmAssistantAgent } from "./crm-assistant-agent";

function ctx(env: Record<string, unknown> | undefined): RequestContext {
  const c = new RequestContext();
  if (env) (c as { set: (k: string, v: unknown) => void }).set("cfEnv", env);
  return c;
}
const fakeAI = { run: vi.fn() };

const CANARY_READ_TOOLS = ["searchCompanies", "searchContacts", "scoreDealHealth"] as const;
const WRITE_TOOLS = ["logActivity", "moveDealStage"] as const;

describe("crmAssistantAgent — IPI-755 W5 routing (fail-closed, reuse harness)", () => {
  afterEach(() => {
    resetAgentRoutingWarnState();
    vi.restoreAllMocks();
  });

  it("has correct id and uses dynamic model", () => {
    expect(crmAssistantAgent.id).toBe("crm-assistant");
    expect(typeof (crmAssistantAgent as { getModel?: unknown }).getModel).toBe("function");
  });

  it("canary read-only allowlist excludes mutation tools", async () => {
    const tools = await crmAssistantAgent.listTools();
    const names = Object.keys(tools ?? {});
    for (const read of CANARY_READ_TOOLS) expect(names).toContain(read);
    for (const write of WRITE_TOOLS) expect(names).toContain(write);
    expect(CANARY_READ_TOOLS.some((n) => (WRITE_TOOLS as readonly string[]).includes(n))).toBe(false);
  });

  it("getModel with native cfEnv calls resolveAgentModel with correct args", async () => {
    const spy = vi.spyOn(cloudflareModels, "resolveAgentModel");
    const requestContext = ctx({ AI_ROUTING_AGENT_CRM_ASSISTANT: "native", AI: fakeAI });
    const model = await (crmAssistantAgent as { getModel: (a: unknown) => Promise<unknown> }).getModel({
      requestContext,
    });
    expect(model).toBeDefined();
    expect(spy).toHaveBeenCalledWith({
      agentId: "crm-assistant",
      tier: "default",
      requestContext,
    });
    expect((model as { modelId?: string }).modelId).toBe("@cf/moonshotai/kimi-k2.6");
  });

  it("getModel without cfEnv falls back to legacy (no throw)", async () => {
    const model = await (crmAssistantAgent as { getModel: (a: unknown) => Promise<unknown> }).getModel({
      requestContext: ctx(undefined),
    });
    expect(model).toBeDefined();
    const { resolveAgentModelOutcome } = await import("@/lib/ai/cloudflare-models");
    const outcome = resolveAgentModelOutcome({
      agentId: "crm-assistant",
      requestContext: ctx(undefined),
    });
    expect(outcome.mode).toBe("legacy");
  });

  it("rollback: native → legacy restores legacy model", async () => {
    const nativeCtx = ctx({ AI_ROUTING_AGENT_CRM_ASSISTANT: "native", AI: fakeAI });
    const legacyCtx = ctx({ AI_ROUTING_AGENT_CRM_ASSISTANT: "legacy", AI: fakeAI });
    const nativeModel = await (crmAssistantAgent as { getModel: (a: unknown) => Promise<unknown> }).getModel({
      requestContext: nativeCtx,
    });
    const legacyModel = await (crmAssistantAgent as { getModel: (a: unknown) => Promise<unknown> }).getModel({
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
    const model = await (crmAssistantAgent as { getModel: (a: unknown) => Promise<unknown> }).getModel({
      requestContext: ctx({ AI_ROUTING_AGENT_CRM_ASSISTANT: "native", AI: fakeAI }),
    });
    expect(model).toBeDefined();
    expect((model as { modelId?: string }).modelId).not.toBe("@cf/moonshotai/kimi-k2.6");
    expect(warn).toHaveBeenCalledWith(
      "[crmAssistant] resolveAgentModel failed (agentId: crm-assistant, tier: default); falling back to legacy model",
    );
    expect(warn.mock.calls.flat().join(" ")).not.toContain("secret-should-not-leak");
  });
});
