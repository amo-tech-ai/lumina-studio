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
import {
  addPlanDays,
  daysBetween,
  parsePlanDate,
  planDateToISO,
} from "@/lib/planner/planner-date-utils";
import {
  rangeForPhase,
  resolveGateVisualState,
  type GateVisualState,
} from "@/lib/planner/planner-view-model";
import type {
  PlannerMember,
  PlannerPhase,
  PlannerRole,
  PlannerTask,
  PlannerTaskStatus,
} from "@/lib/planner/types";

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

function TaskScheduleShift({
  task,
  disabled,
  onShifted,
}: {
  task: PlannerTask;
  disabled: boolean;
  onShifted: () => Promise<void>;
}) {
  const router = useRouter();
  const [proposedDelta, setProposedDelta] = useState<number | null>(null);
  const [pickerDate, setPickerDate] = useState(task.startDate ?? "");
  const [shiftError, setShiftError] = useState<{ code: string; message: string } | null>(null);
  const [isShifting, startShift] = useTransition();
  const shiftKeyRef = useRef<string | null>(null);

  const start = parsePlanDate(task.startDate);
  const canShift = Boolean(start);
  const preview = proposedDelta !== null ? proposeShift(task, proposedDelta) : null;

  function proposeDelta(delta: number) {
    shiftKeyRef.current = null;
    setShiftError(null);
    setProposedDelta(delta);
  }

  function proposeFromPicker(iso: string) {
    setPickerDate(iso);
    shiftKeyRef.current = null;
    setShiftError(null);
    const next = parsePlanDate(iso);
    if (!start || !next) {
      setProposedDelta(null);
      return;
    }
    setProposedDelta(daysBetween(start, next));
  }

  function cancelProposal() {
    setProposedDelta(null);
    setShiftError(null);
    shiftKeyRef.current = null;
    setPickerDate(task.startDate ?? "");
  }

  function confirmShift() {
    if (proposedDelta === null || proposedDelta === 0 || !canShift || isShifting || disabled) return;
    shiftKeyRef.current ??= crypto.randomUUID();
    const idempotencyKey = shiftKeyRef.current;
    setShiftError(null);

    startShift(async () => {
      const result = await shiftTaskAction(
        task.instanceId,
        task.id,
        proposedDelta,
        idempotencyKey,
      );
      if (!result.ok) {
        setShiftError({ code: result.error.code, message: result.error.message });
        return;
      }
      shiftKeyRef.current = null;
      setProposedDelta(null);
      await onShifted();
      router.refresh();
    });
  }

  if (!canShift) {
    return (
      <div style={{ marginTop: "1rem" }} data-testid="planner-task-schedule">
        <div style={labelStyle}>Schedule</div>
        <p style={mutedStyle}>Unscheduled — add dates before moving this task.</p>
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

      {shiftError ? (
        <div role="alert" style={{ ...errorStyle, marginTop: "0.5rem" }} data-testid="planner-task-shift-error">
          <p style={{ margin: 0 }}>{shiftError.message}</p>
        </div>
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
  const [actionError, setActionError] = useState<{ code: string; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  // Mint once per submit attempt; reuse on retry of the same attempt. Cleared
  // on success or when the draft changes (new logical mutation).
  const idempotencyKeyRef = useRef<string | null>(null);
  // Sync draft when the selected task identity changes, or when the parent
  // CAS token advances (AdaptivePanel re-resolve). Do not key this on local
  // expectedUpdatedAt — Reload updates that before props catch up.
  const taskIdRef = useRef(task.id);
  const taskUpdatedAtRef = useRef(task.updatedAt);

  useEffect(() => {
    const sameId = task.id === taskIdRef.current;
    const sameUpdatedAt = task.updatedAt === taskUpdatedAtRef.current;
    if (sameId && sameUpdatedAt) return;
    taskIdRef.current = task.id;
    taskUpdatedAtRef.current = task.updatedAt;
    setDraft(draftFromTask(task));
    setExpectedUpdatedAt(task.updatedAt ?? "");
    setFieldError(null);
    setActionError(null);
    idempotencyKeyRef.current = null;
  }, [task]);

  function updateDraft<K extends keyof Draft>(key: K, value: Draft[K]) {
    idempotencyKeyRef.current = null;
    setDraft((prev) => ({ ...prev, [key]: value }));
    setFieldError(null);
    if (actionError?.code !== "STALE_VERSION") setActionError(null);
  }

  function handleReloadLatest() {
    startTransition(async () => {
      const refreshed = onRefreshSelection ? await onRefreshSelection() : null;
      if (refreshed) {
        taskIdRef.current = refreshed.task.id;
        taskUpdatedAtRef.current = refreshed.task.updatedAt;
        setDraft(draftFromTask(refreshed.task));
        setExpectedUpdatedAt(refreshed.task.updatedAt ?? "");
        setActionError(null);
        setFieldError(null);
        idempotencyKeyRef.current = null;
      }
      // Pick up revalidated Timeline/Kanban/List/Now&Next RSC props.
      router.refresh();
    });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canUpdateTasks || isPending) return;

    const title = draft.title.trim();
    if (!title) {
      setFieldError("Title is required.");
      return;
    }
    if (!expectedUpdatedAt) {
      setActionError({
        code: "INVALID_INPUT",
        message: "This task is missing a version token. Reload and try again.",
      });
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
    setActionError(null);

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
          setActionError({ code: result.error.code, message: result.error.message });
          return;
        }

        idempotencyKeyRef.current = null;
        taskIdRef.current = task.id;
        taskUpdatedAtRef.current = result.data.updatedAt;
        setExpectedUpdatedAt(result.data.updatedAt);
        if (onRefreshSelection) await onRefreshSelection();
        // revalidatePath alone does not update mounted client views — refresh RSC props.
        router.refresh();
      } catch {
        // Transport / server-action rejection — keep idempotency key for retry.
        setActionError({
          code: "UNKNOWN_ERROR",
          message: "The request could not be completed.",
        });
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
  const isStale = actionError?.code === "STALE_VERSION";
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
            id={titleId}
            name="title"
            value={draft.title}
            onChange={(e) => updateDraft("title", e.target.value)}
            disabled={isPending}
            required
            aria-invalid={Boolean(fieldError)}
            aria-describedby={fieldError ? errorId : undefined}
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

        {actionError ? (
          <div role="alert" style={{ ...errorStyle, marginTop: "0.5rem" }} data-testid="planner-task-action-error">
            <p style={{ margin: 0 }}>{actionError.message}</p>
            {isStale ? (
              <button
                type="button"
                onClick={handleReloadLatest}
                disabled={isPending}
                style={{ marginTop: "0.5rem" }}
                data-testid="planner-task-reload"
              >
                Reload latest
              </button>
            ) : null}
          </div>
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

// IPI-579 — read-only phase Detail: the phase's date range, status,
// gate state + required role, and its task list. Pure presentation of data
// already resolved by resolvePlannerSelectionAction; nothing here mutates.
export function PlannerPhaseDetail({
  phase,
  tasks,
  onClose,
}: {
  phase: PlannerPhase;
  tasks: PlannerTask[];
  onClose: () => void;
}) {
  const { range, invalid } = rangeForPhase(tasks);
  const rangeLabel = invalid
    ? "Needs correction — task dates are out of order"
    : range
      ? `${planDateToISO(range.start)} → ${planDateToISO(range.end)}`
      : "Unscheduled";
  // Phase 1: no persisted approval — never claim Approved from task status.
  const gateState = resolveGateVisualState(phase, tasks);

  return (
    <div data-testid="planner-detail-phase">
      <DetailHeader title="Phase" onClose={onClose} />
      <h3 style={{ margin: "0 0 0.5rem" }}>{phase.name}</h3>
      <div style={rowStyle}>
        <span style={labelStyle}>Date range: </span>
        {rangeLabel}
      </div>
      {phase.gateType && gateState ? (
        <>
          <div style={rowStyle}>
            <span style={labelStyle}>Gate: </span>
            {phase.gateType}
            {phase.requiredRole ? ` — requires ${ROLE_LABEL[phase.requiredRole] ?? phase.requiredRole}` : ""}
          </div>
          <div style={rowStyle} data-testid="planner-detail-gate-state">
            <span style={labelStyle}>Gate state: </span>
            <span style={{ color: gateColor(gateState), fontWeight: 600 }}>{GATE_LABEL[gateState]}</span>
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
