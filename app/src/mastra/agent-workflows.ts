import type { Mastra } from "@mastra/core/mastra";

/**
 * Bind Mastra-registered workflows to an agent at runtime.
 * Avoids static imports from workflow modules (brand-intelligence workflow imports agents).
 */
export function mastraWorkflows(...workflowIds: string[]) {
  return ({ mastra }: { mastra?: Mastra }) => {
    if (!mastra) return {};
    return Object.fromEntries(
      workflowIds.map((id) => [id, mastra.getWorkflow(id)]),
    );
  };
}
