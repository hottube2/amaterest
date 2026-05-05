import { NextRequest, NextResponse } from "next/server";

import { filterLibraryPins, getPinterestLibraryData } from "@/lib/pinterest-library";
import type { PremiumProductCategory } from "@/lib/premium-products";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const library = await getPinterestLibraryData(request.nextUrl.origin);
    const category = (request.nextUrl.searchParams.get("category") || "all") as PremiumProductCategory | "all";
    const angle = (request.nextUrl.searchParams.get("angle") || "all") as
      | "all"
      | "before_after"
      | "problem_solution"
      | "aesthetic_result"
      | "winner_variant";
    const minScore = Number(request.nextUrl.searchParams.get("minScore") || 0);

    return NextResponse.json({
      ok: true,
      products: library.products,
      pins: filterLibraryPins(library.pins, { category, angle, minScore }),
      config: library.config
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to list library." }, { status: 400 });
  }
}
