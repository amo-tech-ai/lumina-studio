import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * IPI-725 — Server-side Sign Out (POST only).
 *
 * Matches Supabase’s Next.js tutorial: verify session → signOut → revalidate
 * layout → redirect. Uses scope "local" (this browser session only). GET is
 * intentionally omitted so third-party navigation cannot trigger logout.
 *
 * Cache-Control: private, no-store — auth redirects must not be edge-cached
 * on Cloudflare Workers / CDN.
 */
function redirectNoStore(url: URL, status = 303) {
  const res = NextResponse.redirect(url, { status });
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

export async function POST(request: NextRequest) {
  const login = new URL("/login", request.url);
  const fail = new URL("/app?signoutError=1", request.url);

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Explicit local scope — do not revoke every device unless product asks.
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) {
        return redirectNoStore(fail);
      }
    }

    revalidatePath("/", "layout");
    return redirectNoStore(login);
  } catch {
    // Do not pretend logout succeeded if session clear failed.
    return redirectNoStore(fail);
  }
}
