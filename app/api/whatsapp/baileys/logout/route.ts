import { NextResponse } from "next/server";

const BAILEYS_URL = process.env.BAILEYS_URL || "http://localhost:3002";
const BAILEYS_API_KEY = process.env.BAILEYS_API_KEY || "baileys-secret-key";

export async function POST() {
  try {
    const response = await fetch(`${BAILEYS_URL}/logout`, {
      method: "POST",
      headers: { "x-api-key": BAILEYS_API_KEY },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "unknown");
      return NextResponse.json(
        { error: `Baileys service error: ${errorBody}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Baileys service unavailable" },
      { status: 503 }
    );
  }
}
