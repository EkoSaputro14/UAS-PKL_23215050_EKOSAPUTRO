import { NextRequest } from "next/server";
import { requireDashboardAuth, apiErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { sendTextMessage } from "@/lib/whatsapp/client";

/**
 * GET /api/whatsapp/conversations/[id]/messages
 * Get messages for a conversation.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireDashboardAuth(request);
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "50");

    // Verify conversation belongs to workspace
    const conversation = await prisma.whatsAppConversation.findFirst({
      where: { id },
    });

    if (!conversation) {
      return Response.json({ error: { code: "not_found", message: "Conversation not found" } }, { status: 404 });
    }

    const [messages, total] = await Promise.all([
      prisma.whatsAppMessage.findMany({
        where: { conversationId: id },
        orderBy: { createdAt: "asc" },
        skip: (page - 1) * perPage,
        take: perPage,
        select: {
          id: true,
          role: true,
          content: true,
          messageType: true,
          mediaUrl: true,
          deliveryStatus: true,
          sources: true,
          createdAt: true,
        },
      }),
      prisma.whatsAppMessage.count({ where: { conversationId: id } }),
    ]);

    return Response.json({
      messages,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

/**
 * POST /api/whatsapp/conversations/[id]/messages
 * Send a manual reply to a WhatsApp conversation.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireDashboardAuth(request);
    const { id } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return Response.json(
        { error: { code: "invalid_request", message: "content is required" } },
        { status: 400 }
      );
    }

    // Verify conversation belongs to workspace and get config
    const conversation = await prisma.whatsAppConversation.findFirst({
      where: { id },
      include: { config: true },
    });

    if (!conversation) {
      return Response.json({ error: { code: "not_found", message: "Conversation not found" } }, { status: 404 });
    }

    if (!conversation.config.isEnabled) {
      return Response.json(
        { error: { code: "disabled", message: "WhatsApp integration is disabled" } },
        { status: 400 }
      );
    }

    // Send via Meta API
    const result = await sendTextMessage(
      conversation.config.accessToken,
      conversation.config.phoneNumberId,
      conversation.waId,
      content.trim()
    );

    // Save message
    const message = await prisma.whatsAppMessage.create({
      data: {
        conversationId: id,
        role: "assistant",
        content: content.trim(),
        messageType: "text",
        metaMessageId: result.messageId || null,
        deliveryStatus: result.success ? "sent" : "failed",
      },
    });

    // Update conversation
    await prisma.whatsAppConversation.update({
      where: { id },
      data: {
        messageCount: { increment: 1 },
        lastMessageAt: new Date(),
        lastMessagePreview: content.trim().substring(0, 200),
      },
    });

    if (!result.success) {
      return Response.json(
        { error: { code: "send_failed", message: result.error || "Failed to send message" } },
        { status: 502 }
      );
    }

    return Response.json({ success: true, messageId: result.messageId });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
