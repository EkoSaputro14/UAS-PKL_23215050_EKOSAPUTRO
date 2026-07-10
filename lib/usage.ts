import { prisma, setWorkspaceContext } from "@/lib/prisma";

// ============================================================
// Plan Definitions (defaults — seeded in DB)
// ============================================================

export interface PlanLimits {
  maxDocuments: number;     // -1 = unlimited
  maxStorageMB: number;
  maxChatMessages: number;
  maxChunks: number;
  maxAIRequests: number;
  maxEmbeddingReqs: number;
  maxMCPExecutions: number;
  maxMembers: number;
  maxWorkspaces: number;
}

const UNLIMITED = -1;

const DEFAULT_LIMITS: Record<string, PlanLimits> = {
  free: {
    maxDocuments: 10,
    maxStorageMB: 100,
    maxChatMessages: 1000,
    maxChunks: 5000,
    maxAIRequests: 500,
    maxEmbeddingReqs: 500,
    maxMCPExecutions: 100,
    maxMembers: 3,
    maxWorkspaces: 1,
  },
  pro: {
    maxDocuments: 100,
    maxStorageMB: 10240,
    maxChatMessages: 50000,
    maxChunks: 100000,
    maxAIRequests: 10000,
    maxEmbeddingReqs: 10000,
    maxMCPExecutions: 5000,
    maxMembers: 20,
    maxWorkspaces: 5,
  },
  enterprise: {
    maxDocuments: UNLIMITED,
    maxStorageMB: UNLIMITED,
    maxChatMessages: UNLIMITED,
    maxChunks: UNLIMITED,
    maxAIRequests: UNLIMITED,
    maxEmbeddingReqs: UNLIMITED,
    maxMCPExecutions: UNLIMITED,
    maxMembers: UNLIMITED,
    maxWorkspaces: UNLIMITED,
  },
};

// ============================================================
// Period Helpers
// ============================================================

/** Get current period string (YYYY-MM) */
export function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// ============================================================
// Subscription Status Helpers
// ============================================================

/** Statuses that grant premium access */
const ACTIVE_STATUSES = new Set(["active", "trial", "past_due"]);

/**
 * Check if a subscription status grants premium access.
 * Returns false for: canceled, expired, unknown statuses.
 */
export function isSubscriptionActive(status: string): boolean {
  return ACTIVE_STATUSES.has(status);
}

/**
 * Check if a trial has expired based on trialEndsAt.
 */
export function isTrialExpired(trialEndsAt: Date | null): boolean {
  if (!trialEndsAt) return false;
  return new Date() > trialEndsAt;
}

// ============================================================
// Plan Resolution
// ============================================================

/**
 * Get the plan limits for a workspace.
 * Falls back to free tier if:
 * - No subscription found
 * - Subscription status is canceled/expired
 * - Trial has expired
 */
export async function getPlanLimits(workspaceId: string): Promise<PlanLimits> {
  // WorkspaceSubscription model removed — return free tier defaults
  void workspaceId; // suppress unused warning
  return DEFAULT_LIMITS.free;
}

/**
 * Get workspace subscription info.
 */
export async function getWorkspaceSubscription(workspaceId: string) {
  // WorkspaceSubscription model removed — return null
  void workspaceId;
  return null;
}

// ============================================================
// Usage Tracking
// ============================================================

/**
 * Get or create usage record for the current period.
 */
async function getOrCreateUsage(workspaceId: string, period: string) {
  // WorkspaceUsage model removed — use raw query
  const existing = await prisma.$queryRaw<Array<{
    id: string; workspace_id: string; period: string;
    documents_created: bigint; storage_bytes_used: bigint; chunks_created: bigint;
    chat_messages: bigint; ai_requests: bigint; embedding_requests: bigint;
    mcp_executions: bigint;
  }>>`
    SELECT * FROM workspace_usage
    WHERE workspace_id = ${workspaceId} AND period = ${period}
    LIMIT 1
  `;

  if (existing.length > 0) {
    const row = existing[0];
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      period: row.period,
      documentsCreated: Number(row.documents_created),
      storageBytesUsed: row.storage_bytes_used,
      chunksCreated: Number(row.chunks_created),
      chatMessages: Number(row.chat_messages),
      aiRequests: Number(row.ai_requests),
      embeddingRequests: Number(row.embedding_requests),
      mcpExecutions: Number(row.mcp_executions),
    };
  }

  // Create new usage record via raw query
  await prisma.$executeRaw`
    INSERT INTO workspace_usage (id, workspace_id, period, created_at, updated_at)
    VALUES (gen_random_uuid()::text, ${workspaceId}, ${period}, NOW(), NOW())
  `;

  return getOrCreateUsage(workspaceId, period);
}

/**
 * Increment usage using a safe approach (avoid raw interpolation).
 */
export async function trackDocumentUpload(_storageBytes: number): Promise<void> {
  // Workspace removed — no-op
}

export async function trackChatMessage(): Promise<void> {
  // Workspace removed — no-op
}

export async function trackChunks(_count: number): Promise<void> {
  // Workspace removed — no-op
}

export async function trackAIRequest(): Promise<void> {
  // Workspace removed — no-op
}

export async function trackEmbeddingRequest(): Promise<void> {
  // Workspace removed — no-op
}

export async function trackMCPExecution(): Promise<void> {
  // Workspace removed — no-op
}

// ============================================================
// Usage Query
// ============================================================

export interface UsageSnapshot {
  period: string;
  documentsCreated: number;
  storageBytesUsed: number;
  storageMBUsed: number;
  chunksCreated: number;
  chatMessages: number;
  aiRequests: number;
  embeddingRequests: number;
  mcpExecutions: number;
  limits: PlanLimits;
  planName: string;
  usagePercent: Record<string, number>;
}

/**
 * Get current usage for a workspace with limits and percentages.
 */
export async function getUsage(
  workspaceId: string,
  period?: string
): Promise<UsageSnapshot> {
  const p = period || getCurrentPeriod();
  void workspaceId; // suppress unused warning

  // WorkspaceUsage/WorkspaceSubscription models removed — return default usage
  const limits = DEFAULT_LIMITS.free;
  function pct(_used: number, max: number): number {
    if (max === UNLIMITED) return 0;
    if (max === 0) return 100;
    return Math.min(100, Math.round((_used / max) * 100));
  }

  return {
    period: p,
    documentsCreated: 0,
    storageBytesUsed: 0,
    storageMBUsed: 0,
    chunksCreated: 0,
    chatMessages: 0,
    aiRequests: 0,
    embeddingRequests: 0,
    mcpExecutions: 0,
    limits,
    planName: "Free",
    usagePercent: {
      documents: pct(0, limits.maxDocuments),
      storage: pct(0, limits.maxStorageMB),
      chatMessages: pct(0, limits.maxChatMessages),
      chunks: pct(0, limits.maxChunks),
      aiRequests: pct(0, limits.maxAIRequests),
      embeddingRequests: pct(0, limits.maxEmbeddingReqs),
      mcpExecutions: pct(0, limits.maxMCPExecutions),
    },
  };
}

// ============================================================
// Limit Enforcement
// ============================================================

export class LimitExceededError extends Error {
  constructor(
    public readonly metric: string,
    public readonly current: number,
    public readonly limit: number
  ) {
    super(
      `Limit exceeded for ${metric}: ${current}/${limit}. Upgrade your plan to increase limits.`
    );
    this.name = "LimitExceededError";
  }
}

/**
 * Check if a workspace has exceeded a specific limit.
 * Throws LimitExceededError if exceeded.
 */
export async function checkLimit(
  workspaceId: string,
  metric: keyof PlanLimits
): Promise<void> {
  const usage = await getUsage(workspaceId);
  const limit = usage.limits[metric];

  if (limit === UNLIMITED) return;

  const currentValue = getMetricValue(usage, metric);
  if (currentValue >= limit) {
    throw new LimitExceededError(metric, currentValue, limit);
  }
}

/**
 * Check if adding `amount` would exceed the limit.
 * Throws LimitExceededError if it would.
 */
export async function checkLimitWithAmount(
  workspaceId: string,
  metric: keyof PlanLimits,
  amount: number
): Promise<void> {
  const usage = await getUsage(workspaceId);
  const limit = usage.limits[metric];

  if (limit === UNLIMITED) return;

  const currentValue = getMetricValue(usage, metric);
  if (currentValue + amount > limit) {
    throw new LimitExceededError(metric, currentValue + amount, limit);
  }
}

function getMetricValue(usage: UsageSnapshot, metric: keyof PlanLimits): number {
  const mapping: Record<keyof PlanLimits, number> = {
    maxDocuments: usage.documentsCreated,
    maxStorageMB: usage.storageMBUsed,
    maxChatMessages: usage.chatMessages,
    maxChunks: usage.chunksCreated,
    maxAIRequests: usage.aiRequests,
    maxEmbeddingReqs: usage.embeddingRequests,
    maxMCPExecutions: usage.mcpExecutions,
    maxMembers: 0, // members checked separately
    maxWorkspaces: 0, // workspaces checked separately
  };
  return mapping[metric] ?? 0;
}

/**
 * Check member limit for a workspace.
 */
export async function checkMemberLimit(workspaceId: string): Promise<void> {
  // WorkspaceMember model removed — member check not available
  void workspaceId;
  return;
}
