"use client";

import { useState } from "react";
import { useRenderTool } from "@copilotkit/react-core/v2";
import { z } from "zod";

import {
  ApprovalActions,
  ApprovalCardShell,
  ApprovalHeader,
} from "@/components/approval-card";

type DraftResult = {
  ok?: boolean;
  error?: string;
  channel?: "email" | "note";
  subject?: string;
  draft?: string;
  evidenceIds?: string[];
  sent?: boolean;
  activityLogged?: boolean;
};

/**
 * IPI-369 Phase C — HITL for draftFollowUp.
 * Approve keeps an editable local draft only — never sends email / never inserts crm_activities.
 */
export function useCrmDraftFollowUpRender() {
  useRenderTool({
    name: "draftFollowUp",
    parameters: z.object({
      companyId: z.string().uuid().optional(),
      contactId: z.string().uuid().optional(),
      dealId: z.string().uuid().optional(),
      channel: z.enum(["email", "note"]).optional(),
      intent: z.string().optional(),
    }),
    render: ({ status, result }) => {
      if (status === "inProgress" || status === "executing") {
        return (
          <p className="mx-4 my-2 text-sm text-muted-foreground" data-testid="crm-follow-up-draft-loading">
            Drafting follow-up…
          </p>
        );
      }
      if (status !== "complete" || !result) return <></>;

      let parsed: DraftResult = {};
      try {
        parsed = typeof result === "string" ? JSON.parse(result) : (result as DraftResult);
      } catch {
        return (
          <p className="mx-4 my-2 text-sm text-destructive" data-testid="crm-follow-up-draft-error">
            Could not read draft result.
          </p>
        );
      }

      if (!parsed.ok) {
        return (
          <p className="mx-4 my-2 text-sm text-destructive" data-testid="crm-follow-up-draft-error">
            {parsed.error ?? "Draft failed"}
          </p>
        );
      }

      return (
        <FollowUpDraftCard
          initialSubject={parsed.subject ?? ""}
          initialDraft={parsed.draft ?? ""}
          evidenceIds={parsed.evidenceIds ?? []}
        />
      );
    },
  });
}

function FollowUpDraftCard({
  initialSubject,
  initialDraft,
  evidenceIds,
}: {
  initialSubject: string;
  initialDraft: string;
  evidenceIds: string[];
}) {
  const [subject, setSubject] = useState(initialSubject);
  const [draft, setDraft] = useState(initialDraft);
  const [kept, setKept] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return (
      <p className="mx-4 my-2 text-sm text-muted-foreground" data-testid="crm-follow-up-draft-dismissed">
        Draft discarded. Nothing was sent or logged.
      </p>
    );
  }

  if (kept !== null) {
    return (
      <ApprovalCardShell className="mx-4 my-2 rounded-md border border-border bg-card p-3">
        <ApprovalHeader
          title="Follow-up draft kept (editable copy only)"
          titleClassName="text-sm font-medium"
          subtitle="Not sent · no CRM activity logged"
          subtitleClassName="text-xs text-muted-foreground"
        />
        <pre
          className="mt-2 whitespace-pre-wrap text-sm"
          data-testid="crm-follow-up-draft-kept"
        >{`${subject ? `Subject: ${subject}\n\n` : ""}${kept}`}</pre>
      </ApprovalCardShell>
    );
  }

  return (
    <ApprovalCardShell className="mx-4 my-2 rounded-md border border-border bg-card p-3">
      <ApprovalHeader
        title="Review follow-up draft"
        titleClassName="text-sm font-medium"
        subtitle="Approve keeps this text only — does not send or log activity"
        subtitleClassName="text-xs text-muted-foreground"
      />
      <label className="mt-3 block text-xs font-medium text-muted-foreground" htmlFor="crm-follow-up-subject">
        Subject
      </label>
      <input
        id="crm-follow-up-subject"
        className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        data-testid="crm-follow-up-subject"
      />
      <label className="mt-3 block text-xs font-medium text-muted-foreground" htmlFor="crm-follow-up-body">
        Body
      </label>
      <textarea
        id="crm-follow-up-body"
        className="mt-1 min-h-28 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        data-testid="crm-follow-up-body"
      />
      {evidenceIds.length > 0 ? (
        <p className="mt-2 text-xs text-muted-foreground" data-testid="crm-follow-up-evidence-ids">
          Grounded on {evidenceIds.length} CRM record{evidenceIds.length === 1 ? "" : "s"} (internal IDs kept out of the draft body).
        </p>
      ) : null}
      <ApprovalActions
        className="mt-3 flex justify-end gap-2"
        state="idle"
        onReject={() => setDismissed(true)}
        onApprove={() => setKept(draft)}
        rejectLabel="Discard"
        approveLabel="Keep draft"
        rejectClassName="rounded-md border border-input px-3 py-1.5 text-sm"
        approveClassName="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground"
      />
    </ApprovalCardShell>
  );
}
