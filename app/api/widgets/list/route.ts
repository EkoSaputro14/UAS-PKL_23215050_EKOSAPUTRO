import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/widgets/list
 * List all widgets for the current user.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const widgets = await prisma.widget.findMany({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: { conversations: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ widgets });
  } catch (error) {
    console.error("[Widgets] List error:", error);
    return Response.json({ error: "Failed to list widgets" }, { status: 500 });
  }
}
