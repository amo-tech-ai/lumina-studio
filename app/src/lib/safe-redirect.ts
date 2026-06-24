// Open-redirect guard for the login `redirect` param. Only same-origin absolute
// paths are allowed; external URLs, protocol-relative (`//host`), and empty
// values fall back to the operator home.
export function safeRedirect(path: string | null | undefined): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return "/app";
  return path;
}
