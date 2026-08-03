import type { AuthError, SupabaseClient, User } from "@supabase/supabase-js";

/** Thrown when /onboarding loads with no recoverable browser session. */
export const ONBOARDING_AUTH_REQUIRED = "ONBOARDING_AUTH_REQUIRED";

const AUTH_HYDRATE_MS = 2500;

function isMissingSessionError(error: AuthError | null | undefined): boolean {
  if (!error?.message) return false;
  return /auth session missing/i.test(error.message);
}

/**
 * Wait for GoTrue cookie hydration after OAuth / hard navigation, then return
 * the authenticated user. Without this, `getUser()` often races and surfaces
 * "Auth session missing!" on `/onboarding` right after Google sign-in.
 *
 * Important: do not treat `INITIAL_SESSION` with a null session as final —
 * Supabase often emits that before cookies finish hydrating after Google OAuth.
 */
export async function resolveOnboardingAuthUser(
  supabase: SupabaseClient,
  options?: { hydrateTimeoutMs?: number },
): Promise<User> {
  const timeoutMs = options?.hydrateTimeoutMs ?? AUTH_HYDRATE_MS;

  const {
    data: { session: existing },
  } = await supabase.auth.getSession();
  if (existing?.user) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (user && !error) return user;
    // Cookie/session present but getUser failed for a non-race reason — surface it.
    if (error && !isMissingSessionError(error)) {
      throw new Error(error.message);
    }
  }

  const hydrated = await new Promise<User | null>((resolve) => {
    let settled = false;
    const finish = (user: User | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      subscription.unsubscribe();
      resolve(user);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
        finish(session.user);
      }
      // ponytail: null INITIAL_SESSION is not decisive — cookies may still hydrate.
      // Only SIGNED_IN / timed re-check concludes "signed out".
    });

    const timer = setTimeout(() => {
      void supabase.auth.getSession().then(({ data: { session } }) => {
        finish(session?.user ?? null);
      });
    }, timeoutMs);
  });

  if (hydrated) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (user && !error) return user;
    if (error && !isMissingSessionError(error)) {
      throw new Error(error.message);
    }
    return hydrated;
  }

  throw new Error(ONBOARDING_AUTH_REQUIRED);
}
