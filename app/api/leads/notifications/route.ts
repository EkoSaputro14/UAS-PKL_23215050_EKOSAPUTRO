import { NextRequest, NextResponse } from "next/server";
import { requireDashboardAuth } from "@/lib/api-auth";
import { prisma, setWorkspaceContext } from "@/lib/prisma";

/**
 * GET /api/leads/notifications
 * Returns unseen leads from last 24 hours for the notification bar.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireDashboardAuth(request);
    await setWorkspaceContext(auth.workspaceId);

    const since = new Date();
    since.setHours(since.getHours() - 24);

    const unseenLeads = await prisma.$transaction(async (tx) => {
      return tx.widgetConversation.findMany({
        where: {
          workspaceId: auth.workspaceId,
          seen: false,
          startedAt: { gte: since },
          OR: [
            { leadEmail: { not: null } },
            { leadWhatsApp: { not: null } },
            { leadName: { not: null } },
          ],
        },
        orderBy: { startedAt: "desc" },
        take: 10,
        select: {
          id: true,
          leadName: true,
          leadIntent: true,
          leadScore: true,
          startedAt: true,
        },
      });
    });

    return NextResponse.json({
      unseen: unseenLeads.map((l) => ({
        id: l.id,
        name: l.leadName || "Anonymous",
        intent: l.leadIntent || "unknown",
        score: l.leadScore || "low",
        createdAt: l.startedAt,
      })),
      count: unseenLeads.length,
    });
  } catch (error) {
    console.error("[Lead Notifications Error]", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
