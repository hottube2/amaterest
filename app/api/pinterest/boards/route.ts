import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  PINTEREST_DEMO_SESSION_COOKIE,
  getPinterestDemoSession
} from "@/lib/pinterest-oauth";
import { getBoards } from "@/lib/pinterest";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(PINTEREST_DEMO_SESSION_COOKIE)?.value;
    const session = getPinterestDemoSession(sessionId);
    const boards = await getBoards(session?.accessToken);

    return NextResponse.json({
      ok: true,
      count: boards.length,
      boards,
      source: session ? "oauth" : "env"
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch Pinterest boards.";

    return NextResponse.json(
      {
        ok: false,
        error: message
      },
      { status: 400 }
    );
  }
}
