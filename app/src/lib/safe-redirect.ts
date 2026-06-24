// Redirect guard for the login `redirect` param. Scoped to the operator app to
// match the auth-gate contract (the proxy only ever emits /app/* targets): only
// `/app` and `/app/*` are allowed. Everything else — `/`, `/login`, marketing
// routes, external URLs, protocol-relative (`//host`), empty — falls back to /app.
export function safeRedirect(path: string | null | undefined): string {
  if (!path || path.startsWith("//")) return "/app";
  if (path === "/app" || path.startsWith("/app/") || path.startsWith("/app?")) return path;
  return "/app";
}
