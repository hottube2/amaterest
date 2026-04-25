import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { PINTEREST_DEMO_SESSION_COOKIE, getPinterestDemoSession } from "@/lib/pinterest-oauth";
import { runPinterestScheduleDue } from "@/lib/pinterest-schedule";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(PINTEREST_DEMO_SESSION_COOKIE)?.value;
    const session = getPinterestDemoSession(sessionId);
    const dashboard = await runPinterestScheduleDue({
      requestedMode: "dryRun",
      origin: request.nextUrl.origin,
      accessToken: session?.accessToken,
      sessionScopes: session?.scopes
    });

    return NextResponse.json(dashboard);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to run scheduled Pinterest dry-runs.";

    return NextResponse.json(
      {
        ok: false,
        error: message
      },
      { status: 400 }
    );
  }
}
