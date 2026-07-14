"use client";

// IPI-577 · PLN-S6 — member table for /app/planner/[instanceId]/settings.
// Access-roles-only columns (no production-role column, no invitation
// lifecycle state — a member either exists in this table immediately or
// the invite failed with "No account found").

import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { removeMemberAction, updateMemberRoleAction } from "@/app/(operator)/app/planner/[instanceId]/settings/actions";
import type { PlannerMember, PlannerRole } from "@/lib/planner/types";

import { InviteMemberDialog } from "./invite-member-dialog";
import styles from "./member-table.module.css";

const ACCESS_LABEL: Record<PlannerRole, string> = {
  owner: "Full access",
  manager: "Edit access",
  contributor: "Contribute",
  viewer: "View only",
};

// Never 'owner' — matches planner_invite_member/planner_update_role's own
// invalid_role rejection (owner status only transfers via a separate,
// explicit action, out of this ticket's scope).
const ALL_EDITABLE_ROLES: PlannerRole[] = ["manager", "contributor", "viewer"];

type Props = {
  instanceId: string;
  members: PlannerMember[];
  role: PlannerRole | null;
  currentUserId: string;
};

export function MemberTable({ instanceId, members, role, currentUserId }: Props) {
  const canManage = role === "owner" || role === "manager";
  const ownerCount = members.filter((m) => m.role === "owner").length;

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        {canManage ? <InviteMemberDialog instanceId={instanceId} callerRole={role} /> : null}
      </div>

      <div className={styles.grid} role="table" aria-label="Plan members">
        <div className={styles.row} role="row">
          <div className={styles.headCell} role="columnheader">Name</div>
          <div className={styles.headCell} role="columnheader">Role</div>
          <div className={styles.headCell} role="columnheader">Access</div>
          <div className={styles.headCell} role="columnheader" aria-label="Actions" />
        </div>

        {members.map((member) => (
          <MemberRow
            key={member.id}
            instanceId={instanceId}
            member={member}
            canManage={canManage}
            callerRole={role}
            isSelf={member.userId === currentUserId}
            isLastOwner={member.role === "owner" && ownerCount <= 1}
          />
        ))}
      </div>
    </div>
  );
}

function MemberRow({
  instanceId,
  member,
  canManage,
  callerRole,
  isSelf,
  isLastOwner,
}: {
  instanceId: string;
  member: PlannerMember;
  canManage: boolean;
  callerRole: PlannerRole | null;
  isSelf: boolean;
  isLastOwner: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startTransition] = useTransition();

  // Owner rows and the caller's own row never show edit controls: owner role
  // can't be changed here (matches insufficient_role_for_target server-side),
  // and self-elevation/self-demotion is blocked in the UI rather than only
  // relying on the RPC's own self-elevation guard.
  //
  // A peer manager's row is also off-limits to a non-owner caller — verified
  // live: both planner_update_role and planner_remove_assignment reject
  // v_target_role IN ('owner', 'manager') unless the caller is owner, not
  // just target='owner'. Without this, a manager caller would see working-
  // looking role-select/Remove controls on a peer manager that always fail.
  const showControls =
    canManage && member.role !== "owner" && !isSelf && (member.role !== "manager" || callerRole === "owner");

  // SEC-003b (migration 20260714211800): planner_update_role rejects
  // p_new_role='manager' from anyone below owner, regardless of the target's
  // current role — a manager-level caller offered "manager" here would only
  // ever get insufficient_role_for_target on submit.
  const editableRoles =
    callerRole === "owner" ? ALL_EDITABLE_ROLES : ALL_EDITABLE_ROLES.filter((r) => r !== "manager");

  function handleRoleChange(next: string) {
    setError(null);
    startTransition(async () => {
      const result = await updateMemberRoleAction(instanceId, member.userId, next as PlannerRole);
      if (!result.ok) setError(result.error.message);
    });
  }

  function handleRemove() {
    setError(null);
    startTransition(async () => {
      const result = await removeMemberAction(instanceId, member.userId);
      if (!result.ok) setError(result.error.message);
    });
  }

  return (
    <div className={styles.row} role="row">
      <div className={styles.cell} role="cell">{member.displayName ?? "Unnamed member"}</div>
      <div className={styles.cell} role="cell">
        <Badge variant="secondary">{member.role}</Badge>
      </div>
      <div className={styles.cell} role="cell">{ACCESS_LABEL[member.role]}</div>
      <div className={styles.cell} role="cell">
        {showControls ? (
          <div className={styles.actions}>
            <Select value={member.role} onValueChange={handleRoleChange} disabled={isSaving}>
              <SelectTrigger className={styles.roleSelect} aria-label={`Change role for ${member.displayName ?? "member"}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {editableRoles.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
              disabled={isSaving}
            >
              Remove
            </Button>
          </div>
        ) : (
          isLastOwner && <span className={styles.ownerLock} title="A plan must always have at least one owner">Owner</span>
        )}
        {error ? <p role="alert" className={styles.rowError}>{error}</p> : null}
      </div>
    </div>
  );
}
