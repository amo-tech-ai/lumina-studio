"use client";

// IPI-551 · PLN-S4b — presentational Detail views AdaptivePanel publishes
// into the shared IntelligencePanel via useSetIntelligenceDetail. Plain
// legibility only, no pixel-parity work: the real design pass lands with
// the ticket that wires an actual trigger (IPI-579/580/581/582).

import type { CSSProperties } from "react";

import type { GateVisualState } from "@/lib/planner/planner-view-model";
import type { PlannerMember, PlannerPhase, PlannerRole, PlannerTask } from "@/lib/planner/types";

// Duplicated from member-table.tsx's ACCESS_LABEL (not exported there, and
// this component shouldn't widen that file's public surface just to reuse
// a 4-line map — see IPI-551 spec).
const ACCESS_LABEL: Record<PlannerRole, string> = {
  owner: "Full access",
  manager: "Edit access",
  contributor: "Contribute",
  viewer: "View only",
};

const rowStyle: CSSProperties = { margin: "0.25rem 0" };
const labelStyle: CSSProperties = { fontWeight: 600 };

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

export function PlannerTaskDetail({ task, onClose }: { task: PlannerTask; onClose: () => void }) {
  return (
    <div data-testid="planner-detail-task">
      <DetailHeader title="Task" onClose={onClose} />
      <h3 style={{ margin: "0 0 0.5rem" }}>{task.title}</h3>
      <div style={rowStyle}>
        <span style={labelStyle}>Status: </span>
        {task.status}
      </div>
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

// IPI-579 · PLN-S1B — read-only phase Detail: the phase's date range, status,
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
  const dated = tasks.filter((task) => task.startDate && task.endDate);
  const earliest = dated.reduce<string | null>((min, task) => {
    if (task.startDate === null) return min;
    return min === null || task.startDate < min ? task.startDate : min;
  }, null);
  const latest = dated.reduce<string | null>((max, task) => {
    if (task.endDate === null) return max;
    return max === null || task.endDate > max ? task.endDate : max;
  }, null);

  return (
    <div data-testid="planner-detail-phase">
      <DetailHeader title="Phase" onClose={onClose} />
      <h3 style={{ margin: "0 0 0.5rem" }}>{phase.name}</h3>
      <div style={rowStyle}>
        <span style={labelStyle}>Date range: </span>
        {earliest && latest ? `${earliest} → ${latest}` : "Unscheduled"}
      </div>
      {phase.gateType ? (
        <>
          <div style={rowStyle}>
            <span style={labelStyle}>Gate: </span>
            {phase.gateType}
            {phase.requiredRole ? ` — requires ${ROLE_LABEL[phase.requiredRole] ?? phase.requiredRole}` : ""}
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Gate state: </span>
            {tasks.length === 0 ? (
              "Locked"
            ) : (
              <span
                style={{
                  color: gateColor(tasks.every((task) => task.status === "done") ? "approved" : "ready"),
                  fontWeight: 600,
                }}
              >
                {tasks.every((task) => task.status === "done") ? GATE_LABEL.approved : GATE_LABEL.ready}
              </span>
            )}
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
                {task.startDate && task.endDate ? ` (${task.startDate} → ${task.endDate})` : " (no dates)"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
