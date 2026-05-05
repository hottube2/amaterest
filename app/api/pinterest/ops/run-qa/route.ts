import { NextRequest, NextResponse } from "next/server";

import { runPinterestOpsQa } from "@/lib/pinterest-ops";

export async function POST(request: NextRequest) {
  try {
    const qaResults = await runPinterestOpsQa(request.nextUrl.origin);
    return NextResponse.json({ ok: true, qaResults });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to run QA." }, { status: 400 });
  }
}
