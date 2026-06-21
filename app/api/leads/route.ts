import { NextRequest } from "next/server";
import { requireDashboardAuth, apiErrorResponse } from "@/lib/api-auth";
import { getUnifiedLeads, updateLeadStatus, updateLeadScoreUnified, exportLeadsCSV } from "@/lib/leads";
import { setWorkspaceContext } from "@/lib/prisma";
import type { LeadScore, LeadStatus } from "@/lib/lead-intent";

/**
 * GET /api/leads
 * Unified leads listing from widget + WhatsApp conversations.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireDashboardAuth(request);
    await setWorkspaceContext(auth.workspaceId);

    const { searchParams } = new URL(request.url);

    // Check if CSV export
    if (searchParams.get("format") === "csv") {
      const csv = await exportLeadsCSV(
        auth.workspaceId,
        searchParams.get("source") || undefined
      );
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename=leads-${new Date().toISOString().slice(0, 10)}.csv`,
        },
      });
    }

    const result = await getUnifiedLeads(auth.workspaceId, {
      source: searchParams.get("source") || undefined,
      status: searchParams.get("status") || undefined,
      score: searchParams.get("score") || undefined,
      search: searchParams.get("search") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      perPage: parseInt(searchParams.get("perPage") || "20"),
    });

    return Response.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

/**
 * PATCH /api/leads
 * Update lead status or score.
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireDashboardAuth(request);
    await setWorkspaceContext(auth.workspaceId);

    const body = await request.json();
    const { conversationId, source, status, score } = body;

    if (!conversationId || !source) {
      return Response.json(
        { error: { code: "invalid_request", message: "conversationId and source required" } },
        { status: 400 }
      );
    }

    if (status) {
      await updateLeadStatus(conversationId, source, status as LeadStatus);
    }
    if (score) {
      await updateLeadScoreUnified(conversationId, source, score as LeadScore);
    }

    return Response.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
