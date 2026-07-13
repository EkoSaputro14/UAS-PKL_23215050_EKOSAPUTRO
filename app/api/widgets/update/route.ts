import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/widgets/update
 * Update a widget.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, primaryColor, backgroundColor, textColor, welcomeMessage, position } = body;

    if (!id) {
      return Response.json({ error: "Widget ID is required" }, { status: 400 });
    }

    // Check ownership
    const widget = await prisma.widget.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!widget) {
      return Response.json({ error: "Widget not found" }, { status: 404 });
    }

    const updated = await prisma.widget.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(primaryColor && { primaryColor }),
        ...(backgroundColor && { backgroundColor }),
        ...(textColor && { textColor }),
        ...(welcomeMessage && { welcomeMessage }),
        ...(position && { position }),
      },
    });

    return Response.json({ widget: updated });
  } catch (error) {
    console.error("[Widgets] Update error:", error);
    return Response.json({ error: "Failed to update widget" }, { status: 500 });
  }
}
