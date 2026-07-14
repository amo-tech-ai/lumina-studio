// IPI-536 — thin DB-aware wrapper around PlannerEngine.getEffectivePermissions
// (engine.ts:317). This must stay a wrapper, not a second implementation: the
// engine method is pure (assignments passed in), this function's only job is
// fetching those assignments from Supabase before delegating.

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";

import { PlannerEngine } from "./engine";
import type { PlannerAssignment } from "./types";

type Db = SupabaseClient<Database>;

export type EffectivePermissions = ReturnType<
  PlannerEngine["getEffectivePermissions"]
>;

const engine = new PlannerEngine();

// planner.assignments' RLS policy (assignments_select_org) requires the
// CALLER to already be manager+ before they can SELECT any row at all —
// including their own. A contributor/viewer querying this table directly
// with their own RLS-scoped client would get zero rows back and be
// incorrectly treated as unassigned. public.planner_get_my_assignment is a
// SECURITY DEFINER RPC hard-scoped to auth.uid() that answers "what is MY
// OWN role here" regardless of that manager-only policy (found in PR #347
// review; see migration 20260712235000_planner_get_my_assignment_rpc.sql).
async function fetchMyAssignment(
  instanceId: string,
  supabase: Db,
): Promise<PlannerAssignment | null> {
  const { data, error } = await supabase.rpc("planner_get_my_assignment", {
    p_instance_id: instanceId,
  });

  if (error) throw error;

  const row = data?.[0];
  if (!row) return null;

  return {
    id: row.id,
    instanceId: row.instance_id,
    userId: row.user_id,
    role: row.role as PlannerAssignment["role"],
    permissions: row.permissions as Record<string, unknown> | null,
  };
}

// No `userId` parameter: `planner_get_my_assignment` is hardcoded to
// auth.uid(), so this can only ever answer "what are MY OWN permissions" —
// accepting a userId here would silently ignore any value that didn't match
// the current session, a contract mismatch caught by PR #347 review. The
// engine call still needs a userId to match `assignments` against; deriving
// it from the fetched row (rather than trusting a caller-supplied one) keeps
// that match meaningful without reopening the mismatch this fixes.
export async function getEffectivePermissions(
  instanceId: string,
  supabase: Db,
): Promise<EffectivePermissions> {
  const assignment = await fetchMyAssignment(instanceId, supabase);
  const assignments = assignment ? [assignment] : [];
  const userId = assignment?.userId ?? "";
  return engine.getEffectivePermissions(userId, assignments, instanceId);
}
