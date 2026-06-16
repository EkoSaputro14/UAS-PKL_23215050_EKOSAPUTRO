"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Conversation {
  id: string;
  waId: string;
  contactName: string | null;
  leadName: string | null;
  leadEmail: string | null;
  leadScore: string | null;
  leadStatus: string | null;
  leadIntent: string | null;
  messageCount: number;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  createdAt: string;
}

const SCORE_COLORS: Record<string, string> = {
  high: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-gray-100 text-gray-800",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-purple-100 text-purple-800",
  qualified: "bg-orange-100 text-orange-800",
  converted: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
};

export function ConversationList() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadConversations();
  }, [page, search]);

  async function loadConversations() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), perPage: "20" });
      if (search) params.set("search", search);

      const res = await fetch(`/api/whatsapp/conversations?${params}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setLoading(false);
    }
  }

  function formatTime(dateStr: string | null) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins}m lalu`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}j lalu`;
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="size-5" />
            Percakapan WhatsApp
            <Badge variant="secondary">{total}</Badge>
          </CardTitle>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, nomor, atau email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            <MessageSquare className="size-12 mx-auto mb-4 opacity-30" />
            <p>Belum ada percakapan WhatsApp.</p>
            <p className="text-sm">Percakapan akan muncul setelah pelanggan mengirim pesan.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <Link key={conv.id} href={`/whatsapp/conversations/${conv.id}`}>
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer border">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {conv.contactName || conv.leadName || conv.waId}
                      </span>
                      {conv.leadScore && (
                        <Badge variant="secondary" className={SCORE_COLORS[conv.leadScore] || ""}>
                          {conv.leadScore}
                        </Badge>
                      )}
                      {conv.leadStatus && conv.leadStatus !== "new" && (
                        <Badge variant="secondary" className={STATUS_COLORS[conv.leadStatus] || ""}>
                          {conv.leadStatus}
                        </Badge>
                      )}
                    </div>
                    {conv.lastMessagePreview && (
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {conv.lastMessagePreview}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{conv.waId}</span>
                      <span>{conv.messageCount} pesan</span>
                      {conv.leadIntent && <span>Intent: {conv.leadIntent}</span>}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTime(conv.lastMessageAt)}
                  </span>
                </div>
              </Link>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="size-4 mr-1" /> Sebelumnya
                </Button>
                <span className="text-sm text-muted-foreground">Halaman {page} dari {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  Selanjutnya <ChevronRight className="size-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
