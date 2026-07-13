import { auth } from "@/lib/auth";

/**
 * GET /api/user/sessions
 * Returns session activity for the authenticated user.
 * Since we use JWT strategy (no DB sessions), returns basic auth info.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // With JWT strategy, we don't have DB sessions
    // Return basic session info
    return Response.json({
      events: [
        {
          id: "current",
          action: "login",
          createdAt: new Date().toISOString(),
          ipAddress: null,
          userAgent: null,
          metadata: { type: "current_session" },
        },
      ],
    });
  } catch (error) {
    console.error("GET /api/user/sessions error:", error);
    return Response.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
