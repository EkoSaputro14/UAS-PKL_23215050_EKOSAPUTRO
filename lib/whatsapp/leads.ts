/**
 * WhatsApp Lead Integration
 * Lead extraction, scoring, querying, and export.
 */

import { prisma } from "@/lib/prisma";
import { LeadScore, LeadStatus } from "@/lib/lead-intent";
import { Prisma } from "@prisma/client";

export interface LeadFilters {
  status?: string;
  score?: string;
  widgetId?: string;
  page?: number;
  perPage?: number;
}

/**
 * Extract initial lead data from WhatsApp contact info.
 */
export function extractLeadFromWhatsApp(
  contactName: string | null,
  waId: string
): { name?: string; whatsapp: string } {
  return {
    name: contactName || undefined,
    whatsapp: waId,
  };
}

/**
 * Update lead data for a WhatsApp conversation.
 */
export async function updateWhatsAppLead(
  conversationId: string,
  leadData: { name?: string; email?: string; whatsapp?: string; data?: Record<string, unknown> }
): Promise<void> {
  await prisma.whatsAppConversation.update({
    where: { id: conversationId },
    data: {
      ...(leadData.name ? { leadName: leadData.name } : {}),
      ...(leadData.email ? { leadEmail: leadData.email } : {}),
      ...(leadData.whatsapp ? { leadWhatsApp: leadData.whatsapp } : {}),
      ...(leadData.data ? { leadData: leadData.data as Prisma.InputJsonValue } : {}),
    },
  });
}

/**
 * Update lead status for a WhatsApp conversation.
 */
export async function updateWhatsAppLeadStatus(
  conversationId: string,
  status: LeadStatus
): Promise<void> {
  await prisma.whatsAppConversation.update({
    where: { id: conversationId },
    data: { leadStatus: status },
  });
}

/**
 * Update lead score for a WhatsApp conversation.
 */
export async function updateWhatsAppLeadScore(
  conversationId: string,
  score: LeadScore
): Promise<void> {
  await prisma.whatsAppConversation.update({
    where: { id: conversationId },
    data: { leadScore: score },
  });
}

/**
 * Get paginated WhatsApp leads.
 */
export async function getWhatsAppLeads(
  workspaceId: string,
  filters: LeadFilters = {}
) {
  const { status, score, page = 1, perPage = 20 } = filters;

  const where: Record<string, unknown> = {
    workspaceId,
    leadEmail: { not: null },
    ...(status ? { leadStatus: status } : {}),
    ...(score ? { leadScore: score } : {}),
  };

  const [leads, total] = await Promise.all([
    prisma.whatsAppConversation.findMany({
      where,
      orderBy: { lastMessageAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        waId: true,
        contactName: true,
        leadName: true,
        leadEmail: true,
        leadWhatsApp: true,
        leadScore: true,
        leadStatus: true,
        leadIntent: true,
        messageCount: true,
        lastMessageAt: true,
        createdAt: true,
      },
    }),
    prisma.whatsAppConversation.count({ where }),
  ]);

  return {
    leads,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

/**
 * Export WhatsApp leads as CSV.
 */
export async function exportWhatsAppLeads(workspaceId: string): Promise<string> {
  const leads = await prisma.whatsAppConversation.findMany({
    where: {
      workspaceId,
      leadEmail: { not: null },
    },
    orderBy: { createdAt: "desc" },
    select: {
      waId: true,
      contactName: true,
      leadName: true,
      leadEmail: true,
      leadWhatsApp: true,
      leadScore: true,
      leadStatus: true,
      leadIntent: true,
      messageCount: true,
      lastMessageAt: true,
      createdAt: true,
    },
  });

  const headers = [
    "WhatsApp ID",
    "Contact Name",
    "Lead Name",
    "Email",
    "WhatsApp",
    "Score",
    "Status",
    "Intent",
    "Messages",
    "Last Message",
    "Created At",
  ];

  const rows = leads.map((lead) => [
    lead.waId,
    lead.contactName || "",
    lead.leadName || "",
    lead.leadEmail || "",
    lead.leadWhatsApp || "",
    lead.leadScore || "low",
    lead.leadStatus || "new",
    lead.leadIntent || "",
    String(lead.messageCount),
    lead.lastMessageAt?.toISOString() || "",
    lead.createdAt.toISOString(),
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(","))].join("\n");

  return csv;
}
