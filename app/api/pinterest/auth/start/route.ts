import { NextRequest, NextResponse } from "next/server";

import {
  PINTEREST_DEMO_REDIRECT_COOKIE,
  PINTEREST_DEMO_STATE_COOKIE,
  buildPinterestAuthorizeUrl,
  createPinterestOAuthState,
  resolvePinterestRedirectUri
} from "@/lib/pinterest-oauth";

export const dynamic = "force-dynamic";

function getCookieConfig() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10
  };
}

export async function GET(request: NextRequest) {
  const demoUrl = new URL("/pinterest-demo", request.nextUrl.origin);

  try {
    const state = createPinterestOAuthState();
    const redirectUri = resolvePinterestRedirectUri(request.nextUrl.origin);
    const authorizeUrl = buildPinterestAuthorizeUrl(state, redirectUri);
    const response = NextResponse.redirect(authorizeUrl);

    response.cookies.set(PINTEREST_DEMO_STATE_COOKIE, state, getCookieConfig());
    response.cookies.set(PINTEREST_DEMO_REDIRECT_COOKIE, redirectUri, getCookieConfig());

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to start the Pinterest OAuth flow.";

    demoUrl.searchParams.set("oauthError", message);

    return NextResponse.redirect(demoUrl);
  }
}
