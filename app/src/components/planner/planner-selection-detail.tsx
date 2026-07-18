"use client";

// IPI-551 · PLN-S4b — presentational Detail views AdaptivePanel publishes
// into the shared IntelligencePanel via useSetIntelligenceDetail. Plain
// legibility only, no pixel-parity work: the real design pass lands with
// the ticket that wires an actual trigger (IPI-579/580/581/582).

import type { CSSProperties } from "react";

import type { PlannerMember, PlannerRole, PlannerTask } from "@/lib/planner/types";

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
