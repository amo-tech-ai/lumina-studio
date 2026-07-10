"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
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
 *  Neither transition persists yet — there is no backend for either:
 *  - Non-terminal moves (Lead→Negotiation) need a PATCH route that IPI-365
 *    ("CRM-UX-003 Pipeline board kanban ungated stage moves") owns and
 *    hasn't shipped. Clicking a non-terminal stage updates the label locally
 *    (matches DC's own interaction) but does not write to the database —
 *    it reverts on refresh. This is a real, open gap, not simulated success.
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
    const targetLabel = crmDealStageLabel(pending);
    const body =
      pending === "won"
        ? "Approving would create or link a brands record and hand off to Brand Intelligence. This cannot be undone here."
        : "Approving would mark the deal closed-lost with no further pipeline action.";
    return (
      <div
        className={styles.approvalCard}
        role="dialog"
        aria-modal="true"
        aria-label={`Mark this deal as ${targetLabel}?`}
        onKeyDown={handleTrapKeyDown}
      >
        <div className={styles.approvalHeading}>Mark this deal as {targetLabel}?</div>
        <div className={styles.approvalStages}>
          <StatusChip dot={crmDealStageDotToken(stage)} label={crmDealStageLabel(stage)} />
          <span className={styles.approvalArrow} aria-hidden>
            →
          </span>
          <StatusChip dot={crmDealStageDotToken(pending)} label={targetLabel} />
        </div>
        <p className={styles.approvalBody}>{body}</p>
        <div className={styles.approvalActions}>
          <button ref={cancelRef} type="button" onClick={handleCancel} className={styles.cancelButton}>
            Cancel
          </button>
          <button
            ref={approveRef}
            type="button"
            onClick={handleApprove}
            className={pending === "won" ? styles.approveButtonWon : styles.approveButtonLost}
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
