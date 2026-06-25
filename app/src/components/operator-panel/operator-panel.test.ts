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
] as const;

const PANEL_SRC = readFileSync(
  resolve(
    fileURLToPath(new URL(".", import.meta.url)),
    "operator-panel.tsx",
  ),
  "utf8",
);

describe("OperatorPanel — agent wiring (IPI2-82)", () => {
  it("scopes CopilotChatConfigurationProvider to production-planner (not default alias)", () => {
    expect(PANEL_SRC).toMatch(/const AGENT_ID = "production-planner"/);
    expect(PANEL_SRC).toMatch(
      /<CopilotChatConfigurationProvider agentId={AGENT_ID}/,
    );
    expect(PANEL_SRC).not.toMatch(/agentId=\{?"default"/);
  });

  it("passes the same agent id to ThreadsDrawer", () => {
    expect(PANEL_SRC).toMatch(/agentId={AGENT_ID}/);
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
