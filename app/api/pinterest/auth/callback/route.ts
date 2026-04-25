import { NextRequest, NextResponse } from "next/server";

import {
  PINTEREST_DEMO_REDIRECT_COOKIE,
  PINTEREST_DEMO_SESSION_COOKIE,
  PINTEREST_DEMO_STATE_COOKIE,
  createPinterestDemoSessionFromCode,
  getPinterestDemoStatus,
  resolvePinterestRedirectUri
} from "@/lib/pinterest-oauth";

export const dynamic = "force-dynamic";

function getSessionCookieConfig() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  };
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const oauthError = request.nextUrl.searchParams.get("error");
  const oauthErrorDescription = request.nextUrl.searchParams.get("error_description");
  const expectedState = request.cookies.get(PINTEREST_DEMO_STATE_COOKIE)?.value;
  const redirectUri =
    request.cookies.get(PINTEREST_DEMO_REDIRECT_COOKIE)?.value ||
    resolvePinterestRedirectUri(request.nextUrl.origin);

  if (oauthError) {
    const response = NextResponse.json(
      {
        ok: false,
        error: oauthErrorDescription || oauthError
      },
      { status: 400 }
    );

    response.cookies.delete(PINTEREST_DEMO_STATE_COOKIE);
    response.cookies.delete(PINTEREST_DEMO_REDIRECT_COOKIE);

    return response;
  }

  if (!code) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing Pinterest OAuth code in the callback URL."
      },
      { status: 400 }
    );
  }

  if (!state || !expectedState || state !== expectedState) {
    const response = NextResponse.json(
      {
        ok: false,
        error: "Pinterest OAuth state mismatch. Start the connection again from the demo page."
      },
      { status: 400 }
    );

    response.cookies.delete(PINTEREST_DEMO_STATE_COOKIE);
    response.cookies.delete(PINTEREST_DEMO_REDIRECT_COOKIE);

    return response;
  }

  try {
    const session = await createPinterestDemoSessionFromCode(code, redirectUri);
    const response = NextResponse.json({
      ok: true,
      ...getPinterestDemoStatus(session, redirectUri)
    });

    response.cookies.set(PINTEREST_DEMO_SESSION_COOKIE, session.id, getSessionCookieConfig());
    response.cookies.delete(PINTEREST_DEMO_STATE_COOKIE);
    response.cookies.delete(PINTEREST_DEMO_REDIRECT_COOKIE);

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to finalize the Pinterest OAuth callback.";
    const response = NextResponse.json(
      {
        ok: false,
        error: message
      },
      { status: 400 }
    );

    response.cookies.delete(PINTEREST_DEMO_STATE_COOKIE);
    response.cookies.delete(PINTEREST_DEMO_REDIRECT_COOKIE);

    return response;
  }
}
