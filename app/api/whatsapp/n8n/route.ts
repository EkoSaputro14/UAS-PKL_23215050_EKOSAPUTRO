import { NextRequest } from "next/server";
import { generateRAGResponse } from "@/lib/rag/chain";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * POST /api/whatsapp/n8n
 *
 * API endpoint untuk n8n workflow.
 * Menerima pesan dari n8n, proses dengan AI, kirim response balik.
 *
 * Security:
 * - Requires authentication (session cookie or API key)
 * - No workspace injection — uses authenticated user's context
 *
 * Body: {
 *   message: string,
 *   phone: string,
 *   sessionId?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { message, phone, sessionId } = body;

    if (!message || !phone) {
      return Response.json(
        { error: "message and phone are required" },
        { status: 400 }
      );
    }

    // Get or create session — tied to authenticated user
    let sessionRecord;
    if (sessionId) {
      sessionRecord = await prisma.chatSession.findFirst({
        where: { id: sessionId, userId },
      });
    }

    if (!sessionRecord) {
      sessionRecord = await prisma.chatSession.create({
        data: {
          userId,
          title: `WhatsApp: ${phone}`,
        },
      });
    }

    // Save user message
    await prisma.chatMessage.create({
      data: {
        sessionId: sessionRecord.id,
        role: "user",
        content: message,
      },
    });

    // Generate RAG response
    const ragResult = await generateRAGResponse(message, 5);
    const response = ragResult.answer || "Maaf, saya tidak dapat menjawab pertanyaan Anda saat ini.";

    // Save assistant message
    await prisma.chatMessage.create({
      data: {
        sessionId: sessionRecord.id,
        role: "assistant",
        content: response,
        sources: ragResult.sources ? JSON.parse(JSON.stringify(ragResult.sources)) : null,
      },
    });

    return Response.json({
      success: true,
      response,
      sessionId: sessionRecord.id,
      sources: ragResult.sources || [],
    });
  } catch (error) {
    console.error("[WhatsApp N8N] Error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/whatsapp/n8n
 * Health check for n8n integration.
 */
export async function GET() {
  return Response.json({
    status: "ok",
    endpoint: "/api/whatsapp/n8n",
    method: "POST",
    requiredFields: ["message", "phone"],
    optionalFields: ["sessionId"],
    note: "Authentication required. Use session cookie or API key.",
  });
}
