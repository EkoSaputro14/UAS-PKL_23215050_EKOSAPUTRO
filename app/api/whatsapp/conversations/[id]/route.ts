import { NextRequest } from "next/server";
import { requireDashboardAuth, apiErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/whatsapp/conversations/[id]
 * Get conversation detail.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireDashboardAuth(request);
    const { id } = await params;

    const conversation = await prisma.whatsAppConversation.findFirst({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 100,
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
        },
      },
    });

    if (!conversation) {
      return Response.json({ error: { code: "not_found", message: "Conversation not found" } }, { status: 404 });
    }

    return Response.json({ conversation });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

/**
 * PATCH /api/whatsapp/conversations/[id]
 * Update lead status or score.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireDashboardAuth(request);
    const { id } = await params;
    const body = await request.json();
    const { status, score } = body;

    // Verify conversation belongs to workspace
    const conversation = await prisma.whatsAppConversation.findFirst({
      where: { id },
    });

    if (!conversation) {
      return Response.json({ error: { code: "not_found", message: "Conversation not found" } }, { status: 404 });
    }

    if (status) {
      await prisma.whatsAppConversation.update({
        where: { id },
        data: { leadStatus: status },
      });
    }

    if (score) {
      await prisma.whatsAppConversation.update({
        where: { id },
        data: { leadScore: score },
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
