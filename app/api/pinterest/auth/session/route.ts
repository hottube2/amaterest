import { NextRequest, NextResponse } from "next/server";

import {
  PINTEREST_DEMO_SESSION_COOKIE,
  deletePinterestDemoSession,
  getPinterestDemoSession,
  getPinterestDemoStatus,
  resolvePinterestRedirectUri
} from "@/lib/pinterest-oauth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sessionId = request.cookies.get(PINTEREST_DEMO_SESSION_COOKIE)?.value;
  const session = getPinterestDemoSession(sessionId);
  const redirectUri = resolvePinterestRedirectUri(request.nextUrl.origin);

  if (sessionId && !session) {
    deletePinterestDemoSession(sessionId);

    const response = NextResponse.json({
      ok: true,
      ...getPinterestDemoStatus(undefined, redirectUri)
    });

    response.cookies.delete(PINTEREST_DEMO_SESSION_COOKIE);

    return response;
  }

  return NextResponse.json({
    ok: true,
    ...getPinterestDemoStatus(session, redirectUri)
  });
}
