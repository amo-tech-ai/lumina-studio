import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

/** Copy Set-Cookie headers from one NextResponse onto another (e.g. redirect). */
export function copyResponseCookies(from: NextResponse, to: NextResponse): void {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie);
  }
}

function supabaseEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export type SessionUpdate = {
  response: NextResponse;
  user: User | null;
};

/**
 * Refresh the Supabase session on every matched request and return the trusted
 * user result from `auth.getUser()` for routes that require server validation.
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export async function updateSession(request: NextRequest): Promise<SessionUpdate> {
  let supabaseResponse = NextResponse.next({ request });

  const { url, anonKey } = supabaseEnv();
  if (!url || !anonKey) {
    return { response: supabaseResponse, user: null };
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
        if (headers) {
          for (const [key, value] of Object.entries(headers)) {
            supabaseResponse.headers.set(key, value);
          }
        }
      },
    },
  });

  try {
    const { data, error } = await supabase.auth.getUser();
    return {
      response: supabaseResponse,
      user: error ? null : data.user,
    };
  } catch {
    // Transient refresh failures must not break the request; protected routes
    // that require a trusted user will fail closed in middleware.
    return { response: supabaseResponse, user: null };
  }
}
