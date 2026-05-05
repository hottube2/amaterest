import { NextRequest, NextResponse } from "next/server";

import { generateWinnerVariants } from "@/lib/pinterest-ops";

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json(await generateWinnerVariants(request.nextUrl.origin));
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to generate winner variants." }, { status: 400 });
  }
}
