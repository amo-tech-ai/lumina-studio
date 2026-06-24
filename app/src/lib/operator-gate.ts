import { resolveOperatorUser, type OperatorUser } from "@/lib/auth";

/**
 * HTTP boundary guard for operator-only routes (IPI2-127). When
 * OPERATOR_AUTH_ENABLED is true, validates the Supabase session via
 * resolveOperatorUser and returns the authenticated identity. Throws on
 * failure so the caller can return a 401. When auth is disabled, returns
 * a dev fallback identity.
 */
export async function withOperatorAuth(request: Request): Promise<OperatorUser> {
  if (process.env.OPERATOR_AUTH_ENABLED === "true") {
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
