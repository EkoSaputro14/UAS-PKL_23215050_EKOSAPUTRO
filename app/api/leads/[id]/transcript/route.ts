import { NextRequest, NextResponse } from "next/server";
import { requireDashboardAuth } from "@/lib/api-auth";
import { prisma, setWorkspaceContext } from "@/lib/prisma";

/**
 * GET /api/leads/[id]/transcript
 * Returns full conversation transcript for a lead (widget or whatsapp).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireDashboardAuth(request);
    await setWorkspaceContext(auth.workspaceId);

    const { id } = await params;

    // Try widget conversation first
    const widgetConversation = await prisma.$transaction(async (tx) => {
      return tx.widgetConversation.findFirst({
        where: { id, workspaceId: auth.workspaceId },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              role: true,
              content: true,
              createdAt: true,
            },
          },
          widget: {
            select: { name: true },
          },
        },
      });
    });

    if (widgetConversation) {
      // Mark as seen if not already
      if (!widgetConversation.seen) {
        await prisma.$transaction(async (tx) => {
          await tx.widgetConversation.update({
            where: { id },
            data: { seen: true, seenAt: new Date() },
          });
        });
      }

      return NextResponse.json({
        source: "widget",
        conversation: {
          id: widgetConversation.id,
          name: widgetConversation.leadName,
          email: widgetConversation.leadEmail,
          whatsapp: widgetConversation.leadWhatsApp,
          score: widgetConversation.leadScore,
          status: widgetConversation.leadStatus,
          intent: widgetConversation.leadIntent,
          summary: widgetConversation.leadSummary,
          businessInterest: widgetConversation.businessInterest,
          budget: widgetConversation.budget,
          location: widgetConversation.location,
          timeline: widgetConversation.timeline,
          followUp: widgetConversation.followUp,
          startedAt: widgetConversation.startedAt,
          widgetName: widgetConversation.widget?.name || null,
        },
        messages: widgetConversation.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.createdAt,
        })),
        messageCount: widgetConversation.messages.length,
      });
    }

    // Try WhatsApp conversation
    const waConversation = await prisma.$transaction(async (tx) => {
      return tx.whatsAppConversation.findFirst({
        where: { id, workspaceId: auth.workspaceId },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              role: true,
              content: true,
              createdAt: true,
            },
          },
        },
      });
    });

    if (waConversation) {
      return NextResponse.json({
        source: "whatsapp",
        conversation: {
          id: waConversation.id,
          name: waConversation.leadName,
          email: waConversation.leadEmail,
          whatsapp: waConversation.leadWhatsApp,
          score: waConversation.leadScore,
          status: waConversation.leadStatus,
          intent: waConversation.leadIntent,
          startedAt: waConversation.createdAt,
          widgetName: null,
        },
        messages: waConversation.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.createdAt,
        })),
        messageCount: waConversation.messages.length,
      });
    }

    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  } catch (error) {
    console.error("[Lead Transcript Error]", error);
    return NextResponse.json(
      { error: "Failed to fetch transcript" },
      { status: 500 }
    );
  }
}
