import { NextRequest, NextResponse } from "next/server";

import { fillNext30DaysFromReadyPins } from "@/lib/pinterest-ops";

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json(await fillNext30DaysFromReadyPins(request.nextUrl.origin));
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to fill next 30 days." }, { status: 400 });
  }
}
