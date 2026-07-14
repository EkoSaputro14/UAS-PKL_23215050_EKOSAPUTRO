import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/leads
 * List leads from WhatsApp conversations and widget conversations.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const source = searchParams.get("source") || "";
    const score = searchParams.get("score") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "50");

    // Fetch widget conversations as leads
    const widgetWhere: Record<string, unknown> = {};
    if (search) {
      widgetWhere.OR = [
        { leadName: { contains: search, mode: "insensitive" } },
        { leadEmail: { contains: search, mode: "insensitive" } },
        { leadWhatsApp: { contains: search, mode: "insensitive" } },
      ];
    }
    if (score && score !== "all") {
      widgetWhere.leadScore = score;
    }

    const widgetConvs = await prisma.widgetConversation.findMany({
      where: widgetWhere,
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    const widgetTotal = await prisma.widgetConversation.count({ where: widgetWhere });

    const leads = widgetConvs.map((conv) => ({
      id: conv.id,
      name: conv.leadName || "Unknown",
      email: conv.leadEmail,
      phone: conv.leadWhatsApp,
      source: "widget" as const,
      score: conv.leadScore || "low",
      status: conv.leadStatus || "new",
      intent: null,
      lastMessage: null,
      lastMessageAt: conv.startedAt?.toISOString(),
      createdAt: conv.startedAt.toISOString(),
      widgetName: "Widget",
    }));

    // Filter by source if needed
    const filteredLeads = source && source !== "all"
      ? leads.filter((l) => l.source === source)
      : leads;

    const stats = {
      total: widgetTotal,
      new: filteredLeads.filter((l) => l.status === "new").length,
      high: filteredLeads.filter((l) => l.score === "high").length,
      medium: filteredLeads.filter((l) => l.score === "medium").length,
      low: filteredLeads.filter((l) => l.score === "low").length,
    };

    return Response.json({
      leads: filteredLeads,
      total: widgetTotal,
      page,
      perPage,
      totalPages: Math.ceil(widgetTotal / perPage),
      stats,
    });
  } catch (error) {
    console.error("GET /api/leads error:", error);
    return Response.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/leads
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
    console.error("[Leads] Save error:", error);
    return Response.json({ error: "Failed to save lead" }, { status: 500 });
  }
}
