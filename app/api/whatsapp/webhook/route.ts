import { NextRequest } from "next/server";
import { verifyWebhookSignature, parseWebhookPayloads } from "@/lib/whatsapp/webhook";
import { processIncomingMessage } from "@/lib/whatsapp/processor";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "mimotes_whatsapp_verify";
const APP_SECRET = process.env.WHATSAPP_APP_SECRET || "";

/**
 * GET /api/whatsapp/webhook
 * Webhook verification challenge from Meta.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[WhatsApp] Webhook verified");
    return new Response(challenge, { status: 200 });
  }

  console.warn("[WhatsApp] Webhook verification failed");
  return new Response("Forbidden", { status: 403 });
}

/**
 * POST /api/whatsapp/webhook
 * Incoming message handler.
 *
 * Security:
 * - HMAC-SHA256 signature verification
 * - Raw body preserved for signature check
 */
export async function POST(request: NextRequest) {
  // Get raw body for signature verification
  const rawBody = await request.text();

  // Verify signature
  const signature = request.headers.get("x-hub-signature-256");
  if (APP_SECRET && !verifyWebhookSignature(rawBody, signature, APP_SECRET)) {
    console.warn("[WhatsApp] Invalid webhook signature");
    return new Response("Invalid signature", { status: 401 });
  }

  try {
    const body = JSON.parse(rawBody);

    // Parse all payloads from the webhook
    const payloads = parseWebhookPayloads(body);

    // Process each message asynchronously
    for (const payload of payloads) {
      if (payload.status) {
        // Status update (delivery receipt) — just log
        console.log(`[WhatsApp] Status: ${payload.status.status} for ${payload.status.messageId}`);
        continue;
      }

      // Process incoming message (fire-and-forget)
      processIncomingMessage(payload).catch((err) => {
        console.error("[WhatsApp] Failed to process message:", err);
      });
    }

    // Return 200 immediately (Meta expects quick response)
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("[WhatsApp] Webhook processing error:", error);
    return new Response("OK", { status: 200 }); // Still return 200 to avoid retries
  }
}
