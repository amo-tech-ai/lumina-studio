/** User-facing tools that must stay visible even if name matches an internal pattern. */
export const USER_VISIBLE_TOOL_NAMES = new Set([
  "capture_lead",
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

export function getToolCallName(toolCall: { function: { name: string } }): string {
  return toolCall.function.name;
}

export function shouldHideTool(name: string): boolean {
  if (USER_VISIBLE_TOOL_NAMES.has(name)) return false;
  if (INTERNAL_TOOL_EXACT.has(name)) return true;
  return INTERNAL_TOOL_PATTERNS.some((pattern) => pattern.test(name));
}

export function isInternalToolName(name: string): boolean {
  return shouldHideTool(name);
}
