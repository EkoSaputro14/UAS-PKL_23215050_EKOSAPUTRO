import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { exportAnalyticsCSV, getDateRangeParams } from "@/lib/analytics";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const range = (request.nextUrl.searchParams.get("range") as "7d" | "30d" | "90d") || "30d";
    const { startDate, endDate } = getDateRangeParams(range);

    const csv = await exportAnalyticsCSV(startDate, endDate);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="analytics-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("[Analytics Export API]", error);
    return NextResponse.json(
      { error: "Failed to export analytics data" },
      { status: 500 }
    );
  }
}
