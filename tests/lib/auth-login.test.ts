import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    $transaction: vi.fn(),
    $executeRaw: vi.fn(),
    $queryRaw: vi.fn(),
  },
  resolveWorkspaceId: vi.fn(),
}));

describe("Auth - Workspace removal verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("auth.ts should not import resolveWorkspaceId from prisma", async () => {
    // Read the auth.ts source file
    const fs = await import("fs");
    const path = await import("path");
    const authPath = path.resolve("lib/auth.ts");
    const authSource = fs.readFileSync(authPath, "utf-8");

    // auth.ts should NOT reference resolveWorkspaceId
    expect(authSource).not.toContain("resolveWorkspaceId");
  });

  it("auth.ts should not reference selectedWorkspaceId in callbacks", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const authPath = path.resolve("lib/auth.ts");
    const authSource = fs.readFileSync(authPath, "utf-8");

    // auth.ts should NOT reference selectedWorkspaceId
    expect(authSource).not.toContain("selectedWorkspaceId");
  });

  it("auth.ts should not query workspace_members table", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const authPath = path.resolve("lib/auth.ts");
    const authSource = fs.readFileSync(authPath, "utf-8");

    // auth.ts should NOT reference workspace_members
    expect(authSource).not.toContain("workspace_members");
  });

  it("prisma.ts resolveWorkspaceId should be removed or be a no-op", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const prismaPath = path.resolve("lib/prisma.ts");
    const prismaSource = fs.readFileSync(prismaPath, "utf-8");

    // resolveWorkspaceId should either not exist or be a no-op
    if (prismaSource.includes("resolveWorkspaceId")) {
      // If it exists, it should not query workspace_members
      expect(prismaSource).not.toContain("workspace_members");
    }
  });
});
