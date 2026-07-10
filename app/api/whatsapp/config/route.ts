import { NextRequest } from "next/server";
import { requireDashboardAuth, apiErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/whatsapp/config
 * Get WhatsApp configuration for workspace.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireDashboardAuth(request);

    const config = await prisma.whatsAppConfig.findFirst({
      select: {
        id: true,
        phoneNumberId: true,
        phoneNumber: true,
        displayName: true,
        isEnabled: true,
        welcomeMessage: true,
        offlineMessage: true,
        autoReply: true,
        businessAccountId: true,
        createdAt: true,
        updatedAt: true,
        // Exclude accessToken, appSecret, verifyToken from response
      },
    });

    return Response.json({ config: config ?? null });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

/**
 * POST /api/whatsapp/config
 * Create or update WhatsApp configuration.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireDashboardAuth(request);
    const body = await request.json();
    const {
      phoneNumberId,
      accessToken,
      verifyToken,
      appSecret,
      businessAccountId,
      phoneNumber,
      displayName,
      welcomeMessage,
      offlineMessage,
      autoReply,
    } = body;

    if (!phoneNumberId || !accessToken || !verifyToken) {
      return Response.json(
        { error: { code: "invalid_request", message: "phoneNumberId, accessToken, and verifyToken are required" } },
        { status: 400 }
      );
    }

    const existingConfig = await prisma.whatsAppConfig.findFirst();
    let config;
    if (existingConfig) {
      config = await prisma.whatsAppConfig.update({
        where: { id: existingConfig.id },
        data: {
          phoneNumberId,
          accessToken,
          verifyToken,
          ...(appSecret !== undefined ? { appSecret } : {}),
          ...(businessAccountId !== undefined ? { businessAccountId } : {}),
          ...(phoneNumber !== undefined ? { phoneNumber } : {}),
          ...(displayName !== undefined ? { displayName } : {}),
          ...(welcomeMessage !== undefined ? { welcomeMessage } : {}),
          ...(offlineMessage !== undefined ? { offlineMessage } : {}),
          ...(autoReply !== undefined ? { autoReply } : {}),
        },
      });
    } else {
      config = await prisma.whatsAppConfig.create({
        data: {
          phoneNumberId,
          accessToken,
          verifyToken,
          appSecret: appSecret || null,
          businessAccountId: businessAccountId || null,
          phoneNumber: phoneNumber || null,
          displayName: displayName || null,
          welcomeMessage: welcomeMessage || null,
          offlineMessage: offlineMessage || null,
          autoReply: autoReply !== false,
        },
      });
    }

    return Response.json({ success: true, config: { id: config.id } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

/**
 * DELETE /api/whatsapp/config
 * Delete WhatsApp configuration.
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireDashboardAuth(request);

    const config = await prisma.whatsAppConfig.findFirst();

    if (!config) {
      return Response.json({ error: { code: "not_found", message: "No WhatsApp config found" } }, { status: 404 });
    }

    await prisma.whatsAppConfig.delete({
      where: { id: config.id },
    });

    return Response.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
