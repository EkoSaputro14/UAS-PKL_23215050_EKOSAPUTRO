/**
 * WhatsApp Message Processor
 * Processes incoming messages through RAG pipeline and sends responses.
 */

import { prisma, setWorkspaceContext } from "@/lib/prisma";
import { generateRAGResponse } from "@/lib/rag/chain";
import { recordAnalyticsEvent } from "@/lib/analytics";
import { trackChatMessage } from "@/lib/usage";
import { logAudit } from "@/lib/audit";
import { detectIntent, calculateLeadScore } from "@/lib/lead-intent";
import { sendTextMessage, markAsRead, downloadMedia } from "./client";
import { WebhookPayload } from "./webhook";

/**
 * Process an incoming WhatsApp message.
 */
export async function processIncomingMessage(payload: WebhookPayload): Promise<void> {
  const { phoneNumberId, from, messageId, type, text, image, document, contactName } = payload;

  // Skip non-text/image/document messages for now
  if (!["text", "image", "document"].includes(type)) {
    console.log(`[WhatsApp] Skipping message type: ${type}`);
    return;
  }

  // 1. Resolve workspace from phone_number_id
  const config = await prisma.whatsAppConfig.findFirst({
    where: { phoneNumberId, isEnabled: true },
  });

  if (!config) {
    console.error(`[WhatsApp] No config found for phone_number_id: ${phoneNumberId}`);
    return;
  }

  const workspaceId = config.workspaceId;
  await setWorkspaceContext(workspaceId);

  // 2. Find or create conversation
  let conversation = await prisma.whatsAppConversation.findFirst({
    where: { workspaceId, waId: from },
  });

  if (!conversation) {
    conversation = await prisma.whatsAppConversation.create({
      data: {
        workspaceId,
        configId: config.id,
        waId: from,
        contactName: contactName || null,
        leadWhatsApp: from,
        leadName: contactName || null,
      },
    });
  } else if (contactName && !conversation.contactName) {
    await prisma.whatsAppConversation.update({
      where: { id: conversation.id },
      data: { contactName },
    });
  }

  // 3. Determine message content
  let messageContent = "";
  let messageType = type;

  if (type === "text" && text) {
    messageContent = text.body;
  } else if (type === "image" && image) {
    // Download image and describe it
    messageContent = await processMediaMessage(config.accessToken, image.id, "image", image.caption);
  } else if (type === "document" && document) {
    messageContent = await processMediaMessage(config.accessToken, document.id, "document", document.caption);
  }

  if (!messageContent.trim()) {
    messageContent = `[${type} message received]`;
  }

  // 4. Save incoming message
  await prisma.whatsAppMessage.create({
    data: {
      conversationId: conversation.id,
      workspaceId,
      role: "user",
      content: messageContent,
      messageType,
      metaMessageId: messageId,
      deliveryStatus: "delivered",
    },
  });

  // 5. Mark as read
  try {
    await markAsRead(config.accessToken, phoneNumberId, messageId);
  } catch (err) {
    console.error("[WhatsApp] Failed to mark as read:", err);
  }

  // 6. Update conversation
  await prisma.whatsAppConversation.update({
    where: { id: conversation.id },
    data: {
      messageCount: { increment: 1 },
      lastMessageAt: new Date(),
      lastMessagePreview: messageContent.substring(0, 200),
    },
  });

  // 7. Auto-reply check
  if (!config.autoReply) {
    if (config.offlineMessage) {
      await sendTextMessage(config.accessToken, phoneNumberId, from, config.offlineMessage);
    }
    return;
  }

  // 8. Run RAG pipeline
  try {
    const ragResponse = await generateRAGResponse(messageContent, 3, workspaceId, 0.30);

    const aiResponse = ragResponse.answer || "Maaf, saya tidak dapat menemukan jawaban untuk pertanyaan Anda.";
    const sources = ragResponse.sources || [];

    // 9. Save AI response
    await prisma.whatsAppMessage.create({
      data: {
        conversationId: conversation.id,
        workspaceId,
        role: "assistant",
        content: aiResponse,
        messageType: "text",
        sources: sources.length > 0 ? (sources as any) : undefined,
      },
    });

    // 10. Send response via WhatsApp
    const sendResult = await sendTextMessage(config.accessToken, phoneNumberId, from, aiResponse);

    if (sendResult.success && sendResult.messageId) {
      // Update the message with Meta's message ID
      await prisma.whatsAppMessage.updateMany({
        where: {
          conversationId: conversation.id,
          role: "assistant",
          metaMessageId: null,
        },
        data: { metaMessageId: sendResult.messageId, deliveryStatus: "sent" },
      });
    }

    // 11. Detect intent and update lead score
    const intent = detectIntent(messageContent);
    const hasLead = !!(conversation.leadName || conversation.leadEmail);
    const score = calculateLeadScore(hasLead, intent, conversation.messageCount + 1);

    await prisma.whatsAppConversation.update({
      where: { id: conversation.id },
      data: {
        leadScore: score,
        leadIntent: intent || undefined,
        messageCount: { increment: 1 },
        lastMessageAt: new Date(),
        lastMessagePreview: aiResponse.substring(0, 200),
      },
    });

    // 12. Track analytics and usage
    await recordAnalyticsEvent("whatsapp_chat", {
      conversationId: conversation.id,
      messageCount: conversation.messageCount + 1,
      leadScore: score,
      leadIntent: intent,
      channel: "whatsapp",
    }).catch((err) => console.error("[Analytics] Failed:", err));

    await trackChatMessage(workspaceId).catch((err) =>
      console.error("[Usage] Failed:", err)
    );

    // 13. Audit log
    await logAudit({
      workspaceId,
      actorId: "system",
      actorType: "system",
      action: "whatsapp.message_received",
      resourceType: "whatsapp_conversation",
      resourceId: conversation.id,
      metadata: { from, messageType, leadScore: score },
    }).catch((err) => console.error("[Audit] Failed:", err));

  } catch (error) {
    console.error("[WhatsApp] RAG pipeline failed:", error);
    // Send fallback message
    const fallback = config.offlineMessage || "Maaf, terjadi kesalahan. Silakan coba lagi nanti.";
    await sendTextMessage(config.accessToken, phoneNumberId, from, fallback).catch(() => {});
  }
}

/**
 * Process media message (image/document).
 */
async function processMediaMessage(
  accessToken: string,
  mediaId: string,
  type: "image" | "document",
  caption?: string
): Promise<string> {
  try {
    const { buffer, mimeType } = await downloadMedia(accessToken, mediaId);

    // For images, describe what we received
    if (type === "image") {
      const sizeMB = (buffer.length / 1024 / 1024).toFixed(1);
      return caption
        ? `${caption} [Image: ${mimeType}, ${sizeMB}MB]`
        : `[Image received: ${mimeType}, ${sizeMB}MB]`;
    }

    // For documents
    const sizeMB = (buffer.length / 1024 / 1024).toFixed(1);
    return caption
      ? `${caption} [Document: ${mimeType}, ${sizeMB}MB]`
      : `[Document received: ${mimeType}, ${sizeMB}MB]`;
  } catch (error) {
    console.error(`[WhatsApp] Failed to process ${type}:`, error);
    return `[${type} received but could not be processed]`;
  }
}
