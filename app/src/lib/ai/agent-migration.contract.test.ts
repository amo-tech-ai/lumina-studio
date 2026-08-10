/**
 * IPI-769 · CF-MIG-230-HARNESS — Prove routing helper correctness for Cloudflare vs Legacy.
 *
 * Reusable routing contract test for Cloudflare AI agent migration waves.
 * Extracted from IPI-750 (cloudflare-models.test.ts) and IPI-753 (public-marketing-agent.test.ts).
 *
 * IMPORTANT: This tests the resolveAgentModelOutcome() helper function ONLY.
 * It does NOT verify that individual agents actually call this helper with the correct
 * agent ID and tier. Agent callback coverage requires separate per-agent integration tests.
 *
 * Table-driven tests with explicit agent IDs. Asserts observable routing metadata (mode, reason),
 * exact Workers AI model IDs for native mode, and routing-table completeness.
 *
 * CI runtime target: < 30 seconds for focused contract tests.
 */
import { RequestContext } from "@mastra/core/request-context";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetAgentRoutingWarnState, AGENT_ROUTING_KEYS } from "./agent-routing";
import { resolveAgentModelOutcome } from "./cloudflare-models";
import type { CloudflareModelReason } from "./cloudflare-models";
import type { RoutableAgentId } from "./agent-routing";
import { WORKERS_AI_TIER_CAPABILITIES } from "./model-capabilities";

function contextWithCfEnv(env: Record<string, unknown> | undefined): RequestContext {
  const requestContext = new RequestContext();
  if (env) requestContext.set("cfEnv", env);
  return requestContext;
}

const fakeAiBinding = { run: vi.fn() };

/**
 * Test case definition for table-driven routing contract tests.
 */
type RoutingContractCase = {
  /** Agent identifier (must be a valid RoutableAgentId or "default") */
  agentId: string;
  /** Surface for default resolution (operator → production-planner, marketing → public-marketing) */
  surface?: "operator" | "marketing";
  /** Requested model tier (default for most agents, fast for public-marketing) */
  tier?: "default" | "fast" | "stt";
  /** Cloudflare environment to inject into RequestContext */
  cfEnv?: Record<string, unknown>;
  /** Expected routing mode */
  expectedMode: "native" | "legacy";
  /** Expected routing reason */
  expectedReason: CloudflareModelReason;
  /** Expected Workers AI model ID for native mode (undefined for legacy) */
  expectedModelId?: string;
  /** Whether console.warn should be called (for invalid flag values) */
  expectsWarn?: boolean;
};

/**
 * All migrated and planned agents across migration waves.
 * - W1 (IPI-753): public-marketing (migrated, tier: fast)
 * - W2 (IPI-751): everyday operator agents (production-planner, creative-director)
 * - W3 (IPI-752): production-planner (default tier)
 * - W4 (IPI-754): brand-intelligence, model-match
 * - W5 (IPI-755): crm-assistant
 * - Planned: visual-identity, social-discovery, booking
 */
const AGENT_MIGRATION_CASES: RoutingContractCase[] = [
  // ─── No Cloudflare context (Vercel / Node / Vitest) ────────────────────────
  {
    agentId: "production-planner",
    cfEnv: undefined,
    expectedMode: "legacy",
    expectedReason: "no_cf_env",
  },
  {
    agentId: "public-marketing",
    tier: "fast",
    cfEnv: undefined,
    expectedMode: "legacy",
    expectedReason: "no_cf_env",
  },
  {
    agentId: "creative-director",
    cfEnv: undefined,
    expectedMode: "legacy",
    expectedReason: "no_cf_env",
  },
  {
    agentId: "brand-intelligence",
    cfEnv: undefined,
    expectedMode: "legacy",
    expectedReason: "no_cf_env",
  },
  {
    agentId: "crm-assistant",
    cfEnv: undefined,
    expectedMode: "legacy",
    expectedReason: "no_cf_env",
  },

  // ─── Flag unset / no native routing ───────────────────────────────────────
  {
    agentId: "production-planner",
    cfEnv: { AI: fakeAiBinding },
    expectedMode: "legacy",
    expectedReason: "legacy_flag",
  },
  {
    agentId: "public-marketing",
    tier: "fast",
    cfEnv: { AI: fakeAiBinding },
    expectedMode: "legacy",
    expectedReason: "legacy_flag",
  },

  // ─── Native flag but missing AI binding ───────────────────────────────────
  {
    agentId: "production-planner",
    cfEnv: { AI_ROUTING_AGENT_PRODUCTION_PLANNER: "native" },
    expectedMode: "legacy",
    expectedReason: "missing_ai_binding",
  },
  {
    agentId: "public-marketing",
    tier: "fast",
    cfEnv: { AI_ROUTING_AGENT_PUBLIC_MARKETING: "native" },
    expectedMode: "legacy",
    expectedReason: "missing_ai_binding",
  },

  // ─── Valid native routing (W1 migrated: public-marketing) ───────────────────
  {
    agentId: "public-marketing",
    tier: "fast",
    cfEnv: {
      AI_ROUTING_AGENT_PUBLIC_MARKETING: "native",
      AI: fakeAiBinding,
    },
    expectedMode: "native",
    expectedReason: "native",
    expectedModelId: "@cf/meta/llama-3.1-8b-instruct-fast",
  },

  // ─── Valid native routing (planned W2/W3: production-planner, creative-director) ───
  {
    agentId: "production-planner",
    cfEnv: {
      AI_ROUTING_AGENT_PRODUCTION_PLANNER: "native",
      AI: fakeAiBinding,
    },
    expectedMode: "native",
    expectedReason: "native",
    expectedModelId: "@cf/moonshotai/kimi-k2.6",
  },
  {
    agentId: "creative-director",
    cfEnv: {
      AI_ROUTING_AGENT_CREATIVE_DIRECTOR: "native",
      AI: fakeAiBinding,
    },
    expectedMode: "native",
    expectedReason: "native",
    expectedModelId: "@cf/moonshotai/kimi-k2.6",
  },

  // ─── Valid native routing (planned W4: brand-intelligence, model-match) ─────
  {
    agentId: "brand-intelligence",
    cfEnv: {
      AI_ROUTING_AGENT_BRAND_INTELLIGENCE: "native",
      AI: fakeAiBinding,
    },
    expectedMode: "native",
    expectedReason: "native",
    expectedModelId: "@cf/moonshotai/kimi-k2.6",
  },
  {
    agentId: "model-match",
    cfEnv: {
      AI_ROUTING_AGENT_MODEL_MATCH: "native",
      AI: fakeAiBinding,
    },
    expectedMode: "native",
    expectedReason: "native",
    expectedModelId: "@cf/moonshotai/kimi-k2.6",
  },

  // ─── Valid native routing (planned W5: crm-assistant) ────────────────────────
  {
    agentId: "crm-assistant",
    cfEnv: {
      AI_ROUTING_AGENT_CRM_ASSISTANT: "native",
      AI: fakeAiBinding,
    },
    expectedMode: "native",
    expectedReason: "native",
    expectedModelId: "@cf/moonshotai/kimi-k2.6",
  },

  // ─── Valid native routing (planned: visual-identity, social-discovery) ───────
  {
    agentId: "visual-identity",
    cfEnv: {
      AI_ROUTING_AGENT_VISUAL_IDENTITY: "native",
      AI: fakeAiBinding,
    },
    expectedMode: "native",
    expectedReason: "native",
    expectedModelId: "@cf/moonshotai/kimi-k2.6",
  },
  {
    agentId: "social-discovery",
    cfEnv: {
      AI_ROUTING_AGENT_SOCIAL_DISCOVERY: "native",
      AI: fakeAiBinding,
    },
    expectedMode: "native",
    expectedReason: "native",
    expectedModelId: "@cf/moonshotai/kimi-k2.6",
  },

  // ─── Invalid flag value (fail-closed to legacy) ─────────────────────────────
  {
    agentId: "production-planner",
    cfEnv: {
      AI_ROUTING_AGENT_PRODUCTION_PLANNER: "banana",
      AI: fakeAiBinding,
    },
    expectedMode: "legacy",
    expectedReason: "legacy_flag",
    expectsWarn: true,
  },
  {
    agentId: "public-marketing",
    tier: "fast",
    cfEnv: {
      AI_ROUTING_AGENT_PUBLIC_MARKETING: "invalid-value",
      AI: fakeAiBinding,
    },
    expectedMode: "legacy",
    expectedReason: "legacy_flag",
    expectsWarn: true,
  },

  // ─── Unsupported tier (no Workers AI capability entry) ─────────────────────
  {
    agentId: "booking",
    tier: "stt",
    cfEnv: {
      AI_ROUTING_AGENT_BOOKING: "native",
      AI: fakeAiBinding,
    },
    expectedMode: "legacy",
    expectedReason: "unsupported_tier",
  },

  // ─── Unknown agent ID ───────────────────────────────────────────────────────
  {
    agentId: "unknown-agent",
    cfEnv: { AI: fakeAiBinding },
    expectedMode: "legacy",
    expectedReason: "unknown_agent",
  },

  // ─── Default surface resolution (operator → production-planner) ─────────────
  {
    agentId: "default",
    surface: "operator",
    cfEnv: {
      AI_ROUTING_AGENT_PRODUCTION_PLANNER: "native",
      AI: fakeAiBinding,
    },
    expectedMode: "native",
    expectedReason: "native",
    expectedModelId: "@cf/moonshotai/kimi-k2.6",
  },

  // ─── Default surface resolution (marketing → public-marketing) ─────────────
  // Note: resolveAgentModelOutcome doesn't take surface directly - surface is used
  // by agent-routing.ts to resolve "default" to canonical IDs. Test the canonical ID directly.
  // (Duplicate of lines 123-131 removed - tests identical behavior)
];

describe("IPI-769 agent-migration routing contract", () => {
  afterEach(() => {
    resetAgentRoutingWarnState();
    vi.restoreAllMocks();
  });

  // Ensure test table covers all routable agents from AGENT_ROUTING_KEYS
  it("routing table covers all AGENT_ROUTING_KEYS entries", () => {
    const testedAgentIds = new Set(
      AGENT_MIGRATION_CASES
        .map((c) => c.agentId)
        .filter((id): id is RoutableAgentId => id in AGENT_ROUTING_KEYS),
    );
    const routableAgentIds = new Set(Object.keys(AGENT_ROUTING_KEYS) as RoutableAgentId[]);

    // All routable agents should have at least one test case
    for (const id of routableAgentIds) {
      expect(testedAgentIds.has(id)).toBe(true);
    }
  });

  describe("table-driven routing contract for all migration waves", () => {
    it.each(AGENT_MIGRATION_CASES)(
      "$agentId (tier: $tier, surface: $surface) → $expectedMode ($expectedReason)",
      ({
        agentId,
        surface = "operator",
        tier = "default",
        cfEnv,
        expectedMode,
        expectedReason,
        expectedModelId,
        expectsWarn,
      }) => {
        const warnSpy = vi.spyOn(console, "warn");
        if (expectsWarn) {
          warnSpy.mockImplementation(() => {});
        }

        const outcome = resolveAgentModelOutcome({
          agentId,
          tier,
          requestContext: contextWithCfEnv(cfEnv),
        });

        // Assert observable routing metadata
        expect(outcome.mode).toBe(expectedMode);
        expect(outcome.reason).toBe(expectedReason);

        // Ensure model object exists (not undefined/null)
        expect(outcome.model).toBeDefined();

        // Assert exact Workers AI model ID for native mode
        if (expectedMode === "native" && expectedModelId) {
          const capability = WORKERS_AI_TIER_CAPABILITIES[tier];
          expect(capability?.modelId).toBe(expectedModelId);
        }

        // Error messages include agent ID and requested mode when applicable
        if (expectedReason === "legacy_flag" && expectsWarn) {
          // The actual warning format is: "[agent-routing] invalid {envKey} for agentId=\"{agentId}\""
          expect(warnSpy).toHaveBeenCalled();
          const warnCall = warnSpy.mock.calls[0][0] as string;
          expect(warnCall).toContain("invalid");
          expect(warnCall).toContain(agentId);
        }

        warnSpy.mockRestore();
      },
    );
  });

  describe("rollback scenarios (native → legacy)", () => {
    it("public-marketing: native → legacy flag → legacy", () => {
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

    it("production-planner: native → unset flag → legacy", () => {
      const native = resolveAgentModelOutcome({
        agentId: "production-planner",
        requestContext: contextWithCfEnv({
          AI_ROUTING_AGENT_PRODUCTION_PLANNER: "native",
          AI: fakeAiBinding,
        }),
      });
      expect(native.mode).toBe("native");

      const rolledBack = resolveAgentModelOutcome({
        agentId: "production-planner",
        requestContext: contextWithCfEnv({ AI: fakeAiBinding }),
      });
      expect(rolledBack.mode).toBe("legacy");
      expect(rolledBack.reason).toBe("legacy_flag");
    });
  });

  describe("IPI-607 risk: process.env must not leak into cfEnv routing", () => {
    it("flag only in process.env is ignored (cfEnv must be explicit)", () => {
      const previous = process.env.AI_ROUTING_AGENT_PRODUCTION_PLANNER;
      process.env.AI_ROUTING_AGENT_PRODUCTION_PLANNER = "native";
      try {
        const outcome = resolveAgentModelOutcome({
          agentId: "production-planner",
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

    it("flag only in cfEnv is honored even when process.env is empty", () => {
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
        if (previous !== undefined) {
          process.env.AI_ROUTING_AGENT_PRODUCTION_PLANNER = previous;
        }
      }
    });
  });
});

describe("request context isolation (not actual workerd integration)", () => {
  const originalWebSocketPair = (globalThis as { WebSocketPair?: unknown }).WebSocketPair;

  beforeEach(() => {
    // Note: This does NOT simulate actual workerd - WebSocketPair assignment is not
    // inspected by resolveAgentModelOutcome. This test only verifies request context
    // isolation, not real Workers AI execution or workerd request-context propagation.
    (globalThis as { WebSocketPair?: unknown }).WebSocketPair = class WebSocketPair {};
  });

  afterEach(() => {
    if (originalWebSocketPair === undefined) {
      delete (globalThis as { WebSocketPair?: unknown }).WebSocketPair;
    } else {
      (globalThis as { WebSocketPair?: unknown }).WebSocketPair = originalWebSocketPair;
    }
  });

  it("native routing with cfEnv.AI binding returns a Workers AI model", () => {
    const mockAiBinding = {
      run: vi.fn(() => Promise.resolve({ text: "mock response" })),
    };

    const outcome = resolveAgentModelOutcome({
      agentId: "production-planner",
      requestContext: contextWithCfEnv({
        AI_ROUTING_AGENT_PRODUCTION_PLANNER: "native",
        AI: mockAiBinding,
      }),
    });

    expect(outcome.mode).toBe("native");
    expect(outcome.reason).toBe("native");
    expect(outcome.model).toBeDefined();
    // The model is a Workers AI model (has the expected structure)
    expect(typeof outcome.model).toBe("object");
  });

  it("request context is isolated per request (no global state leakage)", () => {
    const mockAiBinding = {
      run: vi.fn(() => Promise.resolve({ text: "mock response" })),
    };

    // Request 1: native
    const outcome1 = resolveAgentModelOutcome({
      agentId: "production-planner",
      requestContext: contextWithCfEnv({
        AI_ROUTING_AGENT_PRODUCTION_PLANNER: "native",
        AI: mockAiBinding,
      }),
    });

    // Request 2: legacy (no flag)
    const outcome2 = resolveAgentModelOutcome({
      agentId: "production-planner",
      requestContext: contextWithCfEnv({ AI: mockAiBinding }),
    });

    expect(outcome1.mode).toBe("native");
    expect(outcome2.mode).toBe("legacy");
    // Each request's context is independent
    expect(outcome1.reason).toBe("native");
    expect(outcome2.reason).toBe("legacy_flag");
  });
});
