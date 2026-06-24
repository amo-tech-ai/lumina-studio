import { resolveOperatorUser } from "@/lib/auth";

/**
 * HTTP boundary guard for operator-only routes (IPI2-127). When
 * OPERATOR_AUTH_ENABLED is true, validates the Supabase session via
 * resolveOperatorUser and returns 401 on failure; otherwise delegates.
 */
export async function withOperatorAuth(
  request: Request,
  handler: (request: Request) => Response | Promise<Response>,
): Promise<Response> {
  if (process.env.OPERATOR_AUTH_ENABLED === "true") {
    try {
      await resolveOperatorUser(request);
    } catch {
      return new Response("Unauthorized", { status: 401 });
    }
  }
  return handler(request);
}
