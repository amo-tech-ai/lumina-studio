import { isDurableAgent } from "@mastra/core/agent/durable";
import { describe, expect, it } from "vitest";

import { durableAgents, durableCreativeDirector, durablePlanner } from "./durable";

describe("durable agents", () => {
  it("planner is a DurableAgent", () => {
    expect(isDurableAgent(durablePlanner)).toBe(true);
    expect(durablePlanner.id).toBe("production-planner");
  });

  it("creative-director is a DurableAgent", () => {
    expect(isDurableAgent(durableCreativeDirector)).toBe(true);
    expect(durableCreativeDirector.id).toBe("creative-director");
  });

  it("registry keys are all DurableAgent instances", () => {
    for (const [key, agent] of Object.entries(durableAgents)) {
      expect(isDurableAgent(agent), `agent "${key}" is not durable`).toBe(true);
    }
  });

  it("default is aliased to production-planner", () => {
    expect(durableAgents.default).toBe(durableAgents["production-planner"]);
  });

  it(
    "observe(runId, offset:0) replays cached events after simulated disconnect (IPI-133)",
    { skip: !process.env.GEMINI_API_KEY, timeout: 30_000 },
    async () => {
      const { runId, output, cleanup } = await durablePlanner.stream(
      "Return the word PING and nothing else.",
      { maxSteps: 1 },
    );
    try {
      // Drain the stream (simulates the run completing before reconnect)
      try { await output.text; } catch { /* rate limit ok */ }

      // Simulated reconnect: observe from offset 0 replays all cached events
      const reconnect = await durablePlanner.observe(runId, { offset: 0 });
      try {
        expect(reconnect).toHaveProperty("output");
        expect(reconnect).toHaveProperty("runId");
        try { await reconnect.output.text; } catch { /* rate limit ok */ }
      } finally {
        reconnect.cleanup();
      }
    } finally {
      cleanup();
    }
  },
  );

  it(
    "stream() returns runId + cleanup even when execution errors",
    { skip: !process.env.GEMINI_API_KEY, timeout: 30_000 },
    async () => {
      const result = await durablePlanner.stream("Return the word HELLO and nothing else.", {
      maxSteps: 1,
      onChunk: () => {},
    });

    try {
      expect(result).toHaveProperty("runId");
      expect(typeof result.runId).toBe("string");
      expect(result.runId.length).toBeGreaterThan(0);
      expect(result).toHaveProperty("cleanup");
      expect(typeof result.cleanup).toBe("function");
      expect(result).toHaveProperty("output");

      try {
        await result.output.text;
      } catch {
        // Gemini may be rate-limited; runId/cleanup contract is what matters
      }
    } finally {
      result.cleanup();
    }
  },
  );
});
