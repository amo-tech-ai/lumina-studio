import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

const ROUTE = resolve(fileURLToPath(new URL(".", import.meta.url)), "route.ts");

// Regression guard (IPI2-127): a refactor must not un-wrap the handler and
// re-open the unauthenticated-SSE bypass. Asserts every HTTP method export goes
// through the auth-gated handler. (Absorbed from the superseded #44.)
describe("CopilotKit route — operator auth boundary (IPI2-127)", () => {
  it("wraps every HTTP export with the auth-gated handler", () => {
    const src = readFileSync(ROUTE, "utf8");
    expect(src).toMatch(/withOperatorAuth\(request\)/);
    expect(src).toMatch(/new Response\("Unauthorized",\s*\{ status: 401 \}\)/);
    for (const method of ["GET", "POST", "PATCH", "DELETE"] as const) {
      expect(src).toMatch(new RegExp(`export const ${method} = handler`));
    }
  });

  it("passes resourceId from the resolved operator identity to getLocalAgents", () => {
    const src = readFileSync(ROUTE, "utf8");
    expect(src).toMatch(/resourceId:\s*user\.id/);
  });

  it("passes requestContext with userId and email via RequestContext.set()", () => {
    const src = readFileSync(ROUTE, "utf8");
    expect(src).toMatch(/requestContext[,\s]/);
    expect(src).toMatch(/set\(["']userId["'],\s*user\.id\)/);
    expect(src).toMatch(/set\(["']email["'],\s*user\.email\)/);
  });

  it("uses an AgentsFactory (per-request function), not static agents", () => {
    const src = readFileSync(ROUTE, "utf8");
    // The factory is an async function — the closure `({ request }) => ...`
    expect(src).toMatch(/agents:\s*async\s*\(\s*\{ request \}\s*\)/);
  });

  it("removes the @ts-expect-error for missing resourceId", () => {
    const src = readFileSync(ROUTE, "utf8");
    expect(src).not.toMatch(/@ts-expect-error.*resourceId/);
    expect(src).not.toMatch(/@ts-expect-error.*getLocalAgents/);
  });

  it("calls resolveOperatorUser inside the agent factory, not at module load", () => {
    const src = readFileSync(ROUTE, "utf8");
    // The call happens inside the async factory, not at the top level
    const factoryMatch = src.match(/agents:\s*async\s*\(\s*\{ request \}\s*\)\s*=>\s*\{([^}]*)\}/);
    expect(factoryMatch).toBeTruthy();
    if (factoryMatch) {
      expect(factoryMatch[1]).toContain("resolveOperatorUser");
    }
  });

  it("excludes public-marketing from the operator agent factory result", () => {
    const src = readFileSync(ROUTE, "utf8");
    expect(src).toMatch(/public-marketing/);
    expect(src).toMatch(/filter\(\(\[id\]\) => id !== "public-marketing"\)/);
  });
});

describe("CopilotKit route — Mastra resourceId isolation (IPI2-127)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("no getLocalAgents call happens before user validation in the factory", () => {
    const src = readFileSync(ROUTE, "utf8");
    // The only getLocalAgents call is inside the factory, after resolveOperatorUser
    const factoryStart = src.indexOf("agents: async");
    const factoryBlock = src.slice(factoryStart, factoryStart + 600);
    const resolvePos = factoryBlock.indexOf("resolveOperatorUser");
    const agentsPos = factoryBlock.indexOf("getLocalAgents");
    expect(resolvePos).toBeGreaterThan(-1);
    expect(agentsPos).toBeGreaterThan(resolvePos);
  });

  it("each request gets its own agent scope (no shared instances at module load)", () => {
    const src = readFileSync(ROUTE, "utf8");
    // Agents must be created inside the factory, not at module level
    const moduleLevelGetLocalAgents = src.match(
      /^\s*agents:[\s\S]*?getLocalAgents/m,
    );
    expect(moduleLevelGetLocalAgents).toBeTruthy();
    // But there should be no getLocalAgents call outside the factory
    const factoryStart = src.indexOf("agents: async");
    const beforeFactory = src.slice(0, factoryStart);
    expect(beforeFactory).not.toMatch(/getLocalAgents/);
  });

  it("resourceId is derived from server-validated user.id, not a fallback", () => {
    const src = readFileSync(ROUTE, "utf8");
    expect(src).toMatch(/resourceId:\s*user\.id/);
    // No anonymous or shared resource id
    expect(src).not.toMatch(/resourceId:\s*["']shared["']/);
    expect(src).not.toMatch(/resourceId:\s*["']demo["']/);
    expect(src).not.toMatch(/resourceId:\s*["']anonymous["']/);
  });

  it("rejects anonymous requests with 401 when OPERATOR_AUTH_ENABLED is true", () => {
    const src = readFileSync(ROUTE, "utf8");
    expect(src).toMatch(/status:\s*401/);
    expect(src).toMatch(/["']Unauthorized["']/);
  });
});

describe("CopilotKit route — no @ts-expect-error resourceId remains", () => {
  it("asserts zero @ts-expect-error in the route file", () => {
    const src = readFileSync(ROUTE, "utf8");
    // We allow ts-expect-error only for Mastra memory beta types (in agents/index.ts)
    // The route file itself must have zero
    const lines = src.split("\n");
    const expectErrorLines = lines.filter((l) => l.includes("@ts-expect-error"));
    expect(expectErrorLines).toHaveLength(0);
  });
});
