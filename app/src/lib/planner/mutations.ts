// IPI-575 · PLN-DATA-001C — thin error-mapping wrappers around the 3
// planner_* member-mutation RPCs (migration 20260714100000). Follows the
// same idiom as app/src/lib/crm/convert-deal.ts: authorization lives inside
// the SECURITY DEFINER function, this layer only maps `raise exception`
// substrings to a typed result — but returns Planner's own MutationResult<T>
// (no `status` field), matching IPI-536's recorded decision that Planner
// mutations don't wrap an external API.

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";

import type { MutationResult, PlannerRole } from "./types";

type Db = SupabaseClient<Database>;

export type MemberAssignment = {
  id: string;
  instanceId: string;
  userId: string;
  role: PlannerRole;
};

function toAssignment(row: { id: string; instance_id: string; user_id: string; role: string }): MemberAssignment {
  return {
    id: row.id,
    instanceId: row.instance_id,
    userId: row.user_id,
    role: row.role as PlannerRole,
  };
}

function memberMutationError(fn: string, message: string): MutationResult<never> {
  const code =
    ["invalid_role", "instance_not_found", "insufficient_role_for_target", "insufficient_role",
      "user_not_available", "user_not_in_org", "already_member", "member_not_found", "last_owner_protected"]
      .find((known) => message.includes(known)) ?? "UNKNOWN_ERROR";

  if (code === "UNKNOWN_ERROR") {
    // Never forward the raw Postgres message — same idiom as convert-deal.ts.
    console.error(`[planner/mutations] ${fn} rpc failed:`, message);
    return { ok: false, error: { code: "UNKNOWN_ERROR", message: "The request could not be completed." } };
  }

  const humanMessage: Record<string, string> = {
    invalid_role: "That role can't be assigned here.",
    instance_not_found: "This plan could not be found.",
    insufficient_role: "You don't have permission to do that.",
    insufficient_role_for_target: "Only an owner can change or remove that member.",
    user_not_available: "That person is not available to invite.",
    user_not_in_org: "That person isn't part of your organization.",
    already_member: "That person is already a member.",
    member_not_found: "That member could not be found.",
    last_owner_protected: "A plan must always have at least one owner.",
  };

  return { ok: false, error: { code, message: humanMessage[code] } };
}

export async function inviteMember(
  { instanceId, email, role }: { instanceId: string; email: string; role: PlannerRole },
  client: Db,
): Promise<MutationResult<MemberAssignment>> {
  const { data, error } = await client
    .rpc("planner_invite_member", { p_instance_id: instanceId, p_email: email, p_role: role })
    .single();

  if (error) return memberMutationError("planner_invite_member", error.message ?? "");
  if (!data) return memberMutationError("planner_invite_member", "no row returned");

  return { ok: true, data: toAssignment(data) };
}

export async function updateRole(
  { instanceId, userId, role }: { instanceId: string; userId: string; role: PlannerRole },
  client: Db,
): Promise<MutationResult<MemberAssignment>> {
  const { data, error } = await client
    .rpc("planner_update_role", { p_instance_id: instanceId, p_target_user_id: userId, p_new_role: role })
    .single();

  if (error) return memberMutationError("planner_update_role", error.message ?? "");
  if (!data) return memberMutationError("planner_update_role", "no row returned");

  return { ok: true, data: toAssignment(data) };
}

export async function removeAssignment(
  { instanceId, userId }: { instanceId: string; userId: string },
  client: Db,
): Promise<MutationResult<MemberAssignment>> {
  const { data, error } = await client
    .rpc("planner_remove_assignment", { p_instance_id: instanceId, p_target_user_id: userId })
    .single();

  if (error) return memberMutationError("planner_remove_assignment", error.message ?? "");
  if (!data) return memberMutationError("planner_remove_assignment", "no row returned");

  return { ok: true, data: toAssignment(data) };
}
