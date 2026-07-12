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

async function fetchAssignments(
  instanceId: string,
  supabase: Db,
): Promise<PlannerAssignment[]> {
  const { data, error } = await supabase
    .schema("planner")
    .from("assignments")
    .select("id, instance_id, user_id, role, permissions")
    .eq("instance_id", instanceId);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    instanceId: row.instance_id,
    userId: row.user_id,
    role: row.role as PlannerAssignment["role"],
    permissions: row.permissions as Record<string, unknown> | null,
  }));
}

export async function getEffectivePermissions(
  userId: string,
  instanceId: string,
  supabase: Db,
): Promise<EffectivePermissions> {
  const assignments = await fetchAssignments(instanceId, supabase);
  return engine.getEffectivePermissions(userId, assignments, instanceId);
}
