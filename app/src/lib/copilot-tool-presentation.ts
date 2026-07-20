/** User-facing tools that must stay visible even if name matches an internal pattern. */
export const USER_VISIBLE_TOOL_NAMES = new Set([
  "capture_lead",
  "draftFollowUp",
]);

const INTERNAL_TOOL_EXACT = new Set([
  "navigateTo",
  "updateWorkingMemory",
  "setWorkingMemory",
  "setLearningContainers",
]);

/** Mastra memory, routing, MCP, and CopilotKit plumbing — never show in production chat. */
const INTERNAL_TOOL_PATTERNS: RegExp[] = [
  /^navigateTo$/i,
  /^updateWorkingMemory/i,
  /^setWorkingMemory/i,
  /^set_?learning/i,
  /^mcp[_-]/i,
  /^ag[_-]?ui/i,
  /^__internal_/i,
  /workingMemory$/i,
  /^routeTo/i,
];

/** OpenAI/AG-UI shape or flat fixture shape (`{ name, arguments, id }`). */
type ToolCallLike = {
  function?: { name?: string };
  name?: string;
};

export function getToolCallName(toolCall: ToolCallLike | null | undefined): string {
  if (!toolCall) return "";
  const fromFunction = toolCall.function?.name;
  if (typeof fromFunction === "string" && fromFunction.length > 0) {
    return fromFunction;
  }
  if (typeof toolCall.name === "string" && toolCall.name.length > 0) {
    return toolCall.name;
  }
  return "";
}

/** Unknown or nameless tool calls are treated as internal (hidden). */
export function shouldHideToolCall(toolCall: ToolCallLike | null | undefined): boolean {
  const name = getToolCallName(toolCall);
  if (!name) return true;
  return shouldHideTool(name);
}

export function shouldHideTool(name: string): boolean {
  if (USER_VISIBLE_TOOL_NAMES.has(name)) return false;
  if (INTERNAL_TOOL_EXACT.has(name)) return true;
  return INTERNAL_TOOL_PATTERNS.some((pattern) => pattern.test(name));
}

export function isInternalToolName(name: string): boolean {
  return shouldHideTool(name);
}
