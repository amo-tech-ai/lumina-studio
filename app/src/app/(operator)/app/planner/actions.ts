"use server";

// IPI-653 · PLN-DATA-003 — hub-level Server Action for planner instance
// creation. Follows [instanceId]/actions.ts's "thin wrapper" precedent:
// authenticate, delegate to mutations.ts, revalidate on success. All
// authorization (org role, workflow/entity ownership) and idempotency lives
// inside the planner_create_instance RPC itself — this layer never
// duplicates that logic. Lives at the hub level (not under [instanceId])
// because no instanceId exists yet when this action runs.
//
// idempotencyKey is caller-supplied, matching shiftTaskAction/updateTaskAction:
// the client generates it once per logical creation attempt and must reuse
// the same key on retry (network failure, double-submit) — a fresh
// server-generated key on every call would defeat the RPC's replay contract.

import { revalidatePath } from "next/cache";

import { createInstance, type CreateInstanceResult } from "@/lib/planner/mutations";
import type { CreateInstanceParams, MutationResult } from "@/lib/planner/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function authenticatedClient(): Promise<MutationResult<Awaited<ReturnType<typeof createSupabaseServerClient>>>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false, error: { code: "UNAUTHENTICATED", message: "Sign in to create a plan." } };
  }

  return { ok: true, data: supabase };
}

export async function createInstanceAction(
  params: CreateInstanceParams,
  idempotencyKey: string,
): Promise<MutationResult<CreateInstanceResult>> {
  const client = await authenticatedClient();
  if (!client.ok) return client;

  const result = await createInstance({ ...params, idempotencyKey }, client.data);
  if (result.ok) {
    revalidatePath("/app/planner");
    revalidatePath("/app/planner/dashboard");
  }
  return result;
}
