import { NextRequest } from "next/server";
import { requireDashboardAuth, apiErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { requireFeature } from "@/lib/entitlements";
import { logAudit } from "@/lib/audit";

/**
 * GET /api/whatsapp/config
 * Get WhatsApp configuration for workspace.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireDashboardAuth(request);

    const config = await prisma.whatsAppConfig.findUnique({
      where: { workspaceId: auth.workspaceId },
      select: {
        id: true,
        workspaceId: true,
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

    return Response.json({ config });
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
    await requireFeature(auth.workspaceId, "whatsapp_integration");

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

    const config = await prisma.whatsAppConfig.upsert({
      where: { workspaceId: auth.workspaceId },
      create: {
        workspaceId: auth.workspaceId,
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
      update: {
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

    await logAudit({
      workspaceId: auth.workspaceId,
      actorId: auth.userId,
      actorType: "user",
      action: "whatsapp.config_updated",
      resourceType: "whatsapp_config",
      resourceId: config.id,
      metadata: { phoneNumberId },
    });

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

    const config = await prisma.whatsAppConfig.findUnique({
      where: { workspaceId: auth.workspaceId },
    });

    if (!config) {
      return Response.json({ error: { code: "not_found", message: "No WhatsApp config found" } }, { status: 404 });
    }

    await prisma.whatsAppConfig.delete({
      where: { workspaceId: auth.workspaceId },
    });

    await logAudit({
      workspaceId: auth.workspaceId,
      actorId: auth.userId,
      actorType: "user",
      action: "whatsapp.config_deleted",
      resourceType: "whatsapp_config",
      resourceId: config.id,
    });

    return Response.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
