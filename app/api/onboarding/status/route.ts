import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, resolveWorkspaceId, setWorkspaceContext } from "@/lib/prisma";

/**
 * GET /api/onboarding/status
 * Returns current onboarding progress for the authenticated user.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id as string;
    const workspaceId = await resolveWorkspaceId(userId);
    await setWorkspaceContext(workspaceId);

    const progress = await prisma.onboardingProgress.findUnique({
      where: { userId },
    });

    if (!progress) {
      // No onboarding started yet — return default state
      return Response.json({
        exists: false,
        currentStep: 1,
        completed: false,
        data: {},
      });
    }

    return Response.json({
      exists: true,
      currentStep: progress.currentStep,
      completed: progress.completed,
      data: {
        businessName: progress.businessName,
        businessType: progress.businessType,
        businessDescription: progress.businessDescription,
        businessWhatsApp: progress.businessWhatsApp,
        businessPhone: progress.businessPhone,
        businessEmail: progress.businessEmail,
        businessAddress: progress.businessAddress,
        documentsUploaded: progress.documentsUploaded,
        testCompleted: progress.testCompleted,
        widgetId: progress.widgetId,
      },
    });
  } catch (error) {
    console.error("[Onboarding] Status error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
