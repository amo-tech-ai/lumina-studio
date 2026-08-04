"use client";

// IPI-483 · PLN-ENG-002 (PR3) — Planner gate ApprovalCard (SCR-32 +
// ApprovalCard.dc.html). Approve / Edit / Discard only — no Reject.
// Mutations go through thin server actions → typed adapters; no supabase.from.

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";

import {
  approveGateAction,
  discardGateAction,
  type GateProposedChange,
} from "@/app/(operator)/app/planner/[instanceId]/actions";
import { ApprovalCardShell } from "@/components/approval-card";
import { GATE_STATUS_LABEL } from "@/lib/planner/gate-visual";
import type { InstanceGate, PlannerTask } from "@/lib/planner/types";

import styles from "./gate-approval-card.module.css";

type Busy = "idle" | "approving" | "discarding";

type ProposedDates = Record<string, { start: string; end: string }>;

/** Editable phase tasks — include undated rows so operators can schedule gaps. */
function editableTasks(tasks: PlannerTask[]): PlannerTask[] {
  return tasks.filter((t) => t.status !== "cancelled");
}

function formatSpan(start: string | null, end: string | null): string {
  if (start && end) return `${start} → ${end}`;
  if (start) return start;
  if (end) return end;
  return "Unscheduled";
}

function buildProposedChanges(
  tasks: PlannerTask[],
  proposed: ProposedDates,
): GateProposedChange[] {
  const changes: GateProposedChange[] = [];
  for (const task of editableTasks(tasks)) {
    const next = proposed[task.id];
    if (!next?.start || !next?.end) continue;
    if (next.start === task.startDate && next.end === task.endDate) continue;
    if (!task.updatedAt) continue;
    changes.push({
      taskId: task.id,
      newStartDate: next.start,
      newEndDate: next.end,
      expectedUpdatedAt: task.updatedAt,
    });
  }
  return changes;
}

function newIdempotencyKey(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export type GateApprovalCardProps = {
  instanceId: string;
  gate: InstanceGate;
  tasks: PlannerTask[];
  /** Re-resolve AdaptivePanel phase selection after Approve/Discard. */
  onMutated?: () => void | Promise<void>;
};

export function GateApprovalCard({
  instanceId,
  gate,
  tasks,
  onMutated,
}: GateApprovalCardProps) {
  const router = useRouter();
  const titleId = useId();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState<Busy>("idle");
  const [error, setError] = useState<string | null>(null);
  // Stable per logical attempt — reuse on retry of the same Approve/Discard.
  const approveKeyRef = useRef<string | null>(null);
  const discardKeyRef = useRef<string | null>(null);
  const [proposed, setProposed] = useState<ProposedDates>(() => {
    const initial: ProposedDates = {};
    for (const task of editableTasks(tasks)) {
      initial[task.id] = {
        start: task.startDate ?? "",
        end: task.endDate ?? "",
      };
    }
    return initial;
  });

  const status = gate.status;
  const isReachable = status === "reachable";
  const changes = buildProposedChanges(tasks, proposed);
  const editables = editableTasks(tasks);
  const showDiff =
    isReachable && (editing || changes.length > 0 || editables.length > 0);
  // RPC default: blank required_role → manager
  const roleLabel = gate.requiredRole?.trim() || "manager";

  const cardClass =
    status === "approved"
      ? `${styles.card} ${styles.cardApproved}`
      : status === "discarded"
        ? `${styles.card} ${styles.cardDiscarded}`
        : status === "locked"
          ? `${styles.card} ${styles.cardLocked}`
          : styles.card;

  const dotClass =
    status === "approved"
      ? `${styles.dot} ${styles.dotApproved}`
      : status === "locked" || status === "discarded"
        ? `${styles.dot} ${styles.dotLocked}`
        : styles.dot;

  async function onApprove() {
    if (busy !== "idle") return;
    setBusy("approving");
    setError(null);
    if (!approveKeyRef.current) {
      approveKeyRef.current = newIdempotencyKey("approve");
    }
    const result = await approveGateAction(
      instanceId,
      gate.phaseId,
      approveKeyRef.current,
      changes,
    );
    setBusy("idle");
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    approveKeyRef.current = null;
    discardKeyRef.current = null;
    setEditing(false);
    router.refresh();
    await onMutated?.();
  }

  async function onDiscard() {
    if (busy !== "idle") return;
    setBusy("discarding");
    setError(null);
    if (!discardKeyRef.current) {
      discardKeyRef.current = newIdempotencyKey("discard");
    }
    const result = await discardGateAction(
      instanceId,
      gate.phaseId,
      discardKeyRef.current,
    );
    setBusy("idle");
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    approveKeyRef.current = null;
    discardKeyRef.current = null;
    setEditing(false);
    router.refresh();
    await onMutated?.();
  }

  return (
    <ApprovalCardShell
      className={cardClass}
      data-testid="planner-gate-approval-card"
      aria-labelledby={titleId}
    >
      <div className={styles.header}>
        <span className={dotClass} aria-hidden="true" />
        <span id={titleId} className={styles.title}>
          Approval gate — {gate.gateType}
        </span>
        {status === "approved" ? (
          <span className={styles.badge}>
            <Check size={14} aria-hidden="true" />
            Approved
          </span>
        ) : null}
      </div>

      <p className={styles.meta} data-testid="planner-gate-status">
        {GATE_STATUS_LABEL[status]}
        {` · Requires ${roleLabel}`}
        {gate.reason ? ` · ${gate.reason}` : ""}
      </p>

      {showDiff ? (
        <div className={styles.diff} data-testid="planner-gate-schedule-diff">
          <div className={`${styles.diffPane} ${styles.diffPaneMuted}`}>
            <div className={styles.diffLabel}>Before</div>
            <div className={styles.diffBody}>
              {editables.length === 0 ? (
                <p className={styles.diffRow}>No tasks in this phase.</p>
              ) : (
                editables.map((task) => (
                  <p key={task.id} className={styles.diffRow}>
                    <strong>{task.title}</strong>
                    {": "}
                    {formatSpan(task.startDate, task.endDate)}
                  </p>
                ))
              )}
            </div>
          </div>
          <div className={styles.diffPane}>
            <div className={styles.diffLabel}>After</div>
            <div className={`${styles.diffBody} ${styles.diffBodyAfter}`}>
              {changes.length === 0 ? (
                <p className={styles.diffRow}>
                  No schedule changes — approving unlocks the next phase.
                </p>
              ) : (
                editables.map((task) => {
                  const next = proposed[task.id];
                  if (!next?.start || !next?.end) return null;
                  const changed =
                    next.start !== (task.startDate ?? "") ||
                    next.end !== (task.endDate ?? "");
                  if (!changed) return null;
                  return (
                    <p key={task.id} className={styles.diffRow}>
                      <strong>{task.title}</strong>
                      {": "}
                      {formatSpan(next.start, next.end)}
                    </p>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : null}

      {editing && isReachable ? (
        <div className={styles.editList} data-testid="planner-gate-edit-dates">
          {editables.map((task) => (
            <div key={task.id} className={styles.editRow}>
              <label htmlFor={`gate-start-${task.id}`}>{task.title}</label>
              <input
                id={`gate-start-${task.id}`}
                type="date"
                value={proposed[task.id]?.start ?? task.startDate ?? ""}
                disabled={busy !== "idle"}
                onChange={(e) =>
                  setProposed((prev) => ({
                    ...prev,
                    [task.id]: {
                      start: e.target.value,
                      end: prev[task.id]?.end ?? task.endDate ?? "",
                    },
                  }))
                }
              />
              <input
                id={`gate-end-${task.id}`}
                type="date"
                aria-label={`${task.title} end date`}
                value={proposed[task.id]?.end ?? task.endDate ?? ""}
                disabled={busy !== "idle"}
                onChange={(e) =>
                  setProposed((prev) => ({
                    ...prev,
                    [task.id]: {
                      start: prev[task.id]?.start ?? task.startDate ?? "",
                      end: e.target.value,
                    },
                  }))
                }
              />
            </div>
          ))}
        </div>
      ) : null}

      {isReachable ? (
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.approve}
            disabled={busy !== "idle"}
            onClick={() => void onApprove()}
          >
            {busy === "approving" ? "Approving…" : "Approve"}
          </button>
          <button
            type="button"
            className={styles.edit}
            disabled={busy !== "idle"}
            onClick={() => setEditing((v) => !v)}
          >
            {editing ? "Done editing" : "Edit"}
          </button>
          <button
            type="button"
            className={styles.discard}
            disabled={busy !== "idle"}
            onClick={() => void onDiscard()}
          >
            {busy === "discarding" ? "Discarding…" : "Discard"}
          </button>
        </div>
      ) : null}

      {error ? (
        <p className={styles.error} role="alert" data-testid="planner-gate-error">
          {error}
        </p>
      ) : null}
    </ApprovalCardShell>
  );
}
