import { NextRequest, NextResponse } from "next/server";

import { buildLibraryCsv, getPinterestLibraryData } from "@/lib/pinterest-library";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const format = request.nextUrl.searchParams.get("format") || "json";
    const library = await getPinterestLibraryData(request.nextUrl.origin);

    if (format === "csv") {
      return new NextResponse(buildLibraryCsv(library.pins), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="pinterest-library.csv"'
        }
      });
    }

    return new NextResponse(JSON.stringify(library, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="pinterest-library.json"'
      }
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to export library." }, { status: 400 });
  }
}
