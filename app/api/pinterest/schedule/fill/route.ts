import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { fillPinterestSchedule } from "@/lib/pinterest-schedule";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  days: z.number().int().min(1).max(30).optional()
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
    const dashboard = await fillPinterestSchedule({
      origin: request.nextUrl.origin,
      days: body.days ?? 7
    });

    return NextResponse.json(dashboard);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fill the Pinterest schedule queue.";

    return NextResponse.json(
      {
        ok: false,
        error: message
      },
      { status: 400 }
    );
  }
}
