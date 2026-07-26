// IPI-812 — resolve a route's actor from the caller's own Supabase JWT.
//
// Lives here rather than in @/lib/auth because src/middleware.ts imports that
// module and is documented Edge-safe; pulling commit-shoot-draft (and the whole
// shoot-commit path) into auth.ts would drag it into the middleware bundle.
import type { SupabaseClient } from "@supabase/supabase-js";
import { extractAccessToken } from "@/lib/auth";
import { createUserScopedClient } from "@/lib/shoot/commit-shoot-draft";

/** A verified actor, or the status + message the route should answer with. */
export type JwtActor =
  | { ok: true; userId: string; accessToken: string; client: SupabaseClient }
  | { ok: false; status: 401 | 500; error: string };

const ACTOR_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolve the actor from the request's own Supabase JWT, plus a client scoped
 * to it (so RLS and the is_org_* helpers see auth.uid()).
 *
 * Use this — never withOperatorAuth()'s return value — anywhere the identity is
 * compared against a uuid column. With the gate disabled withOperatorAuth
 * yields "dev-unauthenticated" without inspecting the request at all, and a
 * string sentinel can never equal a uuid, so every such comparison fails 100%
 * of the time (IPI-812).
 */
export async function resolveJwtActor(request: Request): Promise<JwtActor> {
  const accessToken = extractAccessToken(request);
  if (!accessToken) {
    return { ok: false, status: 401, error: "Access token required" };
  }

  let client: SupabaseClient;
  let userId: string;
  try {
    client = createUserScopedClient(accessToken);
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) {
      return { ok: false, status: 401, error: "Invalid or expired session" };
    }
    userId = data.user.id;
  } catch (e) {
    // createUserScopedClient throws synchronously when NEXT_PUBLIC_SUPABASE_URL
    // or NEXT_PUBLIC_SUPABASE_ANON_KEY is unset, and getUser() rejects on a
    // network failure. Both used to escape the route handlers uncaught, so a
    // misconfigured deploy answered with Next's generic HTML 500 instead of the
    // route's JSON error envelope.
    console.error("[resolveJwtActor]", e);
    return { ok: false, status: 500, error: "Internal error" };
  }

  // Shape guard: rejects any non-uuid actor, not one hard-coded sentinel.
  if (!ACTOR_UUID_RE.test(userId)) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }
  return { ok: true, userId, accessToken, client };
}
