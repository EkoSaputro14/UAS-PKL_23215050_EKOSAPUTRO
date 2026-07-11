import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// ============================================================
// Workspace stubs (workspace model removed)
// All workspace functions are no-ops for backward compatibility.
// ============================================================

export async function setWorkspaceContext(_workspaceId: string): Promise<void> {
  // No-op — workspace model removed
}

export async function getWorkspaceContext(): Promise<string | null> {
  return null;
}

export async function resolveWorkspaceId(_userId: string, _selectedWorkspaceId?: string | null): Promise<string> {
  return "default";
}

export async function getUserWorkspaces(_userId: string): Promise<Array<{ workspaceId: string; role: string }>> {
  return [];
}

export async function getWorkspaceMembers(_workspaceId: string): Promise<Array<{ userId: string; role: string }>> {
  return [];
}

export async function isWorkspaceMember(_userId: string, _workspaceId: string): Promise<boolean> {
  return true;
}

export async function getWorkspaceBySlug(_slug: string): Promise<{ id: string; name: string } | null> {
  return null;
}

export async function createWorkspace(_userId: string, _name: string): Promise<string> {
  return "default";
}

// Keep health check for Prisma
export async function checkPrismaHealth(): Promise<{ status: string; latencyMs: number }> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "healthy", latencyMs: Date.now() - start };
  } catch {
    return { status: "unhealthy", latencyMs: Date.now() - start };
  }
}
