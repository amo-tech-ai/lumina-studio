import { resolveOperatorUser, type OperatorUser } from "@/lib/auth";
import { apiErrorResponse } from "@/lib/api/error-envelope";
import type { NextResponse } from "next/server";

/** True when operator routes must require a real session (preview/production Worker or explicit flag). */
export function isOperatorAuthEnforced(): boolean {
  return (
    process.env.OPERATOR_AUTH_ENABLED === "true" ||
    process.env.NODE_ENV === "production"
  );
}

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
 */
export async function withOperatorAuth(request: Request): Promise<OperatorUser> {
  if (isOperatorAuthEnforced()) {
    try {
      return await resolveOperatorUser(request);
    } catch {
      throw new OperatorAuthError("Unauthorized");
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
