import type { Mastra } from "@mastra/core/mastra";

/**
 * Bind Mastra-registered workflows to an agent at runtime.
 * Avoids static imports from workflow modules (brand-intelligence workflow imports agents).
 * Missing workflow IDs are silently omitted (not found in registry).
 */
export function mastraWorkflows(...workflowIds: string[]) {
  return ({ mastra }: { mastra?: Mastra }) => {
    if (!mastra) return {};
    return Object.fromEntries(
      workflowIds
        .map((id) => {
          try {
            return [id, mastra.getWorkflow(id)] as const;
          } catch {
            return null;
          }
        })
        .filter((e): e is NonNullable<typeof e> => e !== null),
    );
  };
}
