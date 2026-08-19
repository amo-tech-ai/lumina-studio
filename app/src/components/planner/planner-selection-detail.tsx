"use client";

// IPI-551 · PLN-S4b — presentational Detail views AdaptivePanel publishes
// into the shared IntelligencePanel via useSetIntelligenceDetail.
//
// IPI-582 · PLN-S1E Stage 1 — PlannerTaskDetail: updateTask form + keyboard
// schedule shift via shiftTask (±1 day / date picker with confirm). Priority
// stays read-only (adapter has no priority patch). DnD deferred — see PR body.
// No ApprovalCard here (Stage 2 · IPI-483).

import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
  type FormEvent,
} from "react";

import {
  shiftTaskAction,
  updateTaskAction,
} from "@/app/(operator)/app/planner/[instanceId]/actions";
import type { PlannerAssigneeOption } from "@/app/(operator)/app/planner/[instanceId]/selection-actions";
import { GATE_STATUS_LABEL, gateUiToVisual } from "@/lib/planner/gate-visual";
import {
  addPlanDays,
  daysBetween,
  parsePlanDate,
  planDateToISO,
} from "@/lib/planner/planner-date-utils";
import {
  mapMutationFailure,
  mapPlannerMutationError,
  mapThrownPlannerFailure,
  restorePlannerFocus,
  type PlannerRecoveryState,
} from "@/lib/planner/mutation-recovery";
import {
  rangeForPhase,
  resolveGateVisualState,
  type GateVisualState,
} from "@/lib/planner/planner-view-model";
import type {
  InstanceGate,
  PlannerMember,
  PlannerPhase,
  PlannerRole,
  PlannerTask,
  PlannerTaskStatus,
} from "@/lib/planner/types";

import { GateApprovalCard } from "./gate-approval-card";

// Duplicated from member-table.tsx's ACCESS_LABEL (not exported there, and
// this component shouldn't widen that file's public surface just to reuse
// a 4-line map — see IPI-551 spec).
const ACCESS_LABEL: Record<PlannerRole, string> = {
  owner: "Full access",
  manager: "Edit access",
  contributor: "Contribute",
  viewer: "View only",
};

const TASK_STATUSES: PlannerTaskStatus[] = [
  "todo",
  "in_progress",
  "blocked",
  "done",
  "cancelled",
];

const STATUS_LABEL: Record<PlannerTaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  blocked: "Blocked",
  done: "Done",
  cancelled: "Cancelled",
};

const rowStyle: CSSProperties = { margin: "0.25rem 0" };
const labelStyle: CSSProperties = { fontWeight: 600 };
const fieldStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.25rem",
  margin: "0.5rem 0",
};
const inputStyle: CSSProperties = {
  width: "100%",
  padding: "0.35rem 0.5rem",
  font: "inherit",
};
const errorStyle: CSSProperties = { color: "var(--color-blocked, #DC2626)", fontSize: 13 };
const mutedStyle: CSSProperties = { color: "var(--color-text-muted)", fontSize: 13 };

/** Phase task list: show whichever bound exists; "(no dates)" only when both absent. */
function formatTaskDateSpan(task: Pick<PlannerTask, "startDate" | "endDate">): string {
  if (task.startDate && task.endDate) return ` (${task.startDate} → ${task.endDate})`;
  if (task.startDate) return ` (${task.startDate})`;
  if (task.endDate) return ` (${task.endDate})`;
  return " (no dates)";
}

function DetailHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "1rem",
        gap: "0.5rem",
      }}
    >
      {/* Persistent back control — keeps the caller on this panel while
          giving them an obvious way out. */}
      <button
        type="button"
        onClick={onClose}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        &lsaquo; Intelligence
      </button>
      <span style={{ fontWeight: 600 }}>{title}</span>
      {/* Redundant × close — both this and the back control above are real,
          separately-tabbable buttons per IPI-551's frozen recommendation. */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: "1.1rem" }}
      >
        &times;
      </button>
    </div>
  );
}

function formatTaskAssigneeLabel(
  task: Pick<PlannerTask, "assigneeUserId" | "assigneeRole">,
  assignees: PlannerAssigneeOption[],
): string {
  if (task.assigneeUserId) {
    const named = assignees.find((m) => m.userId === task.assigneeUserId);
    return named?.displayName ?? "Assigned member";
  }
  if (task.assigneeRole) return `Role · ${task.assigneeRole}`;
  return "Unassigned";
}

function TaskReadOnlyBody({
  task,
  assignees = [],
}: {
  task: PlannerTask;
  assignees?: PlannerAssigneeOption[];
}) {
  return (
    <>
      <h3 style={{ margin: "0 0 0.5rem" }}>{task.title}</h3>
      {task.description ? (
        <div style={{ ...rowStyle, whiteSpace: "pre-wrap" }}>{task.description}</div>
      ) : null}
      <div style={rowStyle}>
        <span style={labelStyle}>Status: </span>
        {STATUS_LABEL[task.status] ?? task.status}
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>Priority: </span>
        {task.priority}
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>Assignee: </span>
        {formatTaskAssigneeLabel(task, assignees)}
      </div>
      {task.startDate ? (
        <div style={rowStyle}>
          <span style={labelStyle}>Start: </span>
          {task.startDate}
        </div>
      ) : null}
      {task.endDate ? (
        <div style={rowStyle}>
          <span style={labelStyle}>End: </span>
          {task.endDate}
        </div>
      ) : null}
    </>
  );
}

export type TaskSelectionRefresh = {
  task: PlannerTask;
  canUpdateTasks: boolean;
  assignees: PlannerAssigneeOption[];
  assigneesUnavailable?: boolean;
};

export type PlannerTaskDetailProps = {
  task: PlannerTask;
  onClose: () => void;
  /** When false/omitted, Viewer (and fail-closed) see read-only detail. */
  canUpdateTasks?: boolean;
  assignees?: PlannerAssigneeOption[];
  /** Member-name RPC failed — disable reassignment; do not treat [] as truth. */
  assigneesUnavailable?: boolean;
  /** Re-resolve the selected task (after save or STALE_VERSION Reload). */
  onRefreshSelection?: () => Promise<TaskSelectionRefresh | null>;
};

type Draft = {
  title: string;
  description: string;
  status: PlannerTaskStatus;
  assigneeUserId: string;
};

function draftFromTask(task: PlannerTask): Draft {
  return {
    title: task.title,
    description: task.description ?? "",
    status: task.status,
    assigneeUserId: task.assigneeUserId ?? "",
  };
}

function proposeShift(task: PlannerTask, deltaDays: number): {
  start: string;
  end: string | null;
} | null {
  const start = parsePlanDate(task.startDate);
  if (!start) return null;
  const end = parsePlanDate(task.endDate);
  return {
    start: planDateToISO(addPlanDays(start, deltaDays)),
    end: end ? planDateToISO(addPlanDays(end, deltaDays)) : null,
  };
}

function captureOpener(): HTMLElement | null {
  const active = document.activeElement;
  return active instanceof HTMLElement ? active : null;
}

/** IPI-906 — shared recovery chrome for save + shift. No second error taxonomy. */
function PlannerRecoveryAlert({
  recovery,
  pending,
  onReload,
  onReview,
  onRetry,
  testId,
}: {
  recovery: PlannerRecoveryState;
  pending: boolean;
  onReload?: () => void;
  onReview?: () => void;
  onRetry?: () => void;
  testId: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const showRetry = Boolean(onRetry) && (recovery.retrySafe || recovery.kind === "unknown");
  const showReload = Boolean(onReload) && recovery.reloadLatest;
  const showReview = Boolean(onReview) && recovery.reviewLatest;

  useLayoutEffect(() => {
    const id = requestAnimationFrame(() => {
      const first = rootRef.current?.querySelector("button");
      restorePlannerFocus(first instanceof HTMLElement ? first : null);
    });
    return () => cancelAnimationFrame(id);
  }, [recovery.kind, recovery.code]);

  return (
    <div
      ref={rootRef}
      role="alert"
      style={{ ...errorStyle, marginTop: "0.5rem" }}
      data-testid={testId}
      data-recovery-kind={recovery.kind}
    >
      <p style={{ margin: 0, fontWeight: 600 }}>{recovery.title}</p>
      <p style={{ margin: "0.25rem 0 0" }}>{recovery.message}</p>
      {showReload || showReview || showRetry ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
          {showRetry ? (
            <button type="button" disabled={pending} onClick={onRetry} data-testid={`${testId}-retry`}>
              Retry
            </button>
          ) : null}
          {showReview ? (
            <button type="button" disabled={pending} onClick={onReview} data-testid={`${testId}-review`}>
              Review latest
            </button>
          ) : null}
          {showReload ? (
            <button
              type="button"
              disabled={pending}
              onClick={onReload}
              data-testid={testId === "planner-task-action-error" ? "planner-task-reload" : `${testId}-reload`}
            >
              Reload latest
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function TaskScheduleShift({
  task,
  disabled,
  onShifted,
  onReviewLatest,
  onReloadLatest,
}: {
  task: PlannerTask;
  disabled: boolean;
  onShifted: () => Promise<void>;
  onReviewLatest: () => Promise<void>;
  onReloadLatest: () => Promise<void>;
}) {
  const router = useRouter();
  const [proposedDelta, setProposedDelta] = useState<number | null>(null);
  const [pickerDate, setPickerDate] = useState(task.startDate ?? "");
  const [shiftRecovery, setShiftRecovery] = useState<PlannerRecoveryState | null>(null);
  const [isShifting, startShift] = useTransition();
  const shiftKeyRef = useRef<string | null>(null);
  // CAS token from the task version shown in the proposal preview.
  const observedUpdatedAtRef = useRef<string | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const start = parsePlanDate(task.startDate);
  const end = parsePlanDate(task.endDate);
  // planner_shift_task rejects changed tasks missing either bound (INVALID_INPUT).
  const canShift = Boolean(start && end);
  const preview = proposedDelta !== null ? proposeShift(task, proposedDelta) : null;

  // Keep the date input in sync after a successful shift (component stays mounted).
  useEffect(() => {
    if (proposedDelta === null) {
      setPickerDate(task.startDate ?? "");
    }
  }, [task.startDate, proposedDelta]);

  function proposeDelta(delta: number) {
    shiftKeyRef.current = null;
    observedUpdatedAtRef.current = task.updatedAt ?? null;
    setShiftRecovery(null);
    setProposedDelta(delta);
  }

  function proposeFromPicker(iso: string) {
    setPickerDate(iso);
    shiftKeyRef.current = null;
    observedUpdatedAtRef.current = task.updatedAt ?? null;
    setShiftRecovery(null);
    const next = parsePlanDate(iso);
    if (!start || !next) {
      setProposedDelta(null);
      return;
    }
    setProposedDelta(daysBetween(start, next));
  }

  function cancelProposal() {
    setProposedDelta(null);
    setShiftRecovery(null);
    shiftKeyRef.current = null;
    observedUpdatedAtRef.current = null;
    setPickerDate(task.startDate ?? "");
  }

  function confirmShift() {
    if (proposedDelta === null || proposedDelta === 0 || !canShift || isShifting || disabled) return;
    const expectedUpdatedAt = observedUpdatedAtRef.current ?? task.updatedAt ?? "";
    if (!expectedUpdatedAt) {
      setShiftRecovery(
        mapPlannerMutationError({
          code: "INVALID_INPUT",
          message: "This task is missing a version token. Reload and try again.",
        }),
      );
      return;
    }
    shiftKeyRef.current ??= crypto.randomUUID();
    const idempotencyKey = shiftKeyRef.current;
    setShiftRecovery(null);
    openerRef.current = captureOpener();

    startShift(async () => {
      try {
        const result = await shiftTaskAction(
          task.instanceId,
          task.id,
          proposedDelta,
          idempotencyKey,
          expectedUpdatedAt,
        );
        if (!result.ok) {
          const recovery = mapMutationFailure(result);
          // Uncommitted move: drop the proposal except for network retry.
          if (!recovery.retrySafe) {
            setProposedDelta(null);
            shiftKeyRef.current = null;
            observedUpdatedAtRef.current = null;
            setPickerDate(task.startDate ?? "");
          }
          setShiftRecovery(recovery);
          if (!recovery.retrySafe && !recovery.reloadLatest) {
            restorePlannerFocus(openerRef.current);
          }
          return;
        }
        shiftKeyRef.current = null;
        observedUpdatedAtRef.current = null;
        setProposedDelta(null);
        await onShifted();
        router.refresh();
      } catch {
        setShiftRecovery(mapThrownPlannerFailure());
      }
    });
  }

  if (!canShift) {
    return (
      <div style={{ marginTop: "1rem" }} data-testid="planner-task-schedule">
        <div style={labelStyle}>Schedule</div>
        <p style={mutedStyle}>Unscheduled — add both start and end dates before moving this task.</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "1rem" }} data-testid="planner-task-schedule">
      <div style={{ ...labelStyle, marginBottom: "0.5rem" }}>Schedule</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
        <button
          type="button"
          disabled={disabled || isShifting}
          onClick={() => proposeDelta(-1)}
          data-testid="planner-task-move-earlier"
        >
          Move earlier 1 day
        </button>
        <button
          type="button"
          disabled={disabled || isShifting}
          onClick={() => proposeDelta(1)}
          data-testid="planner-task-move-later"
        >
          Move later 1 day
        </button>
        <label style={{ display: "flex", gap: "0.35rem", alignItems: "center", fontSize: 13 }}>
          <span>Start date</span>
          <input
            type="date"
            value={pickerDate}
            disabled={disabled || isShifting}
            onChange={(e) => proposeFromPicker(e.target.value)}
            aria-invalid={shiftRecovery?.field === "startDate" || shiftRecovery?.field === "endDate"}
            data-testid="planner-task-shift-date"
          />
        </label>
      </div>

      {preview && proposedDelta !== 0 ? (
        <div
          style={{ marginTop: "0.75rem", padding: "0.5rem 0", borderTop: "1px solid var(--color-border, #e5e5e5)" }}
          data-testid="planner-task-shift-preview"
        >
          <p style={{ margin: "0 0 0.5rem", fontSize: 13 }}>
            Proposed: {preview.start}
            {preview.end ? ` → ${preview.end}` : ""}{" "}
            <span style={mutedStyle}>
              ({proposedDelta! > 0 ? "+" : ""}
              {proposedDelta} day{Math.abs(proposedDelta!) === 1 ? "" : "s"})
            </span>
          </p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              disabled={disabled || isShifting}
              onClick={confirmShift}
              data-testid="planner-task-shift-confirm"
            >
              {isShifting ? "Moving…" : "Confirm move"}
            </button>
            <button
              type="button"
              disabled={isShifting}
              onClick={cancelProposal}
              data-testid="planner-task-shift-cancel"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {shiftRecovery ? (
        <PlannerRecoveryAlert
          recovery={shiftRecovery}
          pending={isShifting}
          testId="planner-task-shift-error"
          onRetry={shiftRecovery.retrySafe || shiftRecovery.kind === "unknown" ? confirmShift : undefined}
          onReview={
            shiftRecovery.reviewLatest
              ? () => {
                  setShiftRecovery(null);
                  void onReviewLatest();
                }
              : undefined
          }
          onReload={
            shiftRecovery.reloadLatest
              ? () => {
                  setShiftRecovery(null);
                  void onReloadLatest();
                }
              : undefined
          }
        />
      ) : null}
    </div>
  );
}

export function PlannerTaskDetail({
  task,
  onClose,
  canUpdateTasks = false,
  assignees = [],
  assigneesUnavailable = false,
  onRefreshSelection,
}: PlannerTaskDetailProps) {
  const router = useRouter();
  const formId = useId();
  const [draft, setDraft] = useState(() => draftFromTask(task));
  const [expectedUpdatedAt, setExpectedUpdatedAt] = useState(task.updatedAt ?? "");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [actionRecovery, setActionRecovery] = useState<PlannerRecoveryState | null>(null);
  const [isPending, startTransition] = useTransition();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  // Mint once per submit attempt; reuse on retry of the same attempt. Cleared
  // on success or when the draft changes (new logical mutation).
  const idempotencyKeyRef = useRef<string | null>(null);
  // Sync draft when the selected task identity changes, or when the parent
  // CAS token advances (AdaptivePanel re-resolve). Do not key this on local
  // expectedUpdatedAt — Reload updates that before props catch up.
  const taskIdRef = useRef(task.id);
  const taskUpdatedAtRef = useRef(task.updatedAt);
  // Last server-synced field baseline — used to preserve dirty edits across a
  // schedule-only refresh (shift updates dates/updatedAt without Save).
  const baselineDraftRef = useRef(draftFromTask(task));
  const draftRef = useRef(draft);
  draftRef.current = draft;

  useEffect(() => {
    const sameId = task.id === taskIdRef.current;
    const sameUpdatedAt = task.updatedAt === taskUpdatedAtRef.current;
    if (sameId && sameUpdatedAt) return;

    const baseline = baselineDraftRef.current;
    const current = draftRef.current;
    const dirty =
      sameId &&
      (current.title !== baseline.title ||
        current.description !== baseline.description ||
        current.status !== baseline.status ||
        current.assigneeUserId !== baseline.assigneeUserId);

    taskIdRef.current = task.id;
    taskUpdatedAtRef.current = task.updatedAt;
    setExpectedUpdatedAt(task.updatedAt ?? "");

    if (!dirty) {
      const next = draftFromTask(task);
      baselineDraftRef.current = next;
      setDraft(next);
      setFieldError(null);
      setActionRecovery(null);
      idempotencyKeyRef.current = null;
    }
    // Dirty + same task: keep unsaved field edits; only CAS token / dates advance.
  }, [task]);

  function updateDraft<K extends keyof Draft>(key: K, value: Draft[K]) {
    idempotencyKeyRef.current = null;
    setDraft((prev) => ({ ...prev, [key]: value }));
    setFieldError(null);
    if (actionRecovery?.kind !== "stale") setActionRecovery(null);
  }

  function applyRefreshedTask(refreshed: TaskSelectionRefresh, mode: "keep-draft" | "accept-server") {
    taskIdRef.current = refreshed.task.id;
    taskUpdatedAtRef.current = refreshed.task.updatedAt;
    setExpectedUpdatedAt(refreshed.task.updatedAt ?? "");
    baselineDraftRef.current = draftFromTask(refreshed.task);
    if (mode === "accept-server") {
      setDraft(draftFromTask(refreshed.task));
    }
    setActionRecovery(null);
    setFieldError(null);
    idempotencyKeyRef.current = null;
  }

  function handleReloadLatest() {
    startTransition(async () => {
      const refreshed = onRefreshSelection ? await onRefreshSelection() : null;
      if (refreshed) applyRefreshedTask(refreshed, "accept-server");
      // Pick up revalidated Timeline/Kanban/Calendar/List RSC props.
      router.refresh();
    });
  }

  function handleReviewLatest() {
    startTransition(async () => {
      const refreshed = onRefreshSelection ? await onRefreshSelection() : null;
      if (refreshed) applyRefreshedTask(refreshed, "keep-draft");
      router.refresh();
    });
  }

  function handleSubmit(event?: FormEvent) {
    event?.preventDefault();
    if (!canUpdateTasks || isPending) return;

    const title = draft.title.trim();
    if (!title) {
      setFieldError("Title is required.");
      restorePlannerFocus(titleInputRef.current);
      return;
    }
    if (!expectedUpdatedAt) {
      setActionRecovery(
        mapPlannerMutationError({
          code: "INVALID_INPUT",
          message: "This task is missing a version token. Reload and try again.",
        }),
      );
      return;
    }

    // Role-only assignments are not editable via user select — omit assignee
    // from the patch so we never send null and leave a stale role attached.
    const roleOnlyAssignment = Boolean(task.assigneeRole && !task.assigneeUserId);
    const patch: {
      title: string;
      description: string | null;
      status: PlannerTaskStatus;
      assigneeUserId?: string | null;
    } = {
      title,
      description: draft.description.trim() ? draft.description.trim() : null,
      status: draft.status,
    };
    if (!roleOnlyAssignment && !assigneesUnavailable) {
      patch.assigneeUserId = draft.assigneeUserId || null;
    }

    idempotencyKeyRef.current ??= crypto.randomUUID();
    const idempotencyKey = idempotencyKeyRef.current;
    setFieldError(null);
    setActionRecovery(null);
    openerRef.current = captureOpener();

    startTransition(async () => {
      try {
        const result = await updateTaskAction(
          task.instanceId,
          task.id,
          expectedUpdatedAt,
          patch,
          idempotencyKey,
        );

        if (!result.ok) {
          const recovery = mapMutationFailure(result);
          setActionRecovery(recovery);
          if (!recovery.retrySafe && !recovery.reloadLatest) {
            restorePlannerFocus(openerRef.current);
          }
          return;
        }

        idempotencyKeyRef.current = null;
        taskIdRef.current = task.id;
        taskUpdatedAtRef.current = result.data.updatedAt;
        baselineDraftRef.current = {
          ...draftRef.current,
          title,
          description: patch.description ?? "",
        };
        setExpectedUpdatedAt(result.data.updatedAt);
        if (onRefreshSelection) await onRefreshSelection();
        // revalidatePath alone does not update mounted client views — refresh RSC props.
        router.refresh();
      } catch {
        // Transport / server-action rejection — keep idempotency key for retry.
        setActionRecovery(mapThrownPlannerFailure());
      }
    });
  }

  if (!canUpdateTasks) {
    return (
      <div data-testid="planner-detail-task" data-readonly="true">
        <DetailHeader title="Task" onClose={onClose} />
        <TaskReadOnlyBody task={task} assignees={assignees} />
        <p style={{ ...mutedStyle, marginTop: "0.75rem" }} role="status">
          View only — you cannot edit this task.
        </p>
      </div>
    );
  }

  const titleId = `${formId}-title`;
  const descriptionId = `${formId}-description`;
  const statusId = `${formId}-status`;
  const assigneeId = `${formId}-assignee`;
  const errorId = `${formId}-error`;
  const roleOnlyAssignment = Boolean(task.assigneeRole && !task.assigneeUserId);
  const assigneeMissingFromOptions =
    Boolean(draft.assigneeUserId) &&
    !assignees.some((member) => member.userId === draft.assigneeUserId);

  return (
    <div data-testid="planner-detail-task" data-readonly="false">
      <DetailHeader title="Task" onClose={onClose} />
      <form onSubmit={handleSubmit} aria-busy={isPending} noValidate>
        <div style={fieldStyle}>
          <label htmlFor={titleId} style={labelStyle}>
            Title
          </label>
          <input
            ref={titleInputRef}
            id={titleId}
            name="title"
            value={draft.title}
            onChange={(e) => updateDraft("title", e.target.value)}
            disabled={isPending}
            required
            aria-invalid={Boolean(fieldError) || actionRecovery?.field === "title"}
            aria-describedby={fieldError || actionRecovery ? errorId : undefined}
            style={inputStyle}
            data-testid="planner-task-title"
          />
        </div>

        <div style={fieldStyle}>
          <label htmlFor={descriptionId} style={labelStyle}>
            Description
          </label>
          <textarea
            id={descriptionId}
            name="description"
            value={draft.description}
            onChange={(e) => updateDraft("description", e.target.value)}
            disabled={isPending}
            rows={3}
            style={inputStyle}
            data-testid="planner-task-description"
          />
        </div>

        <div style={fieldStyle}>
          <label htmlFor={statusId} style={labelStyle}>
            Status
          </label>
          <select
            id={statusId}
            name="status"
            value={draft.status}
            onChange={(e) => updateDraft("status", e.target.value as PlannerTaskStatus)}
            disabled={isPending}
            style={inputStyle}
            data-testid="planner-task-status"
          >
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABEL[status]}
              </option>
            ))}
          </select>
        </div>

        <div style={fieldStyle}>
          <label htmlFor={assigneeId} style={labelStyle}>
            Assignee
          </label>
          {roleOnlyAssignment ? (
            <div id={assigneeId} data-testid="planner-task-assignee-role" style={mutedStyle}>
              {formatTaskAssigneeLabel(task, assignees)}
              <span style={{ display: "block", marginTop: "0.25rem" }}>
                Role assignment — pick a person from Timeline/Settings to change ownership.
              </span>
            </div>
          ) : (
            <select
              id={assigneeId}
              name="assignee"
              value={draft.assigneeUserId}
              onChange={(e) => updateDraft("assigneeUserId", e.target.value)}
              disabled={isPending || assigneesUnavailable}
              style={inputStyle}
              data-testid="planner-task-assignee"
            >
              <option value="">Unassigned</option>
              {assigneeMissingFromOptions ? (
                <option value={draft.assigneeUserId}>Assigned member</option>
              ) : null}
              {assignees.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.displayName}
                </option>
              ))}
            </select>
          )}
          {assigneesUnavailable && !roleOnlyAssignment ? (
            <p style={{ ...mutedStyle, margin: "0.25rem 0 0" }} role="status">
              Assignee list unavailable — other fields can still be saved.
            </p>
          ) : null}
        </div>

        {/* Priority is display-only — updateTask has no priority patch. */}
        <div style={rowStyle}>
          <span style={labelStyle}>Priority: </span>
          {task.priority}
        </div>
        {task.startDate ? (
          <div style={rowStyle}>
            <span style={labelStyle}>Start: </span>
            {task.startDate}
          </div>
        ) : null}
        {task.endDate ? (
          <div style={rowStyle}>
            <span style={labelStyle}>End: </span>
            {task.endDate}
          </div>
        ) : null}

        {fieldError ? (
          <p id={errorId} role="alert" style={errorStyle} data-testid="planner-task-field-error">
            {fieldError}
          </p>
        ) : null}

        {actionRecovery ? (
          <PlannerRecoveryAlert
            recovery={actionRecovery}
            pending={isPending}
            testId="planner-task-action-error"
            onRetry={
              actionRecovery.retrySafe || actionRecovery.kind === "unknown"
                ? () => handleSubmit()
                : undefined
            }
            onReview={actionRecovery.reviewLatest ? handleReviewLatest : undefined}
            onReload={actionRecovery.reloadLatest ? handleReloadLatest : undefined}
          />
        ) : null}

        <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
          <button
            type="submit"
            disabled={isPending}
            data-testid="planner-task-save"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
        </div>
        <p style={{ ...mutedStyle, marginTop: "0.5rem" }} aria-live="polite">
          {isPending ? "Saving task…" : null}
        </p>
      </form>

      <TaskScheduleShift
        task={task}
        disabled={isPending}
        onShifted={async () => {
          if (onRefreshSelection) await onRefreshSelection();
        }}
        onReviewLatest={async () => {
          const refreshed = onRefreshSelection ? await onRefreshSelection() : null;
          if (refreshed) applyRefreshedTask(refreshed, "keep-draft");
          router.refresh();
        }}
        onReloadLatest={async () => {
          const refreshed = onRefreshSelection ? await onRefreshSelection() : null;
          if (refreshed) applyRefreshedTask(refreshed, "accept-server");
          router.refresh();
        }}
      />
    </div>
  );
}

export function PlannerMemberDetail({ member, onClose }: { member: PlannerMember; onClose: () => void }) {
  return (
    <div data-testid="planner-detail-member">
      <DetailHeader title="Member" onClose={onClose} />
      <h3 style={{ margin: "0 0 0.5rem" }}>{member.displayName ?? "Unnamed member"}</h3>
      <div style={rowStyle}>
        <span style={labelStyle}>Role: </span>
        {member.role}
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>Access: </span>
        {ACCESS_LABEL[member.role]}
      </div>
    </div>
  );
}

const GATE_LABEL: Record<GateVisualState, string> = {
  approved: "Approved",
  ready: "Ready for approval",
  locked: "Locked",
  discarded: "Discarded",
};

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  manager: "Manager",
  contributor: "Contributor",
  viewer: "Viewer",
};

function gateColor(state: GateVisualState): string {
  switch (state) {
    case "approved":
      return "var(--color-approved)";
    case "ready":
      return "var(--color-review)";
    default:
      return "var(--color-text-muted)";
  }
}

// IPI-579 — phase Detail: date range, gate, tasks.
// IPI-483 — when AdaptivePanel supplies a persisted InstanceGate, render
// GateApprovalCard (Approve / Edit / Discard) instead of a read-only label.
export function PlannerPhaseDetail({
  phase,
  tasks,
  onClose,
  gate = null,
  instanceId,
  onRefreshSelection,
}: {
  phase: PlannerPhase;
  tasks: PlannerTask[];
  onClose: () => void;
  gate?: InstanceGate | null;
  instanceId?: string;
  onRefreshSelection?: () => void | Promise<void>;
}) {
  const { range, invalid } = rangeForPhase(tasks);
  const rangeLabel = invalid
    ? "Needs correction — task dates are out of order"
    : range
      ? `${planDateToISO(range.start)} → ${planDateToISO(range.end)}`
      : "Unscheduled";
  // Prefer persisted InstanceGate; fall back to task-completion heuristic
  // (never Approved) for unit tests that omit the gate prop.
  const gateState = gate
    ? gateUiToVisual(gate.status)
    : resolveGateVisualState(phase, tasks);
  const gateLabel = gate ? GATE_STATUS_LABEL[gate.status] : gateState ? GATE_LABEL[gateState] : null;

  return (
    <div data-testid="planner-detail-phase">
      <DetailHeader title="Phase" onClose={onClose} />
      <h3 style={{ margin: "0 0 0.5rem" }}>{phase.name}</h3>
      <div style={rowStyle}>
        <span style={labelStyle}>Date range: </span>
        {rangeLabel}
      </div>
      {gate && instanceId ? (
        <GateApprovalCard
          instanceId={instanceId}
          gate={gate}
          tasks={tasks}
          onMutated={onRefreshSelection}
        />
      ) : phase.gateType && gateState && gateLabel ? (
        <>
          <div style={rowStyle}>
            <span style={labelStyle}>Gate: </span>
            {phase.gateType}
            {phase.requiredRole ? ` — requires ${ROLE_LABEL[phase.requiredRole] ?? phase.requiredRole}` : ""}
          </div>
          <div style={rowStyle} data-testid="planner-detail-gate-state">
            <span style={labelStyle}>Gate state: </span>
            <span style={{ color: gateColor(gateState), fontWeight: 600 }}>{gateLabel}</span>
          </div>
        </>
      ) : null}
      <div style={{ ...rowStyle, fontWeight: 600 }}>
        Tasks ({tasks.length})
      </div>
      {tasks.length === 0 ? (
        <div style={rowStyle}>No tasks in this phase yet.</div>
      ) : (
        <ul style={{ margin: 0, paddingLeft: "1rem" }}>
          {tasks.map((task) => (
            <li key={task.id} style={{ margin: "0.25rem 0", fontSize: 13 }}>
              <span style={labelStyle}>{task.title}</span>
              <span style={{ color: "var(--color-text-muted)" }}>
                {" — "}
                {task.status}
                {formatTaskDateSpan(task)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
