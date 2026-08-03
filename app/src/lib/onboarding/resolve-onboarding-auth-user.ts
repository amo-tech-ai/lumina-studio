import type { AuthError, SupabaseClient, User } from "@supabase/supabase-js";

/** Thrown when /onboarding loads with no recoverable browser session. */
export const ONBOARDING_AUTH_REQUIRED = "ONBOARDING_AUTH_REQUIRED";

/**
 * Thrown when session refresh failed transiently (network / Auth service).
 * UI should offer Retry — not force a full sign-in.
 */
export const ONBOARDING_AUTH_TRANSIENT = "ONBOARDING_AUTH_TRANSIENT";

const AUTH_HYDRATE_MS = 2500;

function isMissingSessionError(error: AuthError | null | undefined): boolean {
  if (!error?.message) return false;
  return /auth session missing/i.test(error.message);
}

function throwSanitizedGetUserError(error: AuthError): never {
  if (isMissingSessionError(error)) {
    throw new Error(ONBOARDING_AUTH_REQUIRED);
  }
  // Never surface raw GoTrue/Postgres text to the operator UI.
  throw new Error(ONBOARDING_AUTH_TRANSIENT);
}

/**
 * Wait for GoTrue cookie hydration after OAuth / hard navigation, then return
 * the authenticated user. Without this, `getUser()` often races and surfaces
 * "Auth session missing!" on `/onboarding` right after Google sign-in.
 *
 * Important: do not treat `INITIAL_SESSION` with a null session as final —
 * Supabase often emits that before cookies finish hydrating after Google OAuth.
 *
 * Early return when `getSession` + `getUser` already succeed never registers
 * `onAuthStateChange` / timers — nothing to clean up on that path.
 */
export async function resolveOnboardingAuthUser(
  supabase: SupabaseClient,
  options?: { hydrateTimeoutMs?: number },
): Promise<User> {
  const timeoutMs = options?.hydrateTimeoutMs ?? AUTH_HYDRATE_MS;

  const {
    data: { session: existing },
    error: sessionError,
  } = await supabase.auth.getSession();
  // Expired access token + failed refresh → session null + error. That is
  // retryable, not "signed out".
  if (sessionError && !existing?.user) {
    throw new Error(ONBOARDING_AUTH_TRANSIENT);
  }

  if (existing?.user) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (user && !error) return user;
    if (error && !isMissingSessionError(error)) {
      throwSanitizedGetUserError(error);
    }
  }

  const hydrated = await new Promise<User | null>((resolve, reject) => {
    let settled = false;
    const finish = (user: User | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      subscription.unsubscribe();
      resolve(user);
    };
    const failTransient = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      subscription.unsubscribe();
      reject(new Error(ONBOARDING_AUTH_TRANSIENT));
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        session?.user &&
        (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED")
      ) {
        finish(session.user);
      }
      // ponytail: null INITIAL_SESSION is not decisive — cookies may still hydrate.
    });

    const timer = setTimeout(() => {
      void supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error && !session?.user) {
          failTransient();
          return;
        }
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
      throwSanitizedGetUserError(error);
    }
    // Cached hydrate user without a validated getUser — do not trust it.
    throw new Error(ONBOARDING_AUTH_REQUIRED);
  }

  throw new Error(ONBOARDING_AUTH_REQUIRED);
}
