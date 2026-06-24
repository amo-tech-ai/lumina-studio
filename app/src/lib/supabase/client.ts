import { createBrowserClient } from "@supabase/ssr";

// Browser Supabase client for the login flow (IPI2-127). Uses the public anon
// key (RLS-protected, safe to expose). On sign-in it writes the session to
// sb-<ref>-auth-token cookies that the /app/* proxy gate + CopilotKit runtime
// then read and validate server-side.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function createSupabaseBrowserClient() {
  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  return createBrowserClient(url, anonKey);
}
