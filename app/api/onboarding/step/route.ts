import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, resolveWorkspaceId, setWorkspaceContext } from "@/lib/prisma";

/**
 * PUT /api/onboarding/step
 * Update onboarding progress for a specific step.
 *
 * Body: { step: number, data: Record<string, any> }
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id as string;
    const workspaceId = await resolveWorkspaceId(userId);
    await setWorkspaceContext(workspaceId);

    const body = await request.json();
    const { step, data } = body;

    if (!step || step < 1 || step > 5) {
      return Response.json({ error: "Invalid step (1-5)" }, { status: 400 });
    }

    // Build update data based on step
    const updateData: Record<string, unknown> = {
      currentStep: step,
    };

    if (step === 1) {
      // Business Info
      if (data.businessName) updateData.businessName = data.businessName;
      if (data.businessType) updateData.businessType = data.businessType;
    } else if (step === 2) {
      // Business Description
      if (data.businessDescription) updateData.businessDescription = data.businessDescription;
      if (data.businessWhatsApp) updateData.businessWhatsApp = data.businessWhatsApp;
      if (data.businessPhone) updateData.businessPhone = data.businessPhone;
      if (data.businessEmail) updateData.businessEmail = data.businessEmail;
      if (data.businessAddress) updateData.businessAddress = data.businessAddress;
    } else if (step === 3) {
      // Documents uploaded
      if (data.documentsUploaded !== undefined) {
        updateData.documentsUploaded = data.documentsUploaded;
      }
    } else if (step === 4) {
      // Test completed
      updateData.testCompleted = true;
    } else if (step === 5) {
      // Widget published
      if (data.widgetId) updateData.widgetId = data.widgetId;
      updateData.completed = true;
      updateData.completedAt = new Date();
    }

    // Upsert onboarding progress
    const progress = await prisma.onboardingProgress.upsert({
      where: { userId },
      create: {
        userId,
        workspaceId,
        ...updateData,
      },
      update: updateData,
    });

    return Response.json({
      success: true,
      currentStep: progress.currentStep,
      completed: progress.completed,
    });
  } catch (error) {
    console.error("[Onboarding] Step update error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
