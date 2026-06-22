import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { streamRAGResponse } from "@/lib/rag/chain";

const BAILEYS_URL = process.env.BAILEYS_URL || "http://localhost:3002";
const BAILEYS_API_KEY = process.env.BAILEYS_API_KEY || "baileys-secret-key";
const DEFAULT_WORKSPACE_ID = process.env.BAILEYS_WORKSPACE_ID || "";

/**
 * Webhook endpoint called by the Baileys service when a new WhatsApp message arrives.
 *
 * Body: { phone, text, timestamp, from }
 *
 * Flow:
 * 1. Find or create WhatsApp conversation in DB
 * 2. Save incoming message
 * 3. Call RAG pipeline for AI response
 * 4. Send reply back via Baileys service
 * 5. Save reply message to DB
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, text, timestamp, from } = body;

    if (!phone || !text) {
      console.error("[Baileys Incoming] Missing phone or text:", body);
      return NextResponse.json(
        { error: "Missing phone or text" },
        { status: 400 }
      );
    }

    console.log(
      `[Baileys Incoming] Message from ${from} (${phone}): ${text.substring(0, 100)}`
    );

    // Resolve workspace ID
    let workspaceId = DEFAULT_WORKSPACE_ID;

    // If no default workspace set, try to find the first workspace
    if (!workspaceId) {
      const firstWorkspace = await prisma.workspace.findFirst({
        select: { id: true },
      });
      workspaceId = firstWorkspace?.id || "";
    }

    if (!workspaceId) {
      console.error("[Baileys Incoming] No workspace found");
      return NextResponse.json(
        { error: "No workspace configured" },
        { status: 500 }
      );
    }

    // Find or create a WhatsApp config for this workspace
    let config = await prisma.whatsAppConfig.findUnique({
      where: { workspaceId },
    });

    if (!config) {
      // Create a default Baileys config
      config = await prisma.whatsAppConfig.create({
        data: {
          workspaceId,
          phoneNumberId: "baileys",
          accessToken: BAILEYS_API_KEY,
          verifyToken: "baileys-verify",
          phoneNumber: phone,
          displayName: "Baileys Bot",
          isEnabled: true,
          autoReply: true,
        },
      });
      console.log("[Baileys Incoming] Created default WhatsApp config for workspace:", workspaceId);
    }

    // Find or create conversation
    let conversation = await prisma.whatsAppConversation.findUnique({
      where: {
        workspaceId_waId: {
          workspaceId,
          waId: phone,
        },
      },
    });

    if (!conversation) {
      conversation = await prisma.whatsAppConversation.create({
        data: {
          workspaceId,
          configId: config.id,
          waId: phone,
          contactName: from || null,
          leadName: from || null,
          leadWhatsApp: phone,
          messageCount: 0,
        },
      });
      console.log(`[Baileys Incoming] Created new conversation for ${phone}`);
    } else {
      // Update contact name if changed
      if (from && from !== conversation.contactName) {
        await prisma.whatsAppConversation.update({
          where: { id: conversation.id },
          data: { contactName: from },
        });
      }
    }

    // Save incoming message
    const incomingMessage = await prisma.whatsAppMessage.create({
      data: {
        conversationId: conversation.id,
        workspaceId,
        role: "user",
        content: text,
        messageType: "text",
        deliveryStatus: "received",
      },
    });

    // Update conversation metadata
    await prisma.whatsAppConversation.update({
      where: { id: conversation.id },
      data: {
        messageCount: { increment: 1 },
        lastMessageAt: new Date(timestamp ? timestamp * 1000 : Date.now()),
        lastMessagePreview: text.substring(0, 200),
      },
    });

    // Call RAG pipeline
    let aiReply: string;
    try {
      const ragResult = await streamRAGResponse(
        text,
        5, // topK
        workspaceId
      );

      // Collect the streaming response
      if (ragResult.stream) {
        let fullResponse = "";
        for await (const chunk of ragResult.stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          fullResponse += content;
        }
        aiReply = fullResponse;
      } else if (ragResult.refused && ragResult.refusalMessage) {
        // Refused to answer — use the refusal message
        aiReply = ragResult.refusalMessage;
      } else {
        aiReply = "Maaf, saya tidak dapat menjawab pertanyaan Anda saat ini.";
      }

      // Ensure we have a valid response
      if (!aiReply || !aiReply.trim()) {
        aiReply = "Maaf, saya tidak dapat menghasilkan jawaban saat ini.";
      }
    } catch (ragError) {
      console.error("[Baileys Incoming] RAG pipeline error:", ragError);
      aiReply =
        "Maaf, terjadi kesalahan saat memproses pertanyaan Anda. Silakan coba lagi.";
    }

    // Save AI reply to DB
    const replyMessage = await prisma.whatsAppMessage.create({
      data: {
        conversationId: conversation.id,
        workspaceId,
        role: "assistant",
        content: aiReply,
        messageType: "text",
        deliveryStatus: "sent",
      },
    });

    // Update conversation metadata
    await prisma.whatsAppConversation.update({
      where: { id: conversation.id },
      data: {
        messageCount: { increment: 1 },
        lastMessageAt: new Date(),
        lastMessagePreview: aiReply.substring(0, 200),
      },
    });

    // Send reply back via Baileys service
    try {
      const sendResponse = await fetch(`${BAILEYS_URL}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": BAILEYS_API_KEY,
        },
        body: JSON.stringify({
          phone,
          text: aiReply,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!sendResponse.ok) {
        console.error(
          "[Baileys Incoming] Failed to send reply:",
          sendResponse.status
        );
        await prisma.whatsAppMessage.update({
          where: { id: replyMessage.id },
          data: { deliveryStatus: "failed" },
        });
      } else {
        const sendData = await sendResponse.json();
        if (sendData.messageId) {
          await prisma.whatsAppMessage.update({
            where: { id: replyMessage.id },
            data: { metaMessageId: sendData.messageId },
          });
        }
      }
    } catch (sendError) {
      console.error("[Baileys Incoming] Send reply error:", sendError);
      await prisma.whatsAppMessage.update({
        where: { id: replyMessage.id },
        data: { deliveryStatus: "failed" },
      });
    }

    console.log(`[Baileys Incoming] Reply sent to ${phone}`);

    return NextResponse.json({
      success: true,
      conversationId: conversation.id,
      incomingMessageId: incomingMessage.id,
      replyMessageId: replyMessage.id,
    });
  } catch (error) {
    console.error("[Baileys Incoming] Error processing message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
