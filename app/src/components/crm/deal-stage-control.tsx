"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from "react";
import { toast } from "sonner";

import { StatusChip } from "@/components/ui/status-chip";
import { crmDealStageDotToken, crmDealStageLabel, type CrmDealStage } from "@/lib/crm/status-tokens";

import styles from "./deal-stage-control.module.css";

const STAGES: CrmDealStage[] = ["lead", "qualified", "proposal", "negotiation", "won", "lost"];
const TERMINAL = new Set<CrmDealStage>(["won", "lost"]);

type Props = {
  dealId: string;
  stage: CrmDealStage;
  /** Called with the server-confirmed stage after a successful non-terminal
   *  PATCH — never called optimistically, never called for won/lost. */
  onStageChange: (stage: CrmDealStage) => void;
};

/** Deal stage selector + Won/Lost approval gate — ported from
 *  SCR-31-CRM-Deal-Detail.dc.html's stage control + inline ApprovalCard
 *  (IPI-396 Task 3). Referenced by name in IPI-367's own plan: "Modify
 *  deal-stage-control.tsx — replace the inert won/lost handler with the
 *  real gate."
 *
 *  - Non-terminal moves (Lead→Negotiation) PATCH `/api/crm/deals/:id/stage`,
 *    which delegates to the same `lib/crm/move-deal-stage.ts` function the
 *    crm-assistant Mastra tool (`moveDealStage`, IPI-368, shipped) already
 *    calls — one allow-list, two callers, per IPI-365's own "do not
 *    duplicate" note (IPI-365 itself is `status: Duplicate`). `onStageChange`
 *    only fires with the value the server actually returned; a failed PATCH
 *    shows `toast.error` and leaves the displayed stage unchanged.
 *  - Won/Lost must go through `POST /api/crm/deals/:id/convert` per
 *    CRM-HANDOFF.md §3 ("no drag, button, or agent may bypass it") — that
 *    route is IPI-367's job (Urgent, not started as of this PR) because
 *    Won also creates/links a `brands` row, which needs the
 *    rls-policy-auditor + migration-reviewer sign-off IPI-367 mandates.
 *    Approving here always surfaces an honest failure — per IPI-367's own
 *    acceptance criterion ("failed response reverts + shows an error —
 *    never an optimistic success state"), never a fake success. */
export function DealStageControl({ dealId, stage, onStageChange }: Props) {
  const [pending, setPending] = useState<CrmDealStage | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const approveRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (pending) cancelRef.current?.focus();
  }, [pending]);

  if (TERMINAL.has(stage) && !pending) {
    // Terminal and settled — the header StatusChip already shows the outcome;
    // no stage row to act on.
    return null;
  }

  async function handleClick(target: CrmDealStage) {
    if (target === stage) return; // already here — skip the round-trip
    if (TERMINAL.has(target)) {
      setPending(target);
      return;
    }
    setSubmitting(true);
    try {
      const result = await patchDealStage(dealId, target);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onStageChange(result.stage);
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    setPending(null);
  }

  function handleApprove() {
    const result = approveDealTransition();
    if (!result.ok) {
      toast.error(result.error);
    }
    // Always revert the pending state — approve never optimistically commits.
    setPending(null);
  }

  function handleTrapKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      handleCancel();
      return;
    }
    if (event.key !== "Tab") return;
    // Two-element focus trap: Cancel <-> Approve only.
    if (event.shiftKey && document.activeElement === cancelRef.current) {
      event.preventDefault();
      approveRef.current?.focus();
    } else if (!event.shiftKey && document.activeElement === approveRef.current) {
      event.preventDefault();
      cancelRef.current?.focus();
    }
  }

  if (pending) {
    return (
      <ApprovalDialog
        stage={stage}
        target={pending}
        cancelRef={cancelRef}
        approveRef={approveRef}
        onCancel={handleCancel}
        onApprove={handleApprove}
        onKeyDown={handleTrapKeyDown}
      />
    );
  }

  return (
    <div>
      <div className={styles.stageRow} role="group" aria-label="Deal stage">
        {STAGES.map((s) => {
          const gated = TERMINAL.has(s);
          const active = s === stage;
          const className = active
            ? styles.stageActive
            : gated
              ? styles.stageGated
              : styles.stageDefault;
          return (
            <button
              key={s}
              type="button"
              disabled={submitting}
              onClick={() => handleClick(s)}
              className={className}
            >
              {crmDealStageLabel(s)}
              {gated ? <span className={styles.gatedHint}>approval</span> : null}
            </button>
          );
        })}
      </div>
      <p className={styles.stageHint}>
        Lead through Negotiation update immediately. Won / Lost open an approval gate.
      </p>
    </div>
  );
}

/** Non-terminal-only PATCH — the route rejects won/lost before touching
 *  Supabase (see route.ts), so this can never be the path that sets a
 *  terminal stage. Mirrors the {ok,error}/{ok,dealId,stage} result shape
 *  used across this codebase's other client-side service calls. */
async function patchDealStage(
  dealId: string,
  stage: CrmDealStage,
): Promise<{ ok: true; stage: CrmDealStage } | { ok: false; error: string }> {
  try {
    const res = await fetch(`/api/crm/deals/${dealId}/stage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    const body = await res.json();
    if (!res.ok) {
      return { ok: false, error: body?.error?.message ?? "Could not update the stage." };
    }
    return { ok: true, stage: body.stage as CrmDealStage };
  } catch {
    return { ok: false, error: "Network error — the stage was not changed." };
  }
}

/** No backend exists to call — `/api/crm/deals/:id/convert` is IPI-367
 *  (Urgent, not started). Synchronous stub so the UI never shows an
 *  optimistic success it can't back up. */
function approveDealTransition(): { ok: false; error: string } {
  return {
    ok: false,
    error: "Won/Lost approval isn't wired to the database yet (pending IPI-367). Nothing was changed.",
  };
}

type ApprovalDialogProps = {
  stage: CrmDealStage;
  target: CrmDealStage;
  cancelRef: RefObject<HTMLButtonElement | null>;
  approveRef: RefObject<HTMLButtonElement | null>;
  onCancel: () => void;
  onApprove: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
};

/** Extracted from DealStageControl to keep that component under Codacy's
 *  50-line/15-complexity method limits — pure presentation, all decisions
 *  (target, body copy, revert-on-approve) stay in the parent. */
function ApprovalDialog({
  stage,
  target,
  cancelRef,
  approveRef,
  onCancel,
  onApprove,
  onKeyDown,
}: ApprovalDialogProps) {
  const targetLabel = crmDealStageLabel(target);
  const body =
    target === "won"
      ? "Approving would create or link a brands record and hand off to Brand Intelligence. This cannot be undone here."
      : "Approving would mark the deal closed-lost with no further pipeline action.";

  return (
    <div
      className={styles.approvalCard}
      role="dialog"
      aria-modal="true"
      aria-labelledby="deal-approval-dialog-heading"
      onKeyDown={onKeyDown}
    >
      <div id="deal-approval-dialog-heading" className={styles.approvalHeading}>
        Mark this deal as {targetLabel}?
      </div>
      <div className={styles.approvalStages}>
        <StatusChip dot={crmDealStageDotToken(stage)} label={crmDealStageLabel(stage)} />
        <span className={styles.approvalArrow} aria-hidden>
          →
        </span>
        <StatusChip dot={crmDealStageDotToken(target)} label={targetLabel} />
      </div>
      <p className={styles.approvalBody}>{body}</p>
      <div className={styles.approvalActions}>
        <button ref={cancelRef} type="button" onClick={onCancel} className={styles.cancelButton}>
          Cancel
        </button>
        <button
          ref={approveRef}
          type="button"
          onClick={onApprove}
          className={target === "won" ? styles.approveButtonWon : styles.approveButtonLost}
        >
          Approve · Mark {targetLabel}
        </button>
      </div>
      <p className={styles.approvalFootnote}>
        This is the only path that can set won/lost — no drag, button, or agent may bypass it.
      </p>
    </div>
  );
}
