import { createClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";
import type { Database } from "@/types/supabase";

export const supabase = createClient<Database>(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);

/** Lightweight connectivity check (no auth required). */
export async function pingSupabase(): Promise<boolean> {
  const { error } = await supabase.from("tasks").select("id").limit(1);
  return !error;
}
