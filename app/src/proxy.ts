import { NextResponse, type NextRequest } from "next/server";

// IPI2-127 (AIOR-002b) — operator page gate. Blocks unauthenticated access to
// the operator app (/app/*) by checking for a Supabase session cookie and
// redirecting to /login otherwise. Token VALIDATION happens server-side in the
// runtime route (src/lib/auth.ts); this middleware is the cheap presence gate.
//
// Flag-gated by OPERATOR_AUTH_ENABLED so it stays OFF until the login flow
// actually creates a Supabase session — turning it on before that would lock
// every operator out. Flip to "true" once login is wired (remaining IPI2-127 work).
export function proxy(request: NextRequest) {
  if (process.env.OPERATOR_AUTH_ENABLED !== "true") {
    return NextResponse.next();
  }

  const hasSession = request.cookies
    .getAll()
    .some((c) => /^sb-.*-auth-token/.test(c.name));

  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
