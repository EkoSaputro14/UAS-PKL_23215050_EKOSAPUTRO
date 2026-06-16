/**
 * WhatsApp Business Platform (Cloud API) Client
 * Handles all communication with Meta's WhatsApp API.
 */

const META_API_VERSION = "v21.0";
const META_GRAPH_URL = `https://graph.facebook.com/${META_API_VERSION}`;

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface PhoneInfo {
  verifiedName: string;
  displayPhoneNumber: string;
  qualityRating: string;
  id: string;
}

/**
 * Send a text message via WhatsApp.
 */
export async function sendTextMessage(
  accessToken: string,
  phoneNumberId: string,
  to: string,
  text: string
): Promise<SendResult> {
  return sendMessage(accessToken, phoneNumberId, {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: text },
  });
}

/**
 * Send an image message via WhatsApp.
 */
export async function sendImageMessage(
  accessToken: string,
  phoneNumberId: string,
  to: string,
  imageUrl: string,
  caption?: string
): Promise<SendResult> {
  return sendMessage(accessToken, phoneNumberId, {
    messaging_product: "whatsapp",
    to,
    type: "image",
    image: { link: imageUrl, ...(caption ? { caption } : {}) },
  });
}

/**
 * Send a document message via WhatsApp.
 */
export async function sendDocumentMessage(
  accessToken: string,
  phoneNumberId: string,
  to: string,
  documentUrl: string,
  filename: string,
  caption?: string
): Promise<SendResult> {
  return sendMessage(accessToken, phoneNumberId, {
    messaging_product: "whatsapp",
    to,
    type: "document",
    document: { link: documentUrl, filename, ...(caption ? { caption } : {}) },
  });
}

/**
 * Send a template message via WhatsApp.
 */
export async function sendTemplateMessage(
  accessToken: string,
  phoneNumberId: string,
  to: string,
  templateName: string,
  language: string = "en",
  components?: Record<string, unknown>[]
): Promise<SendResult> {
  return sendMessage(accessToken, phoneNumberId, {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: language },
      ...(components ? { components } : {}),
    },
  });
}

/**
 * Download media from WhatsApp.
 */
export async function downloadMedia(
  accessToken: string,
  mediaId: string
): Promise<{ buffer: Buffer; mimeType: string }> {
  // Step 1: Get media URL
  const urlResponse = await fetch(
    `${META_GRAPH_URL}/${mediaId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!urlResponse.ok) {
    const err = await urlResponse.text();
    throw new Error(`Failed to get media URL: ${err}`);
  }

  const urlData = await urlResponse.json();
  const mediaUrl = urlData.url;
  const mimeType = urlData.mime_type || "application/octet-stream";

  // Step 2: Download media
  const mediaResponse = await fetch(mediaUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!mediaResponse.ok) {
    throw new Error(`Failed to download media: ${mediaResponse.status}`);
  }

  const arrayBuffer = await mediaResponse.arrayBuffer();
  return { buffer: Buffer.from(arrayBuffer), mimeType };
}

/**
 * Mark a message as read.
 */
export async function markAsRead(
  accessToken: string,
  phoneNumberId: string,
  messageId: string
): Promise<void> {
  await fetch(`${META_GRAPH_URL}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    }),
  });
}

/**
 * Get phone number info.
 */
export async function getPhoneNumberInfo(
  accessToken: string,
  phoneNumberId: string
): Promise<PhoneInfo> {
  const response = await fetch(
    `${META_GRAPH_URL}/${phoneNumberId}?fields=verified_name,display_phone_number,quality_rating,id`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to get phone info: ${err}`);
  }

  const data = await response.json();
  return {
    verifiedName: data.verified_name || "",
    displayPhoneNumber: data.display_phone_number || "",
    qualityRating: data.quality_rating || "UNKNOWN",
    id: data.id || "",
  };
}

/**
 * Internal: Send message to Meta API.
 */
async function sendMessage(
  accessToken: string,
  phoneNumberId: string,
  payload: Record<string, unknown>
): Promise<SendResult> {
  try {
    const response = await fetch(
      `${META_GRAPH_URL}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error?.message || `HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
