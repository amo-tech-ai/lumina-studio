import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const OPERATOR_SECTIONS = [
  "brand",
  "onboarding",
  "shoots",
  "assets",
  "campaigns",
  "matching",
  "preview",
  "crm",
] as const;

const PANEL_SRC = readFileSync(
  resolve(
    fileURLToPath(new URL(".", import.meta.url)),
    "operator-panel.tsx",
  ),
  "utf8",
);

describe("OperatorPanel — agent wiring (IPI-110)", () => {
  it("resolves agentId dynamically from pathname via resolveAgentId", () => {
    expect(PANEL_SRC).toMatch(/resolveAgentId/);
    expect(PANEL_SRC).toMatch(/const agentId = resolveAgentId\(pathname\)/);
    expect(PANEL_SRC).not.toMatch(/const AGENT_ID = /);
    expect(PANEL_SRC).not.toMatch(/agentId=\{?"default"/);
  });

  it("passes dynamic agentId to CopilotChatConfigurationProvider", () => {
    expect(PANEL_SRC).toMatch(/<CopilotChatConfigurationProvider agentId=\{agentId\}/);
  });

  it("passes dynamic agentId to ThreadsDrawer", () => {
    expect(PANEL_SRC).toMatch(/agentId=\{agentId\}/);
  });

  it("resets threadId when agentId changes", () => {
    expect(PANEL_SRC).toMatch(/useEffect\(/);
    expect(PANEL_SRC).toMatch(/setThreadId\(undefined\)/);
    expect(PANEL_SRC).toMatch(/\[agentId\]/);
  });
});

describe("OperatorPanel — navigateTo frontend tool (IPI2-82 / IPI-731)", () => {
  it("wires navigateTo through NAV_TARGETS + resolveNavigateToPath", () => {
    expect(PANEL_SRC).toMatch(/from "\.\/navigate-to-path"/);
    expect(PANEL_SRC).toMatch(/section:\s*z\.enum\(NAV_TARGETS\)/);
    expect(PANEL_SRC).toMatch(/resolveNavigateToPath\(section\)/);
    expect(PANEL_SRC).toMatch(/shoot-wizard/);
  });

  it("documents shoot-wizard vs shoots list in the tool description", () => {
    expect(PANEL_SRC).toMatch(/shoot-wizard for \/app\/shoots\/new/);
    expect(PANEL_SRC).toMatch(/section shoots for the shoots list/);
  });

  it("keeps hub section names in navigate-to-path for route alignment", () => {
    const navSrc = readFileSync(
      resolve(fileURLToPath(new URL(".", import.meta.url)), "navigate-to-path.ts"),
      "utf8",
    );
    for (const section of OPERATOR_SECTIONS) {
      expect(navSrc).toContain(`"${section}"`);
    }
  });

  it("defines navigateToCrm frontend tool for CRM record navigation (IPI-368)", () => {
    expect(PANEL_SRC).toMatch(/name: "navigateToCrm"/);
    expect(PANEL_SRC).toMatch(/page: z\.enum\(CRM_PAGES\)/);
    expect(PANEL_SRC).toMatch(/\/app\/crm\/\$\{page\}/);
  });

  it("streams pathname into agent context (route-aware answers)", () => {
    expect(PANEL_SRC).toMatch(/useAgentContext\(/);
    expect(PANEL_SRC).toMatch(/value:\s*pathname/);
  });
});

describe("OperatorPanel — internal tool call hiding (AIOR-016)", () => {
  it("registers the internal-tool hiding hook", () => {
    expect(PANEL_SRC).toMatch(/useHideInternalToolCalls\(\)/);
  });

  it("mounts center chat dock with welcomeText (not right-panel CopilotSidebar)", () => {
    expect(PANEL_SRC).toMatch(/<OperatorChatDock welcomeText=\{welcomeText\}/);
    expect(PANEL_SRC).not.toMatch(/<CopilotSidebar/);
  });

  it("renders IntelligencePanel in the right column without chat children (IPI-243)", () => {
    expect(PANEL_SRC).toMatch(/<IntelligencePanel/);
    expect(PANEL_SRC).toMatch(/brandName=\{activeBrandName\}/);
    expect(PANEL_SRC).toMatch(/className=\{styles\.intelligencePanel\}/);
  });
});

describe("OperatorPanel — dev skip + brand list (PR #170 review)", () => {
  it("uses isDevSkipMode helper instead of hardcoded skip strings", () => {
    expect(PANEL_SRC).toMatch(/const devSkip = isDevSkipMode\(skip\)/);
    expect(PANEL_SRC).not.toMatch(/skip === "1" \|\| skip === "approval"/);
  });

  it("distinguishes brand list loading from empty org in setActiveBrand", () => {
    expect(PANEL_SRC).toMatch(/brandsLoadingRef\.current/);
    expect(PANEL_SRC).toMatch(/No brands in your organization yet/);
  });

  it("wraps OperatorShell in Suspense and wires hero brand sync from main", () => {
    expect(PANEL_SRC).toMatch(/<Suspense fallback=\{<OperatorShellFallback/);
    expect(PANEL_SRC).toMatch(/useSearchParams\(\)/);
    expect(PANEL_SRC).toMatch(/useOperatorBrands\(devSkip\)/);
    expect(PANEL_SRC).toMatch(/useHeroBrandSync\(\)/);
  });

  it("clears dev preview brand when devSkip toggles off", () => {
    expect(PANEL_SRC).toMatch(/isDevPreviewBrandId\(activeBrandId\)/);
    expect(PANEL_SRC).toMatch(/setActiveBrandId\(null\)/);
  });
});
