import { NextRequest } from "next/server";
import { requireDashboardAuth, apiErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getPhoneNumberInfo } from "@/lib/whatsapp/client";

/**
 * POST /api/whatsapp/config/test
 * Test WhatsApp connection by fetching phone number info.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireDashboardAuth(request);

    const config = await prisma.whatsAppConfig.findUnique({
      where: { workspaceId: auth.workspaceId },
    });

    if (!config) {
      return Response.json(
        { error: { code: "not_found", message: "No WhatsApp config found. Save configuration first." } },
        { status: 404 }
      );
    }

    const phoneInfo = await getPhoneNumberInfo(config.accessToken, config.phoneNumberId);

    // Update config with verified info
    await prisma.whatsAppConfig.update({
      where: { workspaceId: auth.workspaceId },
      data: {
        phoneNumber: phoneInfo.displayPhoneNumber,
        displayName: phoneInfo.verifiedName,
      },
    });

    return Response.json({
      success: true,
      phone: {
        verifiedName: phoneInfo.verifiedName,
        displayPhoneNumber: phoneInfo.displayPhoneNumber,
        qualityRating: phoneInfo.qualityRating,
        id: phoneInfo.id,
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
