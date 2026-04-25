import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getDefaultAmazonTestLink } from "@/lib/amazon";
import { env } from "@/lib/env";
import {
  PINTEREST_DEMO_SESSION_COOKIE,
  getMissingPinterestDemoScopes,
  getPinterestDemoSession
} from "@/lib/pinterest-oauth";
import { createPin } from "@/lib/pinterest";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  boardId: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  link: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  altText: z.string().min(1).optional(),
  dryRun: z.boolean().optional()
});

async function getRequestPayload(request: NextRequest) {
  const text = await request.text();

  if (!text) {
    return {};
  }

  return JSON.parse(text) as unknown;
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(PINTEREST_DEMO_SESSION_COOKIE)?.value;
    const session = getPinterestDemoSession(sessionId);
    const body = requestSchema.parse(await getRequestPayload(request));
    const boardId = body.boardId || env.PINTEREST_TEST_BOARD_ID;
    const imageUrl =
      body.imageUrl || env.PINTEREST_TEST_IMAGE_URL || new URL("/icon-512.png", request.nextUrl.origin).toString();
    const link = body.link || getDefaultAmazonTestLink();

    if (!boardId) {
      throw new Error(
        "Missing environment variable PINTEREST_TEST_BOARD_ID. Add it to .env.local before testing this feature."
      );
    }

    if (!link) {
      throw new Error(
        "Missing Amazon test link. Add at least one AMAZON_PRODUCT_URL_* value to .env.local or send a link in the request body."
      );
    }

    const payload = {
      boardId,
      title: body.title || "Amaterest test pin",
      description: body.description || "Simple test pin for the Pinterest + Amazon integration.",
      link,
      imageUrl,
      altText: body.altText || "Amaterest test pin image"
    };

    if (body.dryRun) {
      return NextResponse.json({
        ok: true,
        dryRun: true,
        payload,
        source: session ? "oauth" : "env"
      });
    }

    if (session) {
      const missingWriteScopes = getMissingPinterestDemoScopes(session.scopes).filter(
        (scope) => scope === "boards:write" || scope === "pins:write"
      );

      if (missingWriteScopes.length > 0) {
        throw new Error(
          `Pinterest OAuth connected, but the token is missing required write scopes: ${missingWriteScopes.join(
            ", "
          )}. You can still demonstrate the OAuth flow, callback, board loading, and Dry Run while Pinterest Standard Access write scopes are pending approval.`
        );
      }
    }

    const pin = await createPin(payload, session?.accessToken);

    return NextResponse.json({
      ok: true,
      pin,
      source: session ? "oauth" : "env"
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create Pinterest test pin.";

    return NextResponse.json(
      {
        ok: false,
        error: message
      },
      { status: 400 }
    );
  }
}
