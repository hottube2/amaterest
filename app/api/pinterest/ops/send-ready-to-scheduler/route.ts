import { NextRequest, NextResponse } from "next/server";

import { sendQaPassedPinsToScheduler } from "@/lib/pinterest-ops";

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json(await sendQaPassedPinsToScheduler(request.nextUrl.origin));
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to send QA-passed pins." }, { status: 400 });
  }
}
