import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getPinterestLibraryData, mapLibraryPinsToScheduleItems } from "@/lib/pinterest-library";
import { addItemsToPinterestSchedule } from "@/lib/pinterest-schedule";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  pinIds: z.array(z.string()).min(1).max(60),
  days: z.number().int().min(1).max(30).optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = requestSchema.parse(await request.json());
    const library = await getPinterestLibraryData(request.nextUrl.origin);
    const selectedPins = library.pins.filter((pin) => body.pinIds.includes(pin.pinId));

    const dashboard = await addItemsToPinterestSchedule({
      items: mapLibraryPinsToScheduleItems(selectedPins, library.products),
      days: body.days ?? 7
    });

    return NextResponse.json({
      ok: true,
      message: `${selectedPins.length} pin(s) traitées vers le scheduler.`,
      dashboard
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to send library pins to scheduler." },
      { status: 400 }
    );
  }
}
