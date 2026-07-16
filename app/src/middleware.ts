import { NextResponse, type NextRequest } from "next/server";
import { accessTokenFromCookieString } from "@/lib/auth";
import { copyResponseCookies, updateSession } from "@/lib/supabase/session";

// IPI2-127 (AIOR-002b) — operator page gate. Blocks unauthenticated access to
// /app/* by requiring a Supabase session cookie that DECODES to a JWT-shaped
// access token — a cookie of the right *name* alone is trivially spoofable.
// Session validation at API routes uses withOperatorAuth (Supabase getUser).
//
// CF-MIG-110: OpenNext on Cloudflare requires Edge middleware (not proxy.ts Node
// runtime). Logic is Edge-safe — @supabase/ssr cookie refresh + JWT shape check only.
//
// IPI-468: Enforced on production Worker runtimes (NODE_ENV=production) even when
// OPERATOR_AUTH_ENABLED is unset/false — preview must never expose /app without auth.
// Local `next dev` keeps the gate off until OPERATOR_AUTH_ENABLED=true.
//
// All matched routes also run updateSession() so OAuth PKCE cookies refresh
// correctly across marketing + operator surfaces.
export async function middleware(request: NextRequest) {
  const sessionResponse = await updateSession(request);

  const { isOperatorAuthEnforced } = await import("@/lib/operator-gate");
  if (!isOperatorAuthEnforced()) {
    return sessionResponse;
  }

  const isOperatorRoute =
    request.nextUrl.pathname === "/app" ||
    request.nextUrl.pathname.startsWith("/app/");

  if (!isOperatorRoute) {
    return sessionResponse;
  }

  const cookieString = request.cookies
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  const token = accessTokenFromCookieString(cookieString);
  const hasValidSession = !!token && token.split(".").length === 3;

  if (!hasValidSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set(
      "redirect",
      request.nextUrl.pathname + request.nextUrl.search,
    );
    const redirect = NextResponse.redirect(url);
    copyResponseCookies(sessionResponse, redirect);
    return redirect;
  }

  return sessionResponse;
}

export const config = {
  matcher: [
    /*
     * Match all paths except static assets so Supabase session cookies refresh
     * on /login, /auth/callback, /app/*, and API routes.
     * Keep in sync with tests in src/test/operator-middleware-contract.test.ts.
     */
    // Exclude Sentry tunnelRoute (/monitoring) so auth/session logic does not intercept it.
    "/((?!monitoring|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
