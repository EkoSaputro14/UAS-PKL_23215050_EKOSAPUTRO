import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, resolveWorkspaceId, setWorkspaceContext } from "@/lib/prisma";
import { createWidget } from "@/lib/widget";

/**
 * POST /api/onboarding/complete
 * Complete onboarding: create widget with business profile.
 *
 * Body: { businessName, businessType, businessDescription, contactInfo }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id as string;
    const workspaceId = await resolveWorkspaceId(userId);
    await setWorkspaceContext(workspaceId);

    const body = await request.json();
    const { businessName, businessType, businessDescription, contactInfo } = body;

    if (!businessName || businessName.trim().length < 2) {
      return Response.json({ error: "Business name required (min 2 chars)" }, { status: 400 });
    }

    // Create widget with business profile
    const slug = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const widget = await createWidget(workspaceId, businessName, slug, {
      primaryColor: "#4F6BFF",
      welcomeMessage: `Halo! Selamat datang di ${businessName}. Ada yang bisa saya bantu? 😊`,
      leadCaptureEnabled: true,
      autoTriggerMessages: 3,
      businessName,
      businessDescription: businessDescription || "",
      businessWhatsApp: contactInfo?.whatsapp || "",
      businessPhone: contactInfo?.phone || "",
      businessEmail: contactInfo?.email || "",
      businessAddress: contactInfo?.address || "",
    });

    // Update onboarding progress
    await prisma.onboardingProgress.upsert({
      where: { userId },
      create: {
        userId,
        workspaceId,
        currentStep: 5,
        businessName,
        businessType,
        businessDescription,
        businessWhatsApp: contactInfo?.whatsapp,
        businessPhone: contactInfo?.phone,
        businessEmail: contactInfo?.email,
        businessAddress: contactInfo?.address,
        widgetId: widget.id,
        completed: true,
        completedAt: new Date(),
      },
      update: {
        currentStep: 5,
        widgetId: widget.id,
        completed: true,
        completedAt: new Date(),
      },
    });

    return Response.json({
      success: true,
      widget: {
        id: widget.id,
        name: widget.name,
        publicKey: widget.publicKey,
        slug: widget.slug,
      },
    });
  } catch (error) {
    console.error("[Onboarding] Complete error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
