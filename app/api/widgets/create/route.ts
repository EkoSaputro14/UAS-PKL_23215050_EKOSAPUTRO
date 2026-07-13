import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * POST /api/widgets/create
 * Create a new widget.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug } = body;

    if (!name || !slug) {
      return Response.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    // Check if slug is unique
    const existing = await prisma.widget.findUnique({
      where: { slug },
    });

    if (existing) {
      return Response.json(
        { error: "Slug already exists" },
        { status: 400 }
      );
    }

    const widget = await prisma.widget.create({
      data: {
        userId: session.user.id,
        name,
        slug,
        publicKey: crypto.randomBytes(32).toString("hex"),
        secretKey: crypto.randomBytes(32).toString("hex"),
      },
    });

    return Response.json({ widget }, { status: 201 });
  } catch (error) {
    console.error("[Widgets] Create error:", error);
    return Response.json({ error: "Failed to create widget" }, { status: 500 });
  }
}
