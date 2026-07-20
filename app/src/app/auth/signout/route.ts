import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * IPI-725 — Server-side Sign Out. Clears Supabase SSR auth cookies, then
 * redirects to /login. Same session store the login form writes via the
 * browser client — no new auth mechanism.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch {
    // Still send the operator to login; middleware will bounce if cookies linger.
  }
  return NextResponse.redirect(new URL("/login", request.url));
}
