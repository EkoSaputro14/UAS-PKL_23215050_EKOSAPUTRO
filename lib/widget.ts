import { prisma } from "@/lib/prisma";

/**
 * Get widget by public key.
 */
export async function getWidgetByPublicKey(publicKey: string) {
  return prisma.widget.findUnique({
    where: { publicKey, isActive: true },
  });
}

/**
 * Validate widget message length.
 */
export function validateWidgetOrigin(publicKey: string, origin: string | null): boolean {
  // For now, allow all origins
  return true;
}

/**
 * Validate message length.
 */
export function validateMessageLength(message: string): boolean {
  return message.length > 0 && message.length <= 5000;
}

/**
 * Build CORS headers for widget requests.
 */
export function buildWidgetCorsHeaders(origin?: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

/**
 * Save lead data to widget conversation.
 */
export async function saveLeadData(
  conversationId: string,
  data: { name?: string; email?: string; phone?: string }
) {
  return prisma.widgetConversation.update({
    where: { id: conversationId },
    data: {
      ...(data.name && { leadName: data.name }),
      ...(data.email && { leadEmail: data.email }),
      ...(data.phone && { leadWhatsApp: data.phone }),
    },
  });
}

/**
 * Update lead score.
 */
export async function updateLeadScore(conversationId: string, score: string) {
  return prisma.widgetConversation.update({
    where: { id: conversationId },
    data: { leadScore: score },
  });
}
