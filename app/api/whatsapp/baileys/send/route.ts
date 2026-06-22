import { NextRequest, NextResponse } from "next/server";

const BAILEYS_URL = process.env.BAILEYS_URL || "http://localhost:3002";
const BAILEYS_API_KEY = process.env.BAILEYS_API_KEY || "baileys-secret-key";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.phone || !body.text) {
      return NextResponse.json(
        { error: "Missing required fields: phone, text" },
        { status: 400 }
      );
    }

    const response = await fetch(`${BAILEYS_URL}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": BAILEYS_API_KEY,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
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
