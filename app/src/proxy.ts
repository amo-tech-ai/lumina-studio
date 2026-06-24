import { NextResponse, type NextRequest } from "next/server";
import { accessTokenFromCookieString } from "@/lib/auth";

// IPI2-127 (AIOR-002b) — operator page gate. Blocks unauthenticated access to
// /app/* by requiring a Supabase session cookie that DECODES to a JWT-shaped
// access token — a cookie of the right *name* alone is trivially spoofable.
// Cryptographic signature validation stays at the runtime boundary
// (requireOperator in the API route); a network getUser on every navigation would
// add latency and needs the @supabase/ssr session wiring (remaining IPI2-127 work).
//
// Flag-gated by OPERATOR_AUTH_ENABLED so it stays OFF until login creates a real
// session — turning it on before that would lock every operator out.
export function proxy(request: NextRequest) {
  if (process.env.OPERATOR_AUTH_ENABLED !== "true") {
    return NextResponse.next();
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
    // Preserve the full original target (path + query) so the user lands back
    // exactly where they were after login.
    url.searchParams.set(
      "redirect",
      request.nextUrl.pathname + request.nextUrl.search,
    );
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
