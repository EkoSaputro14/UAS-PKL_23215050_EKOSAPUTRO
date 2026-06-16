/**
 * WhatsApp Webhook Utilities
 * Signature verification, payload parsing, status handling.
 */

import crypto from "crypto";

export type MessageType = "text" | "image" | "document" | "audio" | "video" | "sticker" | "location" | "contacts" | "unknown";

export interface WebhookPayload {
  phoneNumberId: string;
  from: string;           // sender WhatsApp ID (phone number)
  messageId: string;
  timestamp: string;
  type: MessageType;
  text?: { body: string };
  image?: { id: string; mime_type: string; caption?: string };
  document?: { id: string; mime_type: string; filename: string; caption?: string };
  audio?: { id: string; mime_type: string };
  video?: { id: string; mime_type: string; caption?: string };
  sticker?: { id: string; mime_type: string };
  context?: { id: string };  // replied-to message
  contactName?: string;       // from contacts array
  status?: StatusUpdate;
}

export interface StatusUpdate {
  messageId: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  recipientId: string;
  error?: { code: number; title: string; message: string };
}

/**
 * Verify webhook signature using HMAC-SHA256.
 */
export function verifyWebhookSignature(
  body: string,
  signature: string | null,
  appSecret: string
): boolean {
  if (!signature || !appSecret) return false;

  const expectedSignature =
    "sha256=" +
    crypto.createHmac("sha256", appSecret).update(body).digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

/**
 * Parse raw webhook body into structured payload(s).
 * A single webhook can contain multiple messages.
 */
export function parseWebhookPayloads(body: Record<string, unknown>): WebhookPayload[] {
  const payloads: WebhookPayload[] = [];

  const entry = body.entry as Record<string, unknown>[] | undefined;
  if (!entry) return payloads;

  for (const e of entry) {
    const changes = e.changes as Record<string, unknown>[] | undefined;
    if (!changes) continue;

    for (const change of changes) {
      const value = change.value as Record<string, unknown> | undefined;
      if (!value) continue;

      const phoneNumberId = (value.metadata as Record<string, unknown>)?.phone_number_id as string;

      // Handle incoming messages
      const messages = value.messages as Record<string, unknown>[] | undefined;
      if (messages) {
        for (const msg of messages) {
          const payload = parseMessage(msg, phoneNumberId);
          // Extract contact name if available
          const contacts = value.contacts as Record<string, unknown>[] | undefined;
          if (contacts && contacts.length > 0) {
            payload.contactName = (contacts[0].profile as Record<string, unknown>)?.name as string;
          }
          payloads.push(payload);
        }
      }

      // Handle status updates
      const statuses = value.statuses as Record<string, unknown>[] | undefined;
      if (statuses) {
        for (const status of statuses) {
          payloads.push({
            phoneNumberId,
            from: status.recipient_id as string,
            messageId: status.id as string,
            timestamp: status.timestamp as string,
            type: "unknown",
            status: {
              messageId: status.id as string,
              status: status.status as "sent" | "delivered" | "read" | "failed",
              timestamp: status.timestamp as string,
              recipientId: status.recipient_id as string,
              error: status.errors
                ? (status.errors as Record<string, unknown>[])[0] as unknown as StatusUpdate["error"]
                : undefined,
            },
          });
        }
      }
    }
  }

  return payloads;
}

/**
 * Parse a single message object into WebhookPayload.
 */
function parseMessage(msg: Record<string, unknown>, phoneNumberId: string): WebhookPayload {
  const type = msg.type as MessageType;
  const base: WebhookPayload = {
    phoneNumberId,
    from: msg.from as string,
    messageId: msg.id as string,
    timestamp: msg.timestamp as string,
    type,
  };

  switch (type) {
    case "text":
      base.text = msg.text as { body: string };
      break;
    case "image":
      base.image = msg.image as { id: string; mime_type: string; caption?: string };
      break;
    case "document":
      base.document = msg.document as { id: string; mime_type: string; filename: string; caption?: string };
      break;
    case "audio":
      base.audio = msg.audio as { id: string; mime_type: string };
      break;
    case "video":
      base.video = msg.video as { id: string; mime_type: string; caption?: string };
      break;
    case "sticker":
      base.sticker = msg.sticker as { id: string; mime_type: string };
      break;
    default:
      break;
  }

  if (msg.context) {
    base.context = msg.context as { id: string };
  }

  return base;
}

/**
 * Extract message type from webhook value.
 */
export function extractMessageType(value: Record<string, unknown>): MessageType {
  const messages = value.messages as Record<string, unknown>[] | undefined;
  if (!messages || messages.length === 0) return "unknown";
  return (messages[0].type as MessageType) || "unknown";
}
