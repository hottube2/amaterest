import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { PINTEREST_DEMO_SESSION_COOKIE, getPinterestDemoSession } from "@/lib/pinterest-oauth";
import { runPinterestScheduleDue } from "@/lib/pinterest-schedule";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  mode: z.enum(["auto", "dryRun", "publish"]).optional()
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
    const dashboard = await runPinterestScheduleDue({
      requestedMode: body.mode || "auto",
      origin: request.nextUrl.origin,
      accessToken: session?.accessToken,
      sessionScopes: session?.scopes
    });

    return NextResponse.json(dashboard);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to execute the scheduled Pinterest queue.";

    return NextResponse.json(
      {
        ok: false,
        error: message
      },
      { status: 400 }
    );
  }
}
