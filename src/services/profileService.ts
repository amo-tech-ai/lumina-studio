import type { User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

export type EnsureProfileResult =
  | { ok: true; created: boolean }
  | { ok: false; error: string };

/**
 * Ensures a profiles row exists for the authenticated user.
 * Idempotent: safe on signup, sign-in, and session restore.
 */
export async function ensureProfile(user: User): Promise<EnsureProfileResult> {
  const email = user.email?.trim();
  if (!email) {
    return { ok: false, error: "Authenticated user is missing an email address." };
  }

  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) {
    return { ok: false, error: selectError.message };
  }

  if (existing) {
    if (existing.email !== email) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ email, updated_at: new Date().toISOString() })
        .eq("id", user.id);

      if (updateError) {
        return { ok: false, error: updateError.message };
      }
    }
    return { ok: true, created: false };
  }

  const { error: insertError } = await supabase.from("profiles").insert({
    id: user.id,
    email,
  });

  if (insertError) {
    // Race: another tab may have inserted first
    if (insertError.code === "23505") {
      return { ok: true, created: false };
    }
    return { ok: false, error: insertError.message };
  }

  return { ok: true, created: true };
}
