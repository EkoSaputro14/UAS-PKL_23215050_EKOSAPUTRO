import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateRAGResponse } from "@/lib/rag/chain";
import { type PromptContext } from "@/lib/rag/chain";

/**
 * POST /api/widget/chat
 * Public chat endpoint for embedded widget.
 * Requires publicKey in request body.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { publicKey, message, sessionId } = body;

    if (!publicKey || !message) {
      return Response.json(
        { error: "publicKey and message are required" },
        { status: 400 }
      );
    }

    // Find widget by public key
    const widget = await prisma.widget.findUnique({
      where: { publicKey },
    });

    if (!widget || !widget.isActive) {
      return Response.json({ error: "Widget not found or inactive" }, { status: 404 });
    }

    // Get or create conversation
    let conversation;
    if (sessionId) {
      conversation = await prisma.widgetConversation.findFirst({
        where: { id: sessionId, widgetId: widget.id },
      });
    }

    if (!conversation) {
      conversation = await prisma.widgetConversation.create({
        data: {
          widgetId: widget.id,
          visitorId: body.visitorId || null,
        },
      });
    }

    // Save user message
    await prisma.widgetMessage.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: message,
      },
    });

    // Generate RAG response
    const promptContext: PromptContext = {
      mode: "customer_service",
      businessName: widget.name,
      businessDescription: "",
      contactInfo: {},
      knowledgeContext: "",
    };

    const ragResult = await generateRAGResponse(message, 5, undefined, 4000, promptContext);
    const response = ragResult.answer || "Maaf, saya tidak dapat menjawab pertanyaan Anda saat ini.";

    // Save assistant message
    await prisma.widgetMessage.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: response,
        tokensUsed: ragResult.sources?.length ? ragResult.sources.length * 100 : 0,
      },
    });

    return Response.json({
      success: true,
      response,
      sessionId: conversation.id,
      sources: ragResult.sources || [],
    });
  } catch (error) {
    console.error("[Widget Chat] Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
