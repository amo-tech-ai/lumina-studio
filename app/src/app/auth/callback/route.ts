import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  OAUTH_NEXT_COOKIE,
  isOAuthCookieSecure,
  oauthNextCookieOptions,
} from "@/lib/oauth-next-cookie";
import { parseSafeRedirect } from "@/lib/safe-redirect";
import { SITE_URL } from "@/lib/site";
import { copyResponseCookies } from "@/lib/supabase/session";

export const dynamic = "force-dynamic";

function supabaseEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

function hostsFromEnvList(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
}

/** Strips a `:port` suffix so comparisons don't miss on proxies that append one (e.g. `host:443`, local `wrangler dev` on `:8787`). */
function stripPort(host: string): string {
  return host.replace(/:\d+$/, "");
}

/**
 * Exact hostnames allowed via x-forwarded-host (Cloudflare preview, custom domains).
 * Deliberately NOT cached at module scope. OpenNext's Cloudflare adapter documents
 * `process.env` as populated per-request, not guaranteed available at
 * module-evaluation/cold-start time — caching env-derived data in a module-level
 * constant risks reading `undefined` once at cold start and keeping that forever.
 * Local `wrangler dev` couldn't fully exercise this (this route's own
 * `NODE_ENV === "development"` short-circuit bypasses the allowlist check entirely
 * in local preview), so this specific ordering wasn't directly observable there —
 * treat this as a defensive correctness fix per Workers/OpenNext guidance, not a
 * locally-reproduced bug.
 */
function trustedForwardedHostAllowlist(): Set<string> {
  const hosts = new Set<string>();
  try {
    hosts.add(stripPort(new URL(SITE_URL).host.toLowerCase()));
  } catch {
    // ignore malformed SITE_URL
  }
  for (const host of hostsFromEnvList(process.env.TRUSTED_OAUTH_FORWARDED_HOSTS)) {
    hosts.add(stripPort(host));
  }
  return hosts;
}

function isTrustedForwardedHost(forwardedHost: string, requestOrigin: string): boolean {
  const host = stripPort(forwardedHost.toLowerCase());
  if (trustedForwardedHostAllowlist().has(host)) return true;
  try {
    if (host === stripPort(new URL(requestOrigin).host.toLowerCase())) return true;
  } catch {
    // ignore malformed request origin
  }
  // No blanket *.vercel.app (or any) wildcard — add specific preview hosts to
  // TRUSTED_OAUTH_FORWARDED_HOSTS instead of trusting an entire public suffix.
  return false;
}

function redirectOrigin(request: Request): string {
  const { origin } = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";

  if (process.env.NODE_ENV === "development" || !forwardedHost) {
    return origin;
  }

  if (!isTrustedForwardedHost(forwardedHost, origin)) {
    return origin;
  }

  return `${forwardedProto}://${forwardedHost}`;
}

function clearOAuthNext(response: NextResponse) {
  response.cookies.set(OAUTH_NEXT_COOKIE, "", {
    ...oauthNextCookieOptions(isOAuthCookieSecure()),
    maxAge: 0,
  });
}

function loginErrorUrl(origin: string, safeTarget: string | null): string {
  const url = new URL("/login", origin);
  url.searchParams.set("error", "auth");
  if (safeTarget) url.searchParams.set("redirect", safeTarget);
  return url.toString();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = redirectOrigin(request);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const oauthDescription = searchParams.get("error_description");
  const safeTarget = parseSafeRedirect(request.cookies.get(OAUTH_NEXT_COOKIE)?.value);

  if (oauthError) {
    console.error("[auth/callback] OAuth provider error", {
      oauthError,
      oauthDescription,
    });
    const response = NextResponse.redirect(loginErrorUrl(origin, safeTarget));
    clearOAuthNext(response);
    return response;
  }

  if (!code) {
    console.error("[auth/callback] Missing authorization code in callback URL");
    const response = NextResponse.redirect(loginErrorUrl(origin, safeTarget));
    clearOAuthNext(response);
    return response;
  }

  const { url, anonKey } = supabaseEnv();
  if (!url || !anonKey) {
    console.error("[auth/callback] Supabase is not configured on the server");
    const response = NextResponse.redirect(loginErrorUrl(origin, safeTarget));
    clearOAuthNext(response);
    return response;
  }

  const successUrl = `${origin}${safeTarget ?? "/app"}`;
  let response = NextResponse.redirect(successUrl);
  clearOAuthNext(response);

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        if (headers) {
          for (const [key, value] of Object.entries(headers)) {
            response.headers.set(key, value);
          }
        }
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth/callback] exchangeCodeForSession failed", {
      message: error.message,
      status: error.status,
      name: error.name,
    });
    const errorResponse = NextResponse.redirect(loginErrorUrl(origin, safeTarget));
    copyResponseCookies(response, errorResponse);
    clearOAuthNext(errorResponse);
    return errorResponse;
  }

  return response;
}
