import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { bulkUpsertAffiliateUrls, parseBulkAffiliateInput } from "@/lib/pinterest-monetization";

const requestSchema = z.object({
  format: z.enum(["json", "csv", "auto"]).optional(),
  payload: z.string().min(1)
});

export async function POST(request: NextRequest) {
  try {
    const body = requestSchema.parse(await request.json());
    const entries = parseBulkAffiliateInput(body.payload, body.format ?? "auto");
    const report = await bulkUpsertAffiliateUrls(entries);
    return NextResponse.json({ ok: true, report });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to import bulk affiliate URLs." }, { status: 400 });
  }
}
