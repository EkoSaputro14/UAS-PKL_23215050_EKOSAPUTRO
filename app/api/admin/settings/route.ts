import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getSettings, setSettings } from "@/lib/settings";
import { invalidateProviderCache } from "@/lib/ai-provider";
import { maskApiKey } from "@/lib/crypto";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Read from GLOBAL settings table
  const settings = await getSettings();

  // Return settings with defaults — mask API keys for security
  const aiApiKey = settings.ai_api_key || "";
  const aiBaseUrl = settings.ai_base_url || "";

  return Response.json({
    ai_provider: settings.ai_provider || process.env.AI_PROVIDER || "openai",
    ai_api_key: aiApiKey ? maskApiKey(aiApiKey) : "",
    ai_base_url: aiBaseUrl,
    ai_model: settings.ai_model || "",
    ai_embedding_model: settings.ai_embedding_model || "",
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }


  try {
    const body = await request.json();
    const { ai_provider, ai_api_key, ai_base_url, ai_model, ai_embedding_model } = body;

    if (!ai_provider) {
      return Response.json({ error: "AI provider is required" }, { status: 400 });
    }

    // Save to GLOBAL settings table
    await setSettings({
      ai_provider: ai_provider || "",
      ai_api_key: ai_api_key || "",
      ai_base_url: ai_base_url || "",
      ai_model: ai_model || "",
      ai_embedding_model: ai_embedding_model || "",
    });

    // Invalidate provider cache so new settings take effect immediately
    invalidateProviderCache();


    return Response.json({ success: true });
  } catch (error) {
    console.error("Settings save error:", error);
    return Response.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
