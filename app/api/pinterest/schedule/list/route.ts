import { NextRequest, NextResponse } from "next/server";

import { getPinterestScheduleDashboard } from "@/lib/pinterest-schedule";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const dashboard = await getPinterestScheduleDashboard(request.nextUrl.origin);

    return NextResponse.json(dashboard);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load the Pinterest schedule queue.";

    return NextResponse.json(
      {
        ok: false,
        error: message
      },
      { status: 400 }
    );
  }
}
