import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ROUTE = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "route.ts",
);
const src = readFileSync(ROUTE, "utf8");

// ─── Static security assertions ─────────────────────────────────────────────

describe("marketing-chat runtime — security (IPI2-163)", () => {
  it("does NOT import withOperatorAuth (route is public)", () => {
    expect(src).not.toMatch(/withOperatorAuth/);
  });

  it("does NOT import resolveOperatorUser", () => {
    expect(src).not.toMatch(/resolveOperatorUser/);
  });

  it("does NOT import the operator Mastra instance", () => {
    // Must not use @/mastra (the shared registry with all agents)
    expect(src).not.toMatch(/from "@\/mastra"(?!\/)/);
  });

  it("uses a local publicMastra with public-marketing (and default alias for prebuilt UI)", () => {
    expect(src).toMatch(/publicMastra/);
    expect(src).toMatch(/"public-marketing":\s*publicMarketingAgent/);
    // "default" alias so CopilotKit prebuilt UI (CopilotPopup without agentId) resolves correctly
    expect(src).toMatch(/default:\s*publicMarketingAgent/);
  });

  it("does NOT pass requestContext with userId/email (no operator identity)", () => {
    expect(src).not.toMatch(/userId:\s*user/);
    expect(src).not.toMatch(/email:\s*user/);
  });

  it("exports all HTTP methods without an auth wrapper", () => {
    // Exports are the raw endpoint, not a handler that calls withOperatorAuth
    for (const method of ["GET", "POST", "PATCH", "DELETE"] as const) {
      expect(src).toMatch(new RegExp(`export const ${method} = endpoint`));
    }
  });
});

describe("marketing-chat runtime — agent isolation (IPI2-163)", () => {
  it("only registers public agents (not operator agents) in the local Mastra instance", () => {
    expect(src).toMatch(/"public-marketing":\s*publicMarketingAgent/);
    // "default" alias is allowed — it points to publicMarketingAgent, not an operator agent
    expect(src).toMatch(/default:\s*publicMarketingAgent/);
    // Operator agent ids must not appear as object keys (string literals in code)
    expect(src).not.toMatch(/"production-planner"/);
    expect(src).not.toMatch(/"creative-director"/);
  });

  it("uses InMemoryAgentRunner (no intelligence/license config)", () => {
    expect(src).toMatch(/InMemoryAgentRunner/);
    expect(src).not.toMatch(/CopilotKitIntelligence/);
    expect(src).not.toMatch(/licenseToken/);
  });

  it("sets basePath to /api/marketing-chat", () => {
    expect(src).toMatch(/basePath:\s*["']\/api\/marketing-chat["']/);
  });

  it("uses createCopilotRuntimeHandler in single-route mode (client POSTs to root path)", () => {
    // CopilotKit v2 client sends POST /api/marketing-chat with JSON body {method:"info"|"agent/run"}.
    // multi-route matchRoute returns null for root-path POST (no segments) → 404.
    // single-route resolveSingleRoute parses JSON body → routes correctly.
    expect(src).toMatch(/createCopilotRuntimeHandler/);
    expect(src).toMatch(/mode:\s*["']single-route["']/);
    expect(src).not.toMatch(/handle\(app\)/);
  });

  it("imports fetch handler from runtime-v2-fetch (Workers-safe, no express barrel)", () => {
    expect(src).toMatch(/@\/lib\/copilotkit\/runtime-v2-fetch/);
    expect(src).not.toMatch(/new LibSQLStore/);
    expect(src).not.toMatch(/from "@copilotkit\/runtime\/v2"/);
  });
});

// ─── Static: agent factory wiring ────────────────────────────────────────────

describe("marketing-chat runtime — agent factory wiring (IPI2-163)", () => {
  it("agent factory calls getLocalAgents with the local publicMastra", () => {
    // The factory must use publicMastra (local), not the shared mastra registry.
    expect(src).toMatch(/MastraAgent\.getLocalAgents\(/);
    expect(src).toMatch(/mastra:\s*publicMastra/);
  });

  it("agent factory is async (required by CopilotRuntime agents option)", () => {
    expect(src).toMatch(/agents:\s*async\s*\(\)/);
  });
});
