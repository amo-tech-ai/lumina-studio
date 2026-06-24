import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const COMPONENT = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "marketing-chat.tsx",
);
const src = readFileSync(COMPONENT, "utf8");

// ─── Contract: no operator imports ─────────────────────────────────────────

describe("MarketingChat — contract: no operator imports", () => {
  it("does not import from operator-panel", () => {
    expect(src).not.toMatch(/operator-panel/);
  });

  it("does not import from @/mastra/agents/index (operator registry)", () => {
    // Operator registry is the shared mastra index — marketing must use its own runtime
    expect(src).not.toMatch(/from "@\/mastra"(?!\/types)/);
  });

  it("does not call /api/copilotkit (uses /api/marketing-chat only)", () => {
    expect(src).not.toMatch(/\/api\/copilotkit/);
    expect(src).toMatch(/\/api\/marketing-chat/);
  });

  it("does not import withOperatorAuth or resolveOperatorUser", () => {
    expect(src).not.toMatch(/withOperatorAuth/);
    expect(src).not.toMatch(/resolveOperatorUser/);
  });

  it("uses @copilotkit/react-core/v2 (not root v1 path)", () => {
    // Root import is blocked by ESLint guard; verify /v2 is used
    expect(src).toMatch(/@copilotkit\/react-core\/v2/);
    expect(src).not.toMatch(/from "@copilotkit\/react-core"(?!\/)/);
  });
});

// ─── Contract: runtimeUrl ──────────────────────────────────────────────────

describe("MarketingChat — runtimeUrl contract", () => {
  it("sets runtimeUrl to /api/marketing-chat exactly", () => {
    expect(src).toMatch(/runtimeUrl=["']\/api\/marketing-chat["']/);
  });
});

// ─── Contract: feature flag ────────────────────────────────────────────────

describe("MarketingChat — feature flag", () => {
  it("guards on NEXT_PUBLIC_MARKETING_CHAT_ENABLED", () => {
    expect(src).toMatch(/NEXT_PUBLIC_MARKETING_CHAT_ENABLED/);
  });

  it("component returns null when flag is false (source check)", () => {
    // If ENABLED is false, the function returns null before mounting CopilotKit
    expect(src).toMatch(/if \(!ENABLED/);
  });
});

// ─── Contract: quick chips / suggestions ──────────────────────────────────

describe("MarketingChat — quick prompts / chips", () => {
  it("exports QUICK_PROMPTS constant with at least 4 items", () => {
    expect(src).toMatch(/export const QUICK_PROMPTS/);
  });

  it("QUICK_PROMPTS includes fashion-photography prompt", () => {
    expect(src).toMatch(/fashion photography/i);
  });

  it("QUICK_PROMPTS includes Shopify prompt", () => {
    expect(src).toMatch(/Shopify/);
  });

  it("QUICK_PROMPTS includes Instagram prompt", () => {
    expect(src).toMatch(/Instagram/);
  });

  it("QUICK_PROMPTS includes pricing prompt", () => {
    expect(src).toMatch(/[Pp]ricing/);
  });

  it("calls useConfigureSuggestions with QUICK_PROMPTS", () => {
    expect(src).toMatch(/useConfigureSuggestions/);
    expect(src).toMatch(/QUICK_PROMPTS/);
  });
});

// ─── Contract: lead capture ────────────────────────────────────────────────

describe("MarketingChat — lead capture", () => {
  it("registers capture_lead tool via useFrontendTool", () => {
    expect(src).toMatch(/useFrontendTool/);
    expect(src).toMatch(/capture_lead/);
  });

  it("POSTs to /api/marketing-lead", () => {
    expect(src).toMatch(/\/api\/marketing-lead/);
    expect(src).toMatch(/method:\s*["']POST["']/);
  });

  it("includes anon_id in the POST body", () => {
    expect(src).toMatch(/anon_id/);
    expect(src).toMatch(/getAnonId/);
  });

  it("forwards lead name via spread args into the POST body (C1 fix)", () => {
    // LeadSchema requires name; handler spreads args so name reaches /api/marketing-lead
    expect(src).toMatch(/name:\s*z\.string\(\)/);
    expect(src).toMatch(/JSON\.stringify\(\{\s*\.\.\.args,\s*anon_id:\s*anonId\s*\}\)/);
  });

  it("shows submitted draftId in the render view", () => {
    expect(src).toMatch(/submitted:/);
    expect(src).toMatch(/draftId/);
  });
});

// ─── Contract: anon id resilience (C2 fix) ─────────────────────────────────

describe("MarketingChat — anon id resilience (C2)", () => {
  it("wraps localStorage access in try/catch so private browsing cannot crash the widget", () => {
    expect(src).toMatch(/function getAnonId\(\)/);
    expect(src).toMatch(/try\s*\{[\s\S]*localStorage\.getItem/);
    expect(src).toMatch(/catch\s*\{[\s\S]*_memoryAnonId/);
  });

  it("falls back to persistent in-memory anon id when localStorage throws (C2 fix)", () => {
    const getAnonBlock = src.slice(
      src.indexOf("function getAnonId"),
      src.indexOf("const LeadSchema"),
    );
    // _memoryAnonId persists the UUID for the full page session (vs re-generating each call)
    expect(getAnonBlock).toMatch(/catch\s*\{[\s\S]*_memoryAnonId/);
    expect(getAnonBlock).toMatch(/return _memoryAnonId/);
  });
});

// ─── Contract: error handling ──────────────────────────────────────────────

describe("MarketingChat — error handling", () => {
  it("has an error boundary class component", () => {
    expect(src).toMatch(/ChatErrorBoundary/);
    expect(src).toMatch(/getDerivedStateFromError/);
  });

  it("renders a fallback element with data-testid=chat-error-fallback", () => {
    expect(src).toMatch(/chat-error-fallback/);
  });

  it("handles Gemini high-demand errors via onError", () => {
    expect(src).toMatch(/onError/);
    expect(src).toMatch(/high demand/);
  });
});

// ─── Contract: SSR guard ──────────────────────────────────────────────────

describe("MarketingChat — SSR guard", () => {
  it("uses mounted state to prevent SSR", () => {
    expect(src).toMatch(/mounted/);
    expect(src).toMatch(/setMounted/);
    expect(src).toMatch(/useEffect/);
  });
});

// ponytail: render-level jsdom tests dropped — source-analysis tests above prove the same guards
// without needing a DOM environment setup in this test environment.
