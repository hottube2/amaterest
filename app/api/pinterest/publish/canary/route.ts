import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { PINTEREST_DEMO_SESSION_COOKIE, getPinterestDemoSession } from "@/lib/pinterest-oauth";
import { runPinterestCanaryPublish } from "@/lib/pinterest-live";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  boardId: z.string().min(1).optional(),
  internalPinId: z.string().min(1).optional(),
  pinId: z.string().min(1).optional(),
  dryRun: z.boolean().optional()
});

async function readRequestBody(request: NextRequest) {
  const text = await request.text();
  return text ? (JSON.parse(text) as unknown) : {};
}

export async function POST(request: NextRequest) {
  try {
    const body = requestSchema.parse(await readRequestBody(request));
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(PINTEREST_DEMO_SESSION_COOKIE)?.value;
    const session = getPinterestDemoSession(sessionId);
    const publication = await runPinterestCanaryPublish({
      origin: request.nextUrl.origin,
      boardId: body.boardId,
      internalPinId: body.pinId || body.internalPinId,
      dryRun: body.dryRun === true,
      accessToken: session?.accessToken,
      sessionScopes: session?.scopes
    });

    return NextResponse.json({
      ok: body.dryRun === true ? publication.validationOk === true : publication.result === "success",
      ...publication,
      publication
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to run canary publish."
      },
      { status: 400 }
    );
  }
}
