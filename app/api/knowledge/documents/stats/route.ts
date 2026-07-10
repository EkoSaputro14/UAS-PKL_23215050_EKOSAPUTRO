import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id!;

    // Sequential to ensure RLS workspace context propagates to all queries
    const totalDocuments = await prisma.document.count({ where: { userId } });
    const pdfCount = await prisma.document.count({ where: { userId, fileType: "pdf" } });
    const imageCount = await prisma.document.count({
      where: {
        userId,
        fileType: { in: ["png", "jpg", "jpeg", "webp", "gif", "image"] },
      },
    });
    const allDocs = await prisma.document.findMany({
      where: { userId },
      select: { chunkCount: true },
    });

    const totalChunks = allDocs.reduce((sum, doc) => sum + (doc.chunkCount || 0), 0);
    const pdfRatio = totalDocuments > 0 ? Math.round((pdfCount / totalDocuments) * 100) : 0;

    return Response.json({
      totalDocuments,
      totalChunks,
      pdfRatio,
      imageAssets: imageCount,
    });
  } catch (error) {
    console.error("Document stats API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
