import { NextRequest, NextResponse } from "next/server";

import { getPinterestOpsSummary } from "@/lib/pinterest-ops";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(await getPinterestOpsSummary(request.nextUrl.origin));
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to load ops summary." }, { status: 400 });
  }
}
