/**
 * Unified Lead Management
 * 
 * Aggregates leads from Widget Conversations and WhatsApp Conversations
 * into a single view for the business owner dashboard.
 */

import { prisma } from "@/lib/prisma";
import { LeadScore, LeadStatus } from "@/lib/lead-intent";

export interface LeadItem {
  id: string;
  source: "widget" | "whatsapp";
  name: string | null;
  email: string | null;
  whatsapp: string | null;
  score: string | null;
  status: string | null;
  intent: string | null;
  messageCount: number;
  lastMessageAt: Date | null;
  createdAt: Date;
  widgetName: string | null;
  leadSummary?: string | null;
  businessInterest?: string | null;
  budget?: string | null;
  location?: string | null;
}

export interface LeadListResult {
  leads: LeadItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  stats: {
    total: number;
    new: number;
    high: number;
    medium: number;
    low: number;
  };
}

/**
 * Get unified leads from both widget and WhatsApp conversations.
 */
export async function getUnifiedLeads(
  workspaceId: string,
  filters: {
    source?: string;
    status?: string;
    score?: string;
    search?: string;
    page?: number;
    perPage?: number;
  } = {}
): Promise<LeadListResult> {
  const { source, status, score, search, page = 1, perPage = 20 } = filters;

  // Build widget leads query
  const widgetWhere: any = {
    workspaceId,
    // Has at least one lead field populated
    OR: [
      { leadEmail: { not: null } },
      { leadWhatsApp: { not: null } },
      { leadName: { not: null } },
    ],
  };
  if (status) widgetWhere.leadStatus = status;
  if (score) widgetWhere.leadScore = score;
  if (search) {
    widgetWhere.OR = [
      { leadName: { contains: search, mode: "insensitive" } },
      { leadEmail: { contains: search, mode: "insensitive" } },
      { leadWhatsApp: { contains: search } },
    ];
  }

  // Build WhatsApp leads query
  const waWhere: any = {
    workspaceId,
    OR: [
      { leadEmail: { not: null } },
      { leadWhatsApp: { not: null } },
      { leadName: { not: null } },
    ],
  };
  if (status) waWhere.leadStatus = status;
  if (score) waWhere.leadScore = score;
  if (search) {
    waWhere.OR = [
      { leadName: { contains: search, mode: "insensitive" } },
      { leadEmail: { contains: search, mode: "insensitive" } },
      { leadWhatsApp: { contains: search } },
    ];
  }

  // Fetch from both sources (or filtered)
  const fetchWidget = !source || source === "widget";
  const fetchWhatsApp = !source || source === "whatsapp";

  const [widgetLeads, widgetTotal, waLeads, waTotal] = await Promise.all([
    fetchWidget
      ? prisma.widgetConversation.findMany({
          where: widgetWhere,
          orderBy: { startedAt: "desc" },
          select: {
            id: true,
            leadName: true,
            leadEmail: true,
            leadWhatsApp: true,
            leadScore: true,
            leadStatus: true,
            leadIntent: true,
            leadSummary: true,
            businessInterest: true,
            budget: true,
            location: true,
            startedAt: true,
            widget: { select: { name: true } },
            _count: { select: { messages: true } },
          },
        })
      : Promise.resolve([]),
    fetchWidget
      ? prisma.widgetConversation.count({ where: widgetWhere })
      : Promise.resolve(0),
    fetchWhatsApp
      ? prisma.whatsAppConversation.findMany({
          where: waWhere,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
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
        })
      : Promise.resolve([]),
    fetchWhatsApp
      ? prisma.whatsAppConversation.count({ where: waWhere })
      : Promise.resolve(0),
  ]);

  // Normalize widget leads
  const widgetItems: LeadItem[] = widgetLeads.map((l) => ({
    id: l.id,
    source: "widget" as const,
    name: l.leadName,
    email: l.leadEmail,
    whatsapp: l.leadWhatsApp,
    score: l.leadScore,
    status: l.leadStatus,
    intent: l.leadIntent,
    messageCount: l._count.messages,
    lastMessageAt: l.startedAt,
    createdAt: l.startedAt,
    widgetName: l.widget?.name || null,
    leadSummary: l.leadSummary,
    businessInterest: l.businessInterest,
    budget: l.budget,
    location: l.location,
  }));

  // Normalize WhatsApp leads
  const waItems: LeadItem[] = waLeads.map((l) => ({
    id: l.id,
    source: "whatsapp" as const,
    name: l.leadName,
    email: l.leadEmail,
    whatsapp: l.leadWhatsApp,
    score: l.leadScore,
    status: l.leadStatus,
    intent: l.leadIntent,
    messageCount: l.messageCount,
    lastMessageAt: l.lastMessageAt,
    createdAt: l.createdAt,
    widgetName: null,
  }));

  // Merge and sort by most recent
  let allLeads = [...widgetItems, ...waItems].sort((a, b) => {
    const dateA = a.lastMessageAt || a.createdAt;
    const dateB = b.lastMessageAt || b.createdAt;
    return dateB.getTime() - dateA.getTime();
  });

  const total = widgetTotal + waTotal;

  // Paginate
  const start = (page - 1) * perPage;
  const paginatedLeads = allLeads.slice(start, start + perPage);

  // Calculate stats from all leads
  const statsData = await Promise.all([
    prisma.widgetConversation.count({
      where: { workspaceId, OR: [{ leadEmail: { not: null } }, { leadWhatsApp: { not: null } }, { leadName: { not: null } }] },
    }),
    prisma.whatsAppConversation.count({
      where: { workspaceId, OR: [{ leadEmail: { not: null } }, { leadWhatsApp: { not: null } }, { leadName: { not: null } }] },
    }),
    prisma.widgetConversation.count({ where: { workspaceId, leadStatus: "new" } }),
    prisma.whatsAppConversation.count({ where: { workspaceId, leadStatus: "new" } }),
    prisma.widgetConversation.count({ where: { workspaceId, leadScore: "high" } }),
    prisma.whatsAppConversation.count({ where: { workspaceId, leadScore: "high" } }),
    prisma.widgetConversation.count({ where: { workspaceId, leadScore: "medium" } }),
    prisma.whatsAppConversation.count({ where: { workspaceId, leadScore: "medium" } }),
    prisma.widgetConversation.count({ where: { workspaceId, leadScore: "low" } }),
    prisma.whatsAppConversation.count({ where: { workspaceId, leadScore: "low" } }),
  ]);

  return {
    leads: paginatedLeads,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
    stats: {
      total: statsData[0] + statsData[1],
      new: statsData[2] + statsData[3],
      high: statsData[4] + statsData[5],
      medium: statsData[6] + statsData[7],
      low: statsData[8] + statsData[9],
    },
  };
}

/**
 * Update lead status (works for both widget and WhatsApp conversations).
 */
export async function updateLeadStatus(
  conversationId: string,
  source: "widget" | "whatsapp",
  status: LeadStatus
): Promise<void> {
  if (source === "widget") {
    await prisma.widgetConversation.update({
      where: { id: conversationId },
      data: { leadStatus: status },
    });
  } else {
    await prisma.whatsAppConversation.update({
      where: { id: conversationId },
      data: { leadStatus: status },
    });
  }
}

/**
 * Update lead score (works for both sources).
 */
export async function updateLeadScoreUnified(
  conversationId: string,
  source: "widget" | "whatsapp",
  score: LeadScore
): Promise<void> {
  if (source === "widget") {
    await prisma.widgetConversation.update({
      where: { id: conversationId },
      data: { leadScore: score },
    });
  } else {
    await prisma.whatsAppConversation.update({
      where: { id: conversationId },
      data: { leadScore: score },
    });
  }
}

/**
 * Export all leads as CSV.
 */
export async function exportLeadsCSV(workspaceId: string, source?: string): Promise<string> {
  const result = await getUnifiedLeads(workspaceId, { source, perPage: 10000 });
  
  const headers = [
    "Source",
    "Name",
    "Email",
    "WhatsApp",
    "Score",
    "Status",
    "Intent",
    "Messages",
    "Widget",
    "Last Activity",
    "Created",
  ];

  const rows = result.leads.map((lead) => [
    lead.source,
    lead.name || "",
    lead.email || "",
    lead.whatsapp || "",
    lead.score || "low",
    lead.status || "new",
    lead.intent || "",
    String(lead.messageCount),
    lead.widgetName || "",
    lead.lastMessageAt?.toISOString() || "",
    lead.createdAt.toISOString(),
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  return csv;
}
