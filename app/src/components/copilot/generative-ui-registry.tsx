"use client";

import { useCrmDraftFollowUpRender } from "@/components/crm/follow-up-draft-card";
import { useHideInternalToolCalls } from "./copilot-tool-presentation";

/**
 * IPI-128 · AIOR-012 — Generative UI registry (CopilotKit useRenderTool)
 *
 * Centralizes all useRenderTool/useRenderToolCall registrations for iPix.
 * One hook, one place — avoids scattered useRenderTool calls across pages.
 *
 * Usage: call useGenerativeUIRegistry() once inside OperatorPanel.
 */
export function useGenerativeUIRegistry() {
  useHideInternalToolCalls();
  useCrmDraftFollowUpRender();
}
