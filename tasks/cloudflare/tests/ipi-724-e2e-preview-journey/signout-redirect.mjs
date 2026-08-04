/**
 * Documented sign-out success: 303 → same-origin /login without signoutError.
 * Shared by run-e2e.mjs (13c / 13f) and signout-redirect.selfcheck.mjs.
 */
export function isPreviewSignoutSuccessRedirect(status, location, previewBase) {
  if (status !== 303 || !location) return false;
  try {
    const previewOrigin = new URL(previewBase).origin;
    const loc = new URL(location, previewBase);
    return (
      loc.origin === previewOrigin &&
      loc.pathname === "/login" &&
      loc.searchParams.get("signoutError") !== "1"
    );
  } catch {
    return false;
  }
}
