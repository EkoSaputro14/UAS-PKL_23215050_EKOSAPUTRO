import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, resolveWorkspaceId, setWorkspaceContext } from "@/lib/prisma";

/**
 * GET /api/knowledge/documents/[id]
 * Returns document status for upload polling.
 * Includes error_message and chunk count for UX feedback.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const workspaceId = await resolveWorkspaceId(session.user.id! as string);
    await setWorkspaceContext(workspaceId);

    const document = await prisma.document.findFirst({
      where: {
        id,
        workspaceId,
      },
      include: {
        _count: { select: { chunks: true } },
      },
    });

    if (!document) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    return Response.json({
      id: document.id,
      title: document.title,
      fileType: document.fileType,
      status: document.status,
      chunkCount: document.chunkCount || document._count.chunks,
      errorMessage: document.errorMessage || null,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    });
  } catch (error) {
    console.error("Document detail API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
