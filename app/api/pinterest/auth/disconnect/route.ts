import { NextRequest, NextResponse } from "next/server";

import {
  PINTEREST_DEMO_SESSION_COOKIE,
  deletePinterestDemoSession
} from "@/lib/pinterest-oauth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const sessionId = request.cookies.get(PINTEREST_DEMO_SESSION_COOKIE)?.value;

  deletePinterestDemoSession(sessionId);

  const response = NextResponse.json({
    ok: true
  });

  response.cookies.delete(PINTEREST_DEMO_SESSION_COOKIE);

  return response;
}
