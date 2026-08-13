"use client";

import { useCrmDraftFollowUpRender } from "@/components/crm/follow-up-draft-card";
import { useHideInternalToolCalls } from "./copilot-tool-presentation";

/**
 * IPI-128 · AIOR-012 — Generative UI registry (CopilotKit useRenderTool)
 *
 * Centralizes all useRenderTool/useRenderToolCall registrations for iPix.
 * One hook, one place — avoids scattered useRenderTool calls across pages.
 *
 * Current: draftFollowUp (HITL) + internal hide.
 * Next (after runtime restore): lookupShotReferences, searchTalentByFilters, getAssetDnaEvidence
 * Each entry is a useRenderTool with zod parameters and a card component.
 *
 * Usage: call useGenerativeUIRegistry() once inside OperatorPanel (alongside useHideInternalToolCalls).
 */
export function useGenerativeUIRegistry() {
  useHideInternalToolCalls();
  useCrmDraftFollowUpRender();
  // future: useLookupShotReferencesRender(); etc.
}
