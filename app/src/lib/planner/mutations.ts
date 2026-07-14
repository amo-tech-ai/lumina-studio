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

// SEC-004 cloaks "no account" vs. "not in org" behind one message so a caller
// can't probe registration status. The RPC only raises user_not_available
// post-migration (20260714211800, PR #390) — until that migration has landed
// everywhere this app code runs, it may still raise the pre-migration codes.
// Recognize all three but map them to the *same* message, so a schema that's
// momentarily behind never regresses to UNKNOWN_ERROR or reopens the leak.
const USER_UNAVAILABLE_CODES = ["user_not_available", "no_account_found", "user_not_in_org"];

function memberMutationError(fn: string, message: string): MutationResult<never> {
  const code =
    ["invalid_role", "instance_not_found", "insufficient_role_for_target", "insufficient_role",
      ...USER_UNAVAILABLE_CODES, "already_member", "member_not_found", "last_owner_protected"]
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
    insufficient_role_for_target: "Only an owner can perform that action.",
    user_not_available: "That person is not available to invite.",
    no_account_found: "That person is not available to invite.",
    user_not_in_org: "That person is not available to invite.",
    already_member: "That person is already a member.",
    member_not_found: "That member could not be found.",
    last_owner_protected: "A plan must always have at least one owner.",
  };

  return { ok: false, error: { code: USER_UNAVAILABLE_CODES.includes(code) ? "user_not_available" : code, message: humanMessage[code] } };
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
