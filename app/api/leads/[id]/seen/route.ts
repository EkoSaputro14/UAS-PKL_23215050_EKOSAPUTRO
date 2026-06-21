import { NextRequest, NextResponse } from "next/server";
import { requireDashboardAuth } from "@/lib/api-auth";
import { prisma, setWorkspaceContext } from "@/lib/prisma";

/**
 * POST /api/leads/[id]/seen
 * Marks a lead as seen (disappears from notification bar).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireDashboardAuth(request);
    await setWorkspaceContext(auth.workspaceId);

    const { id } = await params;

    // Try widget conversation
    const widgetConv = await prisma.$transaction(async (tx) => {
      return tx.widgetConversation.updateMany({
        where: { id, workspaceId: auth.workspaceId, seen: false },
        data: { seen: true, seenAt: new Date() },
      });
    });

    if (widgetConv.count > 0) {
      return NextResponse.json({ success: true, source: "widget" });
    }

    // WhatsApp conversations don't have `seen` field — just return success
    return NextResponse.json({ success: true, source: "whatsapp" });
  } catch (error) {
    console.error("[Lead Seen Error]", error);
    return NextResponse.json(
      { error: "Failed to mark as seen" },
      { status: 500 }
    );
  }
}
