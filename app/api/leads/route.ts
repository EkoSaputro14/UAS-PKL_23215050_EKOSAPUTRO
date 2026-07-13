import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/leads
 * List leads from WhatsApp conversations.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const source = searchParams.get("source") || "";

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { contactName: { contains: search, mode: "insensitive" } },
        { waId: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.leadStatus = status;
    }

    const conversations = await prisma.whatsAppConversation.findMany({
      where,
      orderBy: { lastMessageAt: "desc" },
      take: 50,
    });

    const leads = conversations.map((conv) => ({
      id: conv.id,
      name: conv.contactName || conv.waId,
      phone: conv.waId,
      email: conv.leadEmail,
      source: "whatsapp" as const,
      status: conv.leadStatus || "new",
      score: conv.leadScore || "low",
      intent: conv.leadIntent,
      lastMessage: conv.lastMessagePreview,
      lastMessageAt: conv.lastMessageAt?.toISOString(),
      createdAt: conv.createdAt.toISOString(),
      widgetName: null,
    }));

    return Response.json({ leads, total: leads.length });
  } catch (error) {
    console.error("GET /api/leads error:", error);
    return Response.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}
