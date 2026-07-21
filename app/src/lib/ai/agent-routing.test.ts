import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AGENT_ROUTING_KEYS,
  listAgentRoutingEnvKeys,
  resetAgentRoutingWarnState,
  resolveAgentRoutingEnvKey,
  resolveAgentRoutingMode,
  resolveAgentRoutingOutcome,
  resolveCanonicalRoutableAgentId,
  type RoutableAgentId,
} from "./agent-routing";

const ROUTABLE_IDS = Object.keys(AGENT_ROUTING_KEYS) as RoutableAgentId[];

describe("IPI-607 agent routing flags", () => {
  afterEach(() => {
    resetAgentRoutingWarnState();
    vi.restoreAllMocks();
  });

  it("maps every routable agent to exactly one unique env key", () => {
    const keys = listAgentRoutingEnvKeys();
    expect(keys).toHaveLength(ROUTABLE_IDS.length);
    expect(new Set(keys).size).toBe(keys.length);
    for (const id of ROUTABLE_IDS) {
      expect(resolveAgentRoutingEnvKey(id)).toBe(AGENT_ROUTING_KEYS[id]);
    }
  });

  it("aliases default to production-planner on the operator surface", () => {
    expect(resolveCanonicalRoutableAgentId("default")).toBe("production-planner");
    expect(resolveCanonicalRoutableAgentId("default", "operator")).toBe(
      "production-planner",
    );
    expect(resolveAgentRoutingEnvKey("default")).toBe(
      AGENT_ROUTING_KEYS["production-planner"],
    );
  });

  it("aliases default to public-marketing on the marketing surface", () => {
    expect(resolveCanonicalRoutableAgentId("default", "marketing")).toBe(
      "public-marketing",
    );
    expect(resolveAgentRoutingEnvKey("default", "marketing")).toBe(
      AGENT_ROUTING_KEYS["public-marketing"],
    );
  });

  it.each([
    { label: "unset", env: {}, expected: "legacy", reason: "unset" },
    {
      label: "legacy",
      env: { AI_ROUTING_AGENT_PUBLIC_MARKETING: "legacy" },
      expected: "legacy",
      reason: "legacy_explicit",
    },
    {
      label: "native",
      env: { AI_ROUTING_AGENT_PUBLIC_MARKETING: "native" },
      expected: "native",
      reason: "native",
    },
    {
      label: "empty",
      env: { AI_ROUTING_AGENT_PUBLIC_MARKETING: "  " },
      expected: "legacy",
      reason: "empty",
    },
    {
      label: "invalid",
      env: { AI_ROUTING_AGENT_PUBLIC_MARKETING: "banana" },
      expected: "legacy",
      reason: "invalid",
    },
    {
      label: "case-normalized native",
      env: { AI_ROUTING_AGENT_PUBLIC_MARKETING: " Native " },
      expected: "native",
      reason: "native",
    },
  ] as const)(
    "public-marketing $label → $expected ($reason)",
    ({ env, expected, reason }) => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const outcome = resolveAgentRoutingOutcome("public-marketing", { env });
      expect(outcome.mode).toBe(expected);
      expect(outcome.reason).toBe(reason);
      expect(resolveAgentRoutingMode("public-marketing", { env })).toBe(expected);
      if (reason === "invalid") {
        expect(warn).toHaveBeenCalled();
      }
    },
  );

  it("unknown agent fail-closes to legacy without env key", () => {
    const outcome = resolveAgentRoutingOutcome("exports-agent", {});
    expect(outcome).toEqual({
      agentId: "exports-agent",
      mode: "legacy",
      reason: "unknown_agent",
    });
  });

  it("flipping one agent leaves the other eight unchanged", () => {
    const env: Record<string, string | undefined> = {};
    for (const id of ROUTABLE_IDS) {
      env[AGENT_ROUTING_KEYS[id]] = "legacy";
    }
    env[AGENT_ROUTING_KEYS["public-marketing"]] = "native";

    expect(resolveAgentRoutingMode("public-marketing", { env })).toBe("native");
    for (const id of ROUTABLE_IDS) {
      if (id === "public-marketing") continue;
      expect(resolveAgentRoutingMode(id, { env })).toBe("legacy");
    }
    expect(resolveAgentRoutingMode("default", { env })).toBe("legacy");
  });

  it("operator default and production-planner share the planner switch", () => {
    const env = {
      AI_ROUTING_AGENT_PRODUCTION_PLANNER: "native",
      AI_ROUTING_AGENT_PUBLIC_MARKETING: "legacy",
    };
    expect(resolveAgentRoutingMode("production-planner", { env })).toBe("native");
    expect(resolveAgentRoutingMode("default", { env, surface: "operator" })).toBe(
      "native",
    );
    expect(resolveAgentRoutingMode("default", { env, surface: "marketing" })).toBe(
      "legacy",
    );
  });

  it("marketing default follows public-marketing, not the planner flag", () => {
    const env = {
      AI_ROUTING_AGENT_PRODUCTION_PLANNER: "native",
      AI_ROUTING_AGENT_PUBLIC_MARKETING: "legacy",
    };
    expect(
      resolveAgentRoutingMode("default", { env, surface: "marketing" }),
    ).toBe("legacy");

    const flipped = {
      AI_ROUTING_AGENT_PRODUCTION_PLANNER: "legacy",
      AI_ROUTING_AGENT_PUBLIC_MARKETING: "native",
    };
    expect(
      resolveAgentRoutingMode("default", { env: flipped, surface: "marketing" }),
    ).toBe("native");
    expect(
      resolveAgentRoutingMode("default", { env: flipped, surface: "operator" }),
    ).toBe("legacy");
  });

  it("warns once for repeated invalid values (sanitized)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const env = { AI_ROUTING_AGENT_BOOKING: "nope" };

    resolveAgentRoutingMode("booking", { env });
    resolveAgentRoutingMode("booking", { env });

    expect(warn).toHaveBeenCalledTimes(1);
    const message = String(warn.mock.calls[0]?.[0] ?? "");
    expect(message).toContain("AI_ROUTING_AGENT_BOOKING");
    expect(message).toContain("booking");
    expect(message).not.toMatch(/API_KEY|SECRET|GEMINI/i);
  });

  it("does not read process.env when an env object is passed", () => {
    const previous = process.env.AI_ROUTING_AGENT_CRM_ASSISTANT;
    process.env.AI_ROUTING_AGENT_CRM_ASSISTANT = "native";
    try {
      expect(resolveAgentRoutingMode("crm-assistant", { env: {} })).toBe("legacy");
      expect(
        resolveAgentRoutingMode("crm-assistant", {
          env: { AI_ROUTING_AGENT_CRM_ASSISTANT: "native" },
        }),
      ).toBe("native");
    } finally {
      if (previous === undefined) {
        delete process.env.AI_ROUTING_AGENT_CRM_ASSISTANT;
      } else {
        process.env.AI_ROUTING_AGENT_CRM_ASSISTANT = previous;
      }
    }
  });

  it("leaves global AI_ROUTING_MODE semantics untouched (no coupling)", async () => {
    const { resolveAiRoutingMode } = await import("./provider");
    const prev = process.env.AI_ROUTING_MODE;
    try {
      delete process.env.AI_ROUTING_MODE;
      expect(resolveAiRoutingMode()).toBe("direct");
      process.env.AI_ROUTING_MODE = "gateway";
      expect(resolveAiRoutingMode()).toBe("gateway");
    } finally {
      if (prev === undefined) delete process.env.AI_ROUTING_MODE;
      else process.env.AI_ROUTING_MODE = prev;
    }
  });
});
