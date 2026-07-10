import { NextRequest } from "next/server";
import { requireDashboardAuth, apiErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/whatsapp/conversations
 * List WhatsApp conversations for workspace.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireDashboardAuth(request);
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "20");
    const status = searchParams.get("status");
    const score = searchParams.get("score");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {
      ...(status ? { leadStatus: status } : {}),
      ...(score ? { leadScore: score } : {}),
      ...(search
        ? {
            OR: [
              { contactName: { contains: search, mode: "insensitive" } },
              { waId: { contains: search } },
              { leadName: { contains: search, mode: "insensitive" } },
              { leadEmail: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [conversations, total] = await Promise.all([
      prisma.whatsAppConversation.findMany({
        where,
        orderBy: { lastMessageAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
        select: {
          id: true,
          waId: true,
          contactName: true,
          leadName: true,
          leadEmail: true,
          leadScore: true,
          leadStatus: true,
          leadIntent: true,
          messageCount: true,
          lastMessageAt: true,
          lastMessagePreview: true,
          createdAt: true,
        },
      }),
      prisma.whatsAppConversation.count({ where }),
    ]);

    return Response.json({
      conversations,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
