import { NextResponse, type NextRequest } from "next/server";
import {
  OAUTH_NEXT_COOKIE,
  oauthNextCookieOptions,
} from "@/lib/oauth-next-cookie";
import { parseSafeRedirect } from "@/lib/safe-redirect";

export const dynamic = "force-dynamic";

/**
 * Sets (or clears) the HttpOnly `oauth_next` cookie before Google OAuth.
 * Client components cannot set HttpOnly cookies — IPI-837 · AUTH-OAUTH-001 Option B.
 */
export async function POST(request: NextRequest) {
  let raw: unknown;
  try {
    const body = (await request.json()) as { redirect?: unknown };
    raw = body.redirect;
  } catch {
    raw = undefined;
  }

  const target = parseSafeRedirect(typeof raw === "string" ? raw : null);
  const secure = process.env.NODE_ENV === "production";
  const response = new NextResponse(null, { status: 204 });

  if (target) {
    response.cookies.set(OAUTH_NEXT_COOKIE, target, oauthNextCookieOptions(secure));
  } else {
    response.cookies.set(OAUTH_NEXT_COOKIE, "", {
      ...oauthNextCookieOptions(secure),
      maxAge: 0,
    });
  }

  return response;
}
