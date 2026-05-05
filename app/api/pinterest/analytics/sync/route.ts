import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { syncPinterestAnalytics } from "@/lib/pinterest-live";
import { PINTEREST_DEMO_SESSION_COOKIE, getPinterestDemoSession } from "@/lib/pinterest-oauth";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  internalPinIds: z.array(z.string().min(1)).optional(),
  pinterestPinIds: z.array(z.string().min(1)).optional()
});

async function readRequestBody(request: NextRequest) {
  const text = await request.text();
  return text ? (JSON.parse(text) as unknown) : {};
}

async function runSync(request: NextRequest) {
  const body = request.method === "POST" ? requestSchema.parse(await readRequestBody(request)) : {};
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(PINTEREST_DEMO_SESSION_COOKIE)?.value;
  const session = getPinterestDemoSession(sessionId);

  return syncPinterestAnalytics({
    ...body,
    accessToken: session?.accessToken
  });
}

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(await runSync(request));
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to sync Pinterest analytics."
      },
      { status: 400 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json(await runSync(request));
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to sync Pinterest analytics."
      },
      { status: 400 }
    );
  }
}
