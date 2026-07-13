import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/widget/leads
 * List leads from widget conversations.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const widgetId = searchParams.get("widgetId");
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "20");

    const where: Record<string, unknown> = {};

    if (widgetId) {
      where.widgetId = widgetId;
    }

    const conversations = await prisma.widgetConversation.findMany({
      where,
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    const total = await prisma.widgetConversation.count({ where });

    const leads = conversations.map((conv) => ({
      id: conv.id,
      name: conv.leadName,
      email: conv.leadEmail,
      phone: conv.leadWhatsApp,
      score: conv.leadScore || "low",
      status: conv.leadStatus || "new",
      startedAt: conv.startedAt.toISOString(),
    }));

    return Response.json({ leads, total, page, perPage });
  } catch (error) {
    console.error("[Widget Leads] Error:", error);
    return Response.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}
