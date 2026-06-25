/** When true, internal CopilotKit/Mastra tool calls render in the chat (dev only). */
export function isCopilotDebugToolsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_COPILOT_DEBUG_TOOLS === "true";
}
