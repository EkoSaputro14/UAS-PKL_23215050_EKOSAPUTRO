import Link from "next/link";
import DashboardShell from "@/components/layout/dashboard-shell";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  MessageSquare,
  Users,
  Upload,
  FileText,
  ArrowRight,
} from "lucide-react";

export const metadata = {
  title: "Dashboard — Mimotes",
};

export default async function DashboardPage() {
  const session = await auth();
  const userName = session?.user?.name || null;

  let documentCount = 0;
  let totalSessions = 0;
  let totalMessages = 0;

  try {
    const userId = session?.user?.id as string;

    if (userId) {
      const [docs, sessions, messages] = await Promise.all([
        prisma.document.count({ where: { userId } }),
        prisma.chatSession.count({ where: { userId } }),
        prisma.chatMessage.count({
          where: { session: { userId } },
        }),
      ]);

      documentCount = docs;
      totalSessions = sessions;
      totalMessages = messages;
    }
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
  }

  const hour = new Date().getHours();
  const greeting =
    hour < 11 ? "Selamat pagi" : hour < 17 ? "Selamat siang" : "Selamat malam";

  return (
    <DashboardShell title="Dashboard">
      <div className="space-y-6 max-w-4xl">
        {/* Greeting */}
        <div>
          <h1 className="text-xl font-semibold">
            {greeting}, {userName || "User"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Berikut ringkasan chatbot Anda hari ini.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Link
            href="/knowledge/documents"
            className="rounded-lg border p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <FileText className="size-4" />
              <span className="text-xs font-medium">Dokumen</span>
            </div>
            <p className="text-2xl font-bold">{documentCount}</p>
          </Link>

          <Link
            href="/chat"
            className="rounded-lg border p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <MessageSquare className="size-4" />
              <span className="text-xs font-medium">Percakapan</span>
            </div>
            <p className="text-2xl font-bold">{totalSessions}</p>
          </Link>

          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <MessageSquare className="size-4" />
              <span className="text-xs font-medium">Pesan</span>
            </div>
            <p className="text-2xl font-bold">{totalMessages}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-lg border p-4">
          <h2 className="text-sm font-semibold mb-3">Langkah Selanjutnya</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/documents/upload"
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-2">
                <Upload className="size-4 text-muted-foreground" />
                <span className="text-sm">Upload Dokumen</span>
              </div>
              <ArrowRight className="size-4 text-muted-foreground" />
            </Link>

            <Link
              href="/chat"
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="size-4 text-muted-foreground" />
                <span className="text-sm">Test Chatbot</span>
              </div>
              <ArrowRight className="size-4 text-muted-foreground" />
            </Link>

            <Link
              href="/leads"
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-2">
                <Users className="size-4 text-muted-foreground" />
                <span className="text-sm">Lihat Leads</span>
              </div>
              <ArrowRight className="size-4 text-muted-foreground" />
            </Link>
          </div>
        </div>

        {/* Recent Activity Summary */}
        {totalSessions > 0 && (
          <div className="rounded-lg border p-4">
            <h2 className="text-sm font-semibold mb-2">Ringkasan</h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Chatbot Anda telah menjawab <strong>{totalMessages}</strong> pesan
                dari <strong>{totalSessions}</strong> percakapan.
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
