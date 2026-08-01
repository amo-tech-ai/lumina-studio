/** Short-lived carrier for post-OAuth internal redirects (IPI-837). */
export const OAUTH_NEXT_COOKIE = "oauth_next";

/** ~10 minutes — long enough for Google consent, short enough to limit stale targets. */
export const OAUTH_NEXT_MAX_AGE_SEC = 600;

/** Secure cookies only in production (local http must stay Secure=false). */
export function isOAuthCookieSecure(): boolean {
  return process.env.NODE_ENV === "production";
}

export function oauthNextCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: OAUTH_NEXT_MAX_AGE_SEC,
  };
}
