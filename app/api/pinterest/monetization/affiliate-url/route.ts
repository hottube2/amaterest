import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { upsertAffiliateUrl } from "@/lib/pinterest-monetization";

const requestSchema = z.object({
  productKey: z.string().min(1),
  amazonUrlRaw: z.string().url().optional(),
  amazonAffiliateUrl: z.string().url()
});

export async function POST(request: NextRequest) {
  try {
    const body = requestSchema.parse(await request.json());
    const product = await upsertAffiliateUrl(body);
    return NextResponse.json({ ok: true, product });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to save affiliate URL." }, { status: 400 });
  }
}
