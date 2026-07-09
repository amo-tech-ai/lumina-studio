import { NextResponse, type NextRequest } from "next/server";
import { accessTokenFromCookieString } from "@/lib/auth";
import { copyResponseCookies, updateSession } from "@/lib/supabase/session";

// IPI2-127 (AIOR-002b) — operator page gate. Blocks unauthenticated access to
// /app/* by requiring a Supabase session cookie that DECODES to a JWT-shaped
// access token — a cookie of the right *name* alone is trivially spoofable.
// Cryptographic signature validation stays at the runtime boundary
// (requireOperator in the API route); a network getUser on every navigation would
// add latency and needs the @supabase/ssr session wiring (remaining IPI2-127 work).
//
// CF-MIG-110: OpenNext on Cloudflare requires Edge middleware (not proxy.ts Node
// runtime). Logic is Edge-safe — @supabase/ssr cookie refresh + JWT shape check only.
//
// Flag-gated by OPERATOR_AUTH_ENABLED so it stays OFF until login creates a real
// session — turning it on before that would lock every operator out.
//
// All matched routes also run updateSession() so OAuth PKCE cookies refresh
// correctly across marketing + operator surfaces.
export async function middleware(request: NextRequest) {
  const sessionResponse = await updateSession(request);

  if (process.env.OPERATOR_AUTH_ENABLED !== "true") {
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
