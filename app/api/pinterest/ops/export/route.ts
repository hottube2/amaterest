import { NextRequest, NextResponse } from "next/server";

import { buildOpsExportCsv, getPinterestOpsSummary } from "@/lib/pinterest-ops";

export async function GET(request: NextRequest) {
  try {
    const format = request.nextUrl.searchParams.get("format") || "json";
    const summary = await getPinterestOpsSummary(request.nextUrl.origin);

    if (format === "csv") {
      return new NextResponse(buildOpsExportCsv(summary.opsRows), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="pinterest-ops-export.csv"'
        }
      });
    }

    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to export ops." }, { status: 400 });
  }
}
