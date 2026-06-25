import { describe, expect, it } from "vitest";

import { isCopilotDebugToolsEnabled } from "@/lib/copilot-debug";
import {
  getToolCallName,
  shouldHideTool,
  USER_VISIBLE_TOOL_NAMES,
} from "@/lib/copilot-tool-presentation";

describe("copilot-tool-presentation", () => {
  it("hides navigateTo and updateWorkingMemory", () => {
    expect(shouldHideTool("navigateTo")).toBe(true);
    expect(shouldHideTool("updateWorkingMemory")).toBe(true);
    expect(shouldHideTool("setWorkingMemory")).toBe(true);
  });

  it("hides MCP and routing-style tool names", () => {
    expect(shouldHideTool("mcp_supabase_query")).toBe(true);
    expect(shouldHideTool("routeToBrand")).toBe(true);
  });

  it("keeps user-facing capture_lead visible", () => {
    expect(USER_VISIBLE_TOOL_NAMES.has("capture_lead")).toBe(true);
    expect(shouldHideTool("capture_lead")).toBe(false);
  });

  it("extracts tool name from AG-UI tool call shape", () => {
    expect(
      getToolCallName({
        function: { name: "navigateTo" },
      }),
    ).toBe("navigateTo");
  });
});

describe("copilot-debug", () => {
  it("defaults debug tools off", () => {
    expect(isCopilotDebugToolsEnabled()).toBe(false);
  });
});
