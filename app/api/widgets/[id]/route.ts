import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { setWorkspaceContext, resolveWorkspaceId } from "@/lib/prisma";
import { updateWidget } from "@/lib/widget";

/**
 * PATCH /api/widgets/:id
 * Update widget settings (session auth).
 * Body: { ...updates }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await resolveWorkspaceId(session.user.id!);
    await setWorkspaceContext(workspaceId);

    const { id: widgetId } = await params;
    const updates = await request.json();

    if (!widgetId) {
      return Response.json({ error: "widgetId is required" }, { status: 400 });
    }

    await updateWidget(workspaceId, widgetId, updates);

    return Response.json({ success: true });
  } catch (error) {
    console.error("[Widgets] PATCH error:", error);
    return Response.json({ error: "Failed to update widget" }, { status: 500 });
  }
}
