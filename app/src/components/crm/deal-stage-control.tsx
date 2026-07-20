"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { StatusChip } from "@/components/ui/status-chip";
import { crmDealStageDotToken, crmDealStageLabel, type CrmDealStage } from "@/lib/crm/status-tokens";

import styles from "./deal-stage-control.module.css";

const STAGES: CrmDealStage[] = ["lead", "qualified", "proposal", "negotiation", "won", "lost"];
const TERMINAL = new Set<CrmDealStage>(["won", "lost"]);

type Props = {
  dealId: string;
  stage: CrmDealStage;
  /** Optional CAS token — forwarded as `expectedUpdatedAt` on non-terminal PATCH. */
  updatedAt?: string;
  /** Called with the server-confirmed stage after a successful non-terminal
   *  PATCH — `brandId` is `undefined` for these calls, never optimistic.
   *  Called again after a successful won/lost approval with the real
   *  `brandId` from the same response — `null` for lost or won-with-no-brand,
   *  a real id for won. The parent must use this value directly rather than
   *  waiting on its own RSC refresh, or `WonBanner` renders a stale
   *  "not yet linked" state for the length of that refresh even though the
   *  server already returned the real brand id. */
  onStageChange: (stage: CrmDealStage, brandId?: string | null) => void;
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
 *  - Won/Lost go through `POST /api/crm/deals/:id/convert` per
 *    CRM-HANDOFF.md §3 ("no drag, button, or agent may bypass it") — that
 *    route + its `crm_convert_deal` RPC are IPI-367's own deliverable. Won
 *    also creates/links a `brands` row, reviewed by a migration-safety pass
 *    + `rls-policy-auditor` before the migration was applied. Approve calls
 *    the real endpoint and only calls `onStageChange`/refreshes on a
 *    server-confirmed 200 — a failed response reverts and shows an honest
 *    error, per IPI-367's own acceptance criterion, never an optimistic
 *    success state. */
export function DealStageControl({ dealId, stage, updatedAt, onStageChange }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<CrmDealStage | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [approving, setApproving] = useState(false);
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
      const result = await patchDealStage(dealId, target, stage, updatedAt);
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
    // Once approval is in flight the action is committed — Escape (via
    // handleTrapKeyDown below) and the Cancel button (disabled via the
    // `approving` prop, but this is the single choke point both route
    // through) must not dismiss the dialog while the request can still land.
    if (approving) return;
    setPending(null);
  }

  async function handleApprove() {
    if (!pending || approving) return;
    setApproving(true);
    try {
      const result = await postConvert(dealId, pending);
      if (!result.ok) {
        toast.error(result.error);
        // Revert on failure — never an optimistic success state.
        setPending(null);
        return;
      }
      // Server-confirmed — pass the real brandId up immediately (don't make
      // the parent wait for router.refresh() to know it — see the Props doc).
      onStageChange(result.stage, result.brandId);
      setPending(null);
      router.refresh();
    } finally {
      setApproving(false);
    }
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
        approving={approving}
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
              aria-pressed={active}
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
  expectedStage: CrmDealStage,
  expectedUpdatedAt?: string,
): Promise<{ ok: true; stage: CrmDealStage } | { ok: false; error: string }> {
  try {
    const res = await fetch(`/api/crm/deals/${dealId}/stage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stage,
        expectedStage,
        ...(expectedUpdatedAt ? { expectedUpdatedAt } : {}),
      }),
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

/** Won/Lost only — `/api/crm/deals/:id/convert` is the sole path allowed to
 *  set a terminal stage (IPI-367); it 400s on any other decision value. Same
 *  {ok,error}/{ok,...} result shape as patchDealStage above. */
async function postConvert(
  dealId: string,
  decision: CrmDealStage,
): Promise<
  { ok: true; stage: CrmDealStage; brandId: string | null } | { ok: false; error: string }
> {
  try {
    const res = await fetch(`/api/crm/deals/${dealId}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    const body = await res.json();
    if (!res.ok) {
      return { ok: false, error: body?.error?.message ?? "Could not approve the transition." };
    }
    return { ok: true, stage: body.stage as CrmDealStage, brandId: body.brandId ?? null };
  } catch {
    return { ok: false, error: "Network error — the deal was not changed." };
  }
}

type ApprovalDialogProps = {
  stage: CrmDealStage;
  target: CrmDealStage;
  approving: boolean;
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
  approving,
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
        <button
          ref={cancelRef}
          type="button"
          onClick={onCancel}
          disabled={approving}
          className={styles.cancelButton}
        >
          Cancel
        </button>
        <button
          ref={approveRef}
          type="button"
          onClick={onApprove}
          disabled={approving}
          className={target === "won" ? styles.approveButtonWon : styles.approveButtonLost}
        >
          {approving ? "Approving…" : `Approve · Mark ${targetLabel}`}
        </button>
      </div>
      <p className={styles.approvalFootnote}>
        This is the only path that can set won/lost — no drag, button, or agent may bypass it.
      </p>
    </div>
  );
}
