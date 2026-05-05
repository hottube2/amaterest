import { NextRequest, NextResponse } from "next/server";

import { runFullOpsCycle } from "@/lib/pinterest-ops";

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json(await runFullOpsCycle(request.nextUrl.origin));
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to run full ops cycle." }, { status: 400 });
  }
}
