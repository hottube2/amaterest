import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { updatePinPerformance } from "@/lib/pinterest-library";

const requestSchema = z.object({
  pinId: z.string().min(1),
  impressions: z.number().int().min(0).optional(),
  clicks: z.number().int().min(0).optional(),
  outboundClicks: z.number().int().min(0).optional(),
  saves: z.number().int().min(0).optional(),
  publishDate: z.string().optional(),
  performanceNotes: z.string().optional(),
  performanceLabel: z.enum(["low_performer", "stable", "winner"]).optional(),
  winningPin: z.boolean().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = requestSchema.parse(await request.json());
    const performance = await updatePinPerformance(body);
    return NextResponse.json({ ok: true, performance });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to update performance." },
      { status: 400 }
    );
  }
}
