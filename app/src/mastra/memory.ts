import { Memory } from "@mastra/memory";
import { getMastraStorage } from "./storage";

let _memory: Memory | undefined;

export function getMastraMemory(): Memory {
  if (!_memory) {
    _memory = new Memory({
      storage: getMastraStorage(),
      options: {
        lastMessages: 40,
        // ponytail: semantic recall + observational memory deferred to IPI-136 / Phase 2
      },
    });
  }
  return _memory;
}

/** Thread ID convention: {orgId}/{workspace}/{entityId}
 *  Example: org_abc123/shoot/brand_xyz
 */
export function makeThreadId(
  orgId: string,
  workspace: "shoot" | "brand-intake" | "social-discovery",
  entityId: string,
): string {
  return `${orgId}/${workspace}/${entityId}`;
}
