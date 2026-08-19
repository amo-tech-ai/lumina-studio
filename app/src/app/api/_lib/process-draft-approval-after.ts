import { after } from "next/server";
import {
  processBrandIntelligenceDraftApproval as processDraftApproval,
  type ProcessDraftApprovalParams,
  type ProcessDraftApprovalResult,
} from "./process-draft-approval";

export type { ProcessDraftApprovalResult };

type NextDraftApprovalParams = Omit<ProcessDraftApprovalParams, "scheduleWork">;

/**
 * Next.js Route Handler / Server Action path.
 *
 * Same Brand DNA approve/reject as the Mastra tool, but defers workflow resume
 * with `after()` so the Brand Hub response is not blocked on cold start.
 * Do not import this module from `src/mastra/**` — `after()` needs Next request
 * context / waitUntil (https://nextjs.org/docs/app/api-reference/functions/after).
 */
export function processBrandIntelligenceDraftApproval(
  params: NextDraftApprovalParams,
): Promise<ProcessDraftApprovalResult> {
  return processDraftApproval({
    ...params,
    scheduleWork: (task) => {
      after(task);
    },
  });
}
