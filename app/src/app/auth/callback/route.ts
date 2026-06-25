import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SITE_URL } from "@/lib/site";
import { copyResponseCookies } from "@/lib/supabase/session";

export const dynamic = "force-dynamic";

function supabaseEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

function isTrustedForwardedHost(forwardedHost: string, requestOrigin: string): boolean {
  const host = forwardedHost.toLowerCase();
  try {
    if (host === new URL(requestOrigin).host.toLowerCase()) return true;
  } catch {
    // ignore malformed request origin
  }
  try {
    if (host === new URL(SITE_URL).host.toLowerCase()) return true;
  } catch {
    // ignore malformed SITE_URL
  }
  return host.endsWith(".vercel.app");
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = redirectOrigin(request);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const oauthDescription = searchParams.get("error_description");

  if (oauthError) {
    console.error("[auth/callback] OAuth provider error", {
      oauthError,
      oauthDescription,
    });
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  if (!code) {
    console.error("[auth/callback] Missing authorization code in callback URL");
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const { url, anonKey } = supabaseEnv();
  if (!url || !anonKey) {
    console.error("[auth/callback] Supabase is not configured on the server");
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const successUrl = `${origin}/app`;
  let response = NextResponse.redirect(successUrl);

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
    const errorResponse = NextResponse.redirect(`${origin}/login?error=auth`);
    copyResponseCookies(response, errorResponse);
    return errorResponse;
  }

  return response;
}
