import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";

/** Service-role client for server-only lookups that bypass RLS after explicit access checks. */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase admin client is not configured: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return createClient<Database>(url, key, { auth: { persistSession: false } });
}
