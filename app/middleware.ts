// Next.js middleware — wires the operator auth gate from src/proxy.ts.
// IPI2-127: Blocks unauthenticated /app/* access when OPERATOR_AUTH_ENABLED=true.
//
// ponytail: matcher MUST be literal here — Next.js static analysis rejects imported
// values. Parity with src/proxy.ts enforced in src/middleware.test.ts.
export { proxy as default } from "./src/proxy";

export const config = {
  matcher: [
    /*
     * Match all paths except static assets so Supabase session cookies refresh
     * on /login, /auth/callback, /app/*, and API routes.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
