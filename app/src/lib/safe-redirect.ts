// Redirect guard for the login `redirect` param. Scoped to the routes the auth
// gate actually protects: `/app` and `/app/*`, plus `/onboarding` and
// `/onboarding/*` (IPI-833 — a sibling route group, so it does not carry the
// /app prefix). Everything else — `/`, `/login`, marketing routes, external
// URLs, protocol-relative (`//host`), empty — falls back to /app.
//
// Keep this in sync with the isProtectedRoute check in src/middleware.ts. A
// route the middleware gates but this rejects is worse than an ungated one: the
// user signs in successfully and is silently dropped somewhere they did not ask
// for, with no error to explain it.
const ALLOWED_PREFIXES = ["/app", "/onboarding"] as const;

export function safeRedirect(path: string | null | undefined): string {
  if (!path || path.startsWith("//")) return "/app";
  for (const prefix of ALLOWED_PREFIXES) {
    if (path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}?`)) {
      return path;
    }
  }
  return "/app";
}
