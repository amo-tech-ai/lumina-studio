"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from "react";
import { toast } from "sonner";

import { StatusChip } from "@/components/ui/status-chip";
import { crmDealStageDotToken, crmDealStageLabel, type CrmDealStage } from "@/lib/crm/status-tokens";

import styles from "./deal-stage-control.module.css";

const STAGES: CrmDealStage[] = ["lead", "qualified", "proposal", "negotiation", "won", "lost"];
const TERMINAL = new Set<CrmDealStage>(["won", "lost"]);

type Props = {
  stage: CrmDealStage;
  /** Called only for a non-terminal move — see the component doc for why
   *  this doesn't persist yet. */
  onStageChange: (stage: CrmDealStage) => void;
};

/** Deal stage selector + Won/Lost approval gate — ported from
 *  SCR-31-CRM-Deal-Detail.dc.html's stage control + inline ApprovalCard
 *  (IPI-396 Task 3). Referenced by name in IPI-367's own plan: "Modify
 *  deal-stage-control.tsx — replace the inert won/lost handler with the
 *  real gate."
 *
 *  Neither transition persists from THIS component yet:
 *  - Non-terminal moves (Lead→Negotiation) DO have a working backend
 *    already — the `moveDealStage` Mastra tool (crm-assistant agent,
 *    IPI-368, shipped), reachable from the chat dock on this same page.
 *    IPI-365 (a kanban-board PATCH route for the same 4 stages) is
 *    `status: Duplicate` — its own Phase-0 notes say not to duplicate
 *    `moveDealStage`'s allow-list logic in a second place. This component's
 *    buttons don't call that tool (yet) — clicking only updates the label
 *    locally, matching DC's own interaction, and reverts on refresh. See
 *    IPI-396 for the follow-up to wire these buttons to the existing tool.
 *  - Won/Lost must go through `POST /api/crm/deals/:id/convert` per
 *    CRM-HANDOFF.md §3 ("no drag, button, or agent may bypass it") — that
 *    route is IPI-367's job (Urgent, not started as of this PR) because
 *    Won also creates/links a `brands` row, which needs the
 *    rls-policy-auditor + migration-reviewer sign-off IPI-367 mandates.
 *    Approving here always surfaces an honest failure — per IPI-367's own
 *    acceptance criterion ("failed response reverts + shows an error —
 *    never an optimistic success state"), never a fake success. */
export function DealStageControl({ stage, onStageChange }: Props) {
  const [pending, setPending] = useState<CrmDealStage | null>(null);
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

  function handleClick(target: CrmDealStage) {
    if (TERMINAL.has(target)) {
      setPending(target);
    } else {
      onStageChange(target);
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
            <button key={s} type="button" onClick={() => handleClick(s)} className={className}>
              {crmDealStageLabel(s)}
              {gated ? <span className={styles.gatedHint}>approval</span> : null}
            </button>
          );
        })}
      </div>
      <p className={styles.stageHint}>
        Won / Lost open an approval gate — no stage here writes to the database yet.
      </p>
    </div>
  );
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
}: {
  stage: CrmDealStage;
  target: CrmDealStage;
  cancelRef: RefObject<HTMLButtonElement | null>;
  approveRef: RefObject<HTMLButtonElement | null>;
  onCancel: () => void;
  onApprove: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
}) {
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
      aria-label={`Mark this deal as ${targetLabel}?`}
      onKeyDown={onKeyDown}
    >
      <div className={styles.approvalHeading}>Mark this deal as {targetLabel}?</div>
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
