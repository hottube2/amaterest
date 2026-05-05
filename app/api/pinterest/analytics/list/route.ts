import { NextRequest, NextResponse } from "next/server";

import { getPinterestLiveDashboard } from "@/lib/pinterest-live";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(await getPinterestLiveDashboard(request.nextUrl.origin));
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to list Pinterest analytics."
      },
      { status: 400 }
    );
  }
}
