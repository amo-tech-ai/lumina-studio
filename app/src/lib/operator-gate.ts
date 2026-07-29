import { isOperatorAuthEnforced } from "./operator-auth-env";
import {
  extractAccessToken,
  resolveOperatorUser,
  type OperatorUser,
} from "@/lib/auth";
import { apiErrorResponse } from "@/lib/api/error-envelope";
import type { NextResponse } from "next/server";

export { isOperatorAuthEnforced } from "./operator-auth-env";

/** Rejects demo/sentinel ids — UUID-scoped callers (org_members) need a real user. */
const OPERATOR_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Local `next dev` only — never on built Worker preview/production runtimes. */
export function isLocalDevAuthFallbackAllowed(): boolean {
  return process.env.NODE_ENV !== "production" && !isOperatorAuthStrictlyEnabled();
}

function isOperatorAuthStrictlyEnabled(): boolean {
  return process.env.OPERATOR_AUTH_ENABLED === "true";
}

/**
 * HTTP boundary guard for operator-only routes (IPI2-127, IPI-468). When auth is
 * enforced, validates the Supabase session via resolveOperatorUser and returns the
 * authenticated identity. Throws on failure so the caller can return 401.
 * Dev fallback (`dev-unauthenticated`) is allowed only in local `next dev` with
 * auth not strictly enabled — never on preview/production Worker runtimes.
 *
 * IPI-846: when auth is *not* enforced but a Bearer/cookie token is present,
 * prefer the real session UUID. Blindly returning the sentinel made CopilotKit
 * call `getCurrentOrgId("dev-unauthenticated")` → Postgres 22P02 → 503 /
 * `runtime_info_fetch_failed` while `/app` still looked signed-in.
 */
export async function withOperatorAuth(request: Request): Promise<OperatorUser> {
  if (isOperatorAuthEnforced()) {
    try {
      return await resolveOperatorUser(request);
    } catch {
      throw new OperatorAuthError("Unauthorized");
    }
  }

  if (extractAccessToken(request)) {
    try {
      const user = await resolveOperatorUser(request);
      if (OPERATOR_UUID_RE.test(user.id)) return user;
    } catch {
      // Invalid session with auth disabled — fall through to sentinel.
    }
  }

  return { id: "dev-unauthenticated", name: "Dev (auth disabled)" };
}

/**
 * Typed error so callers can distinguish auth failures cleanly.
 */
export class OperatorAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OperatorAuthError";
  }
}

/** Returns an error response envelope, or null when auth succeeded. */
export async function withOperatorAuthOrResponse(
  request: Request,
): Promise<NextResponse | null> {
  try {
    await withOperatorAuth(request);
    return null;
  } catch (e) {
    if (e instanceof OperatorAuthError) {
      return apiErrorResponse("UNAUTHORIZED", 401);
    }
    return apiErrorResponse("INTERNAL_ERROR", 500);
  }
}
