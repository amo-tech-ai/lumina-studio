"use server";

// IPI-575 · PLN-DATA-001C — Server Actions consumed by IPI-577's Settings UI.
// Each action only authenticates the caller and delegates to mutations.ts —
// all authorization (role checks, org-membership, last-owner protection)
// lives inside the planner_* RPCs themselves, matching convert-deal.ts's
// "thin wrapper" precedent. Client code must never call these RPCs directly.

import { revalidatePath } from "next/cache";

import { inviteMember, removeAssignment, updateRole } from "@/lib/planner/mutations";
import type { PlannerRole } from "@/lib/planner/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { MemberAssignment } from "@/lib/planner/mutations";
import type { MutationResult } from "@/lib/planner/types";

async function authenticatedClient(): Promise<MutationResult<Awaited<ReturnType<typeof createSupabaseServerClient>>>> {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false, error: { code: "UNAUTHENTICATED", message: "Sign in to manage members." } };
  }

  return { ok: true, data: supabase };
}

export async function inviteMemberAction(
  instanceId: string,
  email: string,
  role: PlannerRole,
): Promise<MutationResult<MemberAssignment>> {
  const client = await authenticatedClient();
  if (!client.ok) return client;

  const result = await inviteMember({ instanceId, email, role }, client.data);
  if (result.ok) revalidatePath(`/app/planner/${instanceId}/settings`);
  return result;
}

export async function updateMemberRoleAction(
  instanceId: string,
  userId: string,
  role: PlannerRole,
): Promise<MutationResult<MemberAssignment>> {
  const client = await authenticatedClient();
  if (!client.ok) return client;

  const result = await updateRole({ instanceId, userId, role }, client.data);
  if (result.ok) revalidatePath(`/app/planner/${instanceId}/settings`);
  return result;
}

export async function removeMemberAction(
  instanceId: string,
  userId: string,
): Promise<MutationResult<MemberAssignment>> {
  const client = await authenticatedClient();
  if (!client.ok) return client;

  const result = await removeAssignment({ instanceId, userId }, client.data);
  if (result.ok) revalidatePath(`/app/planner/${instanceId}/settings`);
  return result;
}
