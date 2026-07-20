import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * IPI-725 — Server-side Sign Out. Clears Supabase SSR auth cookies when a
 * session exists, then redirects to /login. Unauthenticated hits skip signOut
 * (idempotent redirect only — no new auth mechanism).
 */
export async function GET(request: NextRequest) {
  const login = NextResponse.redirect(new URL("/login", request.url));
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.auth.signOut();
    }
  } catch {
    // Still send the operator to login; middleware will bounce if cookies linger.
  }
  return login;
}
