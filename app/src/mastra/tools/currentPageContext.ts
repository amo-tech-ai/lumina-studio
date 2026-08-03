import { createTool } from "@mastra/core/tools";
import type { RequestContext } from "@mastra/core/request-context";
import { z } from "zod";

/**
 * AGENT-CTX-001 — server-side consumer for the context CopilotKit attaches to
 * every agent run.
 *
 * Client side, the operator UI registers page context via `useAgentContext`
 * (`shoot-detail-context.tsx`, `shoot-wizard-context.tsx`, operator-panel
 * brand/route contexts). `@ag-ui/mastra`'s `MastraAgent` writes that payload
 * into the per-run `RequestContext` under the `ag-ui` key (`applyInputContext`),
 * which Mastra forwards to every tool execute as `context.requestContext`.
 *
 * Nothing in the app ever read that key before this tool, so the context
 * travelled to the server and was dropped — the model never saw the open
 * shoot/brand. This tool is the read end of that wire.
 */

/** One context entry as registered by `useAgentContext` client-side. */
export interface PageContextEntry {
  description: string;
  value: Record<string, unknown>;
}

export interface PageContextResult {
  available: boolean;
  contexts: PageContextEntry[];
}

const AG_UI_KEY = "ag-ui";

function isEntry(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Pure, exported so the `ag-ui` contract is unit-testable without building a
 * full tool execution context. Returns every context entry attached to the
 * turn (there is usually one — e.g. the shoot-detail context — but the route
 * and active-brand contexts also flow in on operator pages).
 */
export function readPageContextFromRequestContext(
  requestContext?: RequestContext,
): PageContextResult {
  const agUi = requestContext?.get(AG_UI_KEY) as { context?: unknown } | undefined;
  const raw = Array.isArray(agUi?.context) ? agUi.context : [];
  const contexts = raw
    .filter(isEntry)
    .map((entry) => ({
      description: typeof entry.description === "string" ? entry.description : "",
      value:
        isEntry(entry.value) && !Array.isArray(entry.value)
          ? (entry.value as Record<string, unknown>)
          : {},
    }))
    .filter((entry) => entry.description !== "" || Object.keys(entry.value).length > 0);
  return { available: contexts.length > 0, contexts };
}

export const getCurrentPageContext = createTool({
  id: "getCurrentPageContext",
  description:
    "Read the page context CopilotKit attached to this conversation turn — the screen the operator is viewing right now (e.g. the open shoot, its brand, status, shot/deliverable counts). Pure read, no side effects. Call this FIRST whenever the operator refers to 'this shoot', 'the current shoot', 'the open brand', or asks about the page they are on, so you never ask them to paste IDs the context already has.",
  inputSchema: z.object({}),
  outputSchema: z.object({
    available: z.boolean(),
    contexts: z.array(
      z.object({
        description: z.string(),
        value: z.record(z.string(), z.unknown()),
      }),
    ),
  }),
  execute: async (_input, { requestContext }) =>
    readPageContextFromRequestContext(requestContext),
});
