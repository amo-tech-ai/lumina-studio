import { afterEach, describe, expect, it } from "vitest";

import { isCopilotDebugToolsEnabled } from "@/lib/copilot-debug";
import {
  getToolCallName,
  shouldHideTool,
  shouldHideToolCall,
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

  it("extracts tool name from AG-UI function tool call shape", () => {
    expect(
      getToolCallName({
        function: { name: "navigateTo" },
      }),
    ).toBe("navigateTo");
  });

  it("extracts tool name from flat fixture tool call shape", () => {
    expect(
      getToolCallName({
        name: "get-weather",
        arguments: '{"location":"New York"}',
        id: "call_get_weather_001",
      }),
    ).toBe("get-weather");
  });

  it("returns empty name for nullish tool call", () => {
    expect(getToolCallName(null)).toBe("");
    expect(getToolCallName(undefined)).toBe("");
    expect(shouldHideToolCall(null)).toBe(true);
  });

  it("hides tool calls with unknown shape (no name)", () => {
    expect(shouldHideToolCall({ id: "call_unknown" } as { id: string })).toBe(
      true,
    );
  });

  it("hides internal tools via flat fixture shape", () => {
    expect(
      shouldHideToolCall({
        name: "navigateTo",
        arguments: '{"section":"assets"}',
        id: "call_nav_001",
      }),
    ).toBe(true);
  });
});

describe("copilot-debug", () => {
  const originalDebugFlag = process.env.NEXT_PUBLIC_COPILOT_DEBUG_TOOLS;

  afterEach(() => {
    if (originalDebugFlag === undefined) {
      delete process.env.NEXT_PUBLIC_COPILOT_DEBUG_TOOLS;
    } else {
      process.env.NEXT_PUBLIC_COPILOT_DEBUG_TOOLS = originalDebugFlag;
    }
  });

  it("defaults debug tools off", () => {
    delete process.env.NEXT_PUBLIC_COPILOT_DEBUG_TOOLS;
    expect(isCopilotDebugToolsEnabled()).toBe(false);
  });

  it("enables debug tools when env is true", () => {
    process.env.NEXT_PUBLIC_COPILOT_DEBUG_TOOLS = "true";
    expect(isCopilotDebugToolsEnabled()).toBe(true);
  });
});
