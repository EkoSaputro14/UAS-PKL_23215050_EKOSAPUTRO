import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/widget/leads
 * Save lead data from widget lead capture form.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { publicKey, sessionId, name, email, phone } = body;

    if (!publicKey || !sessionId) {
      return Response.json({ error: "publicKey and sessionId required" }, { status: 400 });
    }

    // Find widget
    const widget = await prisma.widget.findUnique({
      where: { publicKey },
    });

    if (!widget) {
      return Response.json({ error: "Widget not found" }, { status: 404 });
    }

    // Update conversation with lead data
    const conversation = await prisma.widgetConversation.update({
      where: { id: sessionId },
      data: {
        leadName: name || null,
        leadEmail: email || null,
        leadWhatsApp: phone || null,
      },
    });

    return Response.json({ success: true, conversationId: conversation.id });
  } catch (error) {
    console.error("[Widget Leads] Save error:", error);
    return Response.json({ error: "Failed to save lead" }, { status: 500 });
  }
}

/**
 * GET /api/widget/leads
 * List leads from widget conversations.
 */
export async function GET(request: NextRequest) {
  try {
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
