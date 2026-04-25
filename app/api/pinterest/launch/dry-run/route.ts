import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { PINTEREST_DEMO_SESSION_COOKIE, getPinterestDemoSession } from "@/lib/pinterest-oauth";
import { runPinterestLaunch } from "@/lib/pinterest-launch";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  pinIds: z.array(z.string().min(1)).optional()
});

async function readRequestBody(request: NextRequest) {
  const text = await request.text();

  if (!text) {
    return {};
  }

  return JSON.parse(text) as unknown;
}

export async function POST(request: NextRequest) {
  try {
    const body = requestSchema.parse(await readRequestBody(request));
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(PINTEREST_DEMO_SESSION_COOKIE)?.value;
    const session = getPinterestDemoSession(sessionId);
    const report = await runPinterestLaunch({
      requestedMode: "dryRun",
      origin: request.nextUrl.origin,
      pinIds: body.pinIds,
      accessToken: session?.accessToken,
      sessionScopes: session?.scopes
    });

    return NextResponse.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to execute the Pinterest dry-run batch.";

    return NextResponse.json(
      {
        ok: false,
        error: message
      },
      { status: 400 }
    );
  }
}
