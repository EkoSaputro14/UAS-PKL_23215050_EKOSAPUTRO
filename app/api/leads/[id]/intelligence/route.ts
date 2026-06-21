import { NextRequest, NextResponse } from "next/server";
import { requireDashboardAuth } from "@/lib/api-auth";
import { prisma, setWorkspaceContext } from "@/lib/prisma";
import { generateIntelligence } from "@/lib/lead-intelligence";

/**
 * GET /api/leads/[id]/intelligence
 * Returns AI-generated intelligence for a lead.
 * Auto-generates on first request, caches in DB.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireDashboardAuth(request);
    await setWorkspaceContext(auth.workspaceId);

    const { id } = await params;

    // Try widget conversation
    const widgetConv = await prisma.$transaction(async (tx) => {
      return tx.widgetConversation.findFirst({
        where: { id, workspaceId: auth.workspaceId },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            select: { role: true, content: true },
          },
        },
      });
    });

    if (widgetConv) {
      // Check if intelligence already generated
      if (widgetConv.timeline || widgetConv.followUp) {
        return NextResponse.json({
          source: "widget",
          intelligence: {
            intent: widgetConv.leadIntent,
            budget: widgetConv.budget,
            timeline: widgetConv.timeline,
            followUp: widgetConv.followUp,
          },
          cached: true,
        });
      }

      // Generate intelligence from transcript
      const transcript = widgetConv.messages
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n");

      const intel = generateIntelligence(transcript);

      // Save to DB
      await prisma.$transaction(async (tx) => {
        await tx.widgetConversation.update({
          where: { id },
          data: {
            leadIntent: intel.intent,
            budget: intel.budget || widgetConv.budget,
            timeline: intel.timeline,
            followUp: intel.followUp,
          },
        });
      });

      return NextResponse.json({
        source: "widget",
        intelligence: {
          intent: intel.intent,
          budget: intel.budget || widgetConv.budget,
          timeline: intel.timeline,
          followUp: intel.followUp,
          keyQuestions: intel.keyQuestions,
        },
        cached: false,
      });
    }

    // Try WhatsApp conversation
    const waConv = await prisma.$transaction(async (tx) => {
      return tx.whatsAppConversation.findFirst({
        where: { id, workspaceId: auth.workspaceId },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            select: { role: true, content: true },
          },
        },
      });
    });

    if (waConv) {
      const transcript = waConv.messages
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n");

      const intel = generateIntelligence(transcript);

      return NextResponse.json({
        source: "whatsapp",
        intelligence: {
          intent: intel.intent,
          budget: intel.budget,
          timeline: intel.timeline,
          followUp: intel.followUp,
          keyQuestions: intel.keyQuestions,
        },
        cached: false,
      });
    }

    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  } catch (error) {
    console.error("[Lead Intelligence Error]", error);
    return NextResponse.json(
      { error: "Failed to generate intelligence" },
      { status: 500 }
    );
  }
}
