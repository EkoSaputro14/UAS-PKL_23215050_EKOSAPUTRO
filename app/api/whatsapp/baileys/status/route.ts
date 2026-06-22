import { NextResponse } from "next/server";

const BAILEYS_URL = process.env.BAILEYS_URL || "http://localhost:3002";
const BAILEYS_API_KEY = process.env.BAILEYS_API_KEY || "baileys-secret-key";

export async function GET() {
  try {
    const response = await fetch(`${BAILEYS_URL}/status`, {
      headers: { "x-api-key": BAILEYS_API_KEY },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Baileys service returned ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      {
        connected: false,
        state: "disconnected",
        phoneNumber: null,
        pushName: null,
        webhookUrl: null,
        error: "Baileys service unavailable",
      },
      { status: 503 }
    );
  }
}
