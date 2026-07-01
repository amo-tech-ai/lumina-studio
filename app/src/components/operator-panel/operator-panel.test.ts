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

describe("OperatorPanel — navigateTo frontend tool (IPI2-82)", () => {
  it("defines SECTIONS aligned with on-disk operator routes", () => {
    const match = PANEL_SRC.match(
      /const SECTIONS = (\[[^\]]+\]) as const/,
    );
    expect(match).not.toBeNull();
    const sections = JSON.parse(
      (match?.[1] ?? "[]").replace(/"/g, '"'),
    ) as string[];
    expect(sections).toEqual([...OPERATOR_SECTIONS]);
  });

  it("validates section via z.enum(SECTIONS) before navigation", () => {
    expect(PANEL_SRC).toMatch(
      /parameters:\s*z\.object\(\{\s*section:\s*z\.enum\(SECTIONS\)\s*\}\)/,
    );
  });

  it("navigates to /app/{section} for each valid workspace", () => {
    expect(PANEL_SRC).toMatch(/router\.push\(`\/app\/\$\{section\}`\)/);
    for (const section of OPERATOR_SECTIONS) {
      expect(PANEL_SRC).toContain(`"${section}"`);
    }
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

  it("mounts center chat dock with filtered messageView (not right-panel sidebar)", () => {
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
});
