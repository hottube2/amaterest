import { NextRequest, NextResponse } from "next/server";

import { clearPinterestSchedule } from "@/lib/pinterest-schedule";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const dashboard = await clearPinterestSchedule(request.nextUrl.origin);

    return NextResponse.json(dashboard);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to clear the Pinterest schedule queue.";

    return NextResponse.json(
      {
        ok: false,
        error: message
      },
      { status: 400 }
    );
  }
}
