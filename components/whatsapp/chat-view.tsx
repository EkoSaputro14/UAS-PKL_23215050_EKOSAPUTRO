"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, ArrowLeft, User, Phone, Mail, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Message {
  id: string;
  role: string;
  content: string;
  messageType: string;
  deliveryStatus: string | null;
  sources: unknown;
  createdAt: string;
}

interface ConversationDetail {
  id: string;
  waId: string;
  contactName: string | null;
  leadName: string | null;
  leadEmail: string | null;
  leadWhatsApp: string | null;
  leadScore: string | null;
  leadStatus: string | null;
  leadIntent: string | null;
  messageCount: number;
  messages: Message[];
}

export function ChatView({ conversationId }: { conversationId: string }) {
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversation();
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages.length]);

  async function loadConversation() {
    try {
      const res = await fetch(`/api/whatsapp/conversations/${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        setConversation(data.conversation);
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!reply.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/whatsapp/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: reply.trim() }),
      });

      if (res.ok) {
        setReply("");
        loadConversation(); // Reload messages
      } else {
        const err = await res.json();
        toast.error(err.error?.message || "Gagal mengirim pesan");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setSending(false);
    }
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <p>Percakapan tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      {/* Chat Messages */}
      <Card className="flex flex-col h-[calc(100vh-200px)]">
        <CardHeader className="border-b">
          <div className="flex items-center gap-3">
            <Link href="/whatsapp">
              <Button variant="ghost" size="sm"><ArrowLeft className="size-4" /></Button>
            </Link>
            <div>
              <CardTitle className="text-base">
                {conversation.contactName || conversation.leadName || conversation.waId}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{conversation.waId}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
          {conversation.messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[80%] rounded-lg px-3 py-2 ${
                msg.role === "user"
                  ? "bg-muted text-foreground"
                  : "bg-primary text-primary-foreground"
              }`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs opacity-70">{formatTime(msg.createdAt)}</span>
                  {msg.role === "assistant" && msg.deliveryStatus && (
                    <span className="text-xs opacity-70">
                      {msg.deliveryStatus === "read" ? "✓✓" : msg.deliveryStatus === "delivered" ? "✓✓" : "✓"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </CardContent>
        <div className="border-t p-3">
          <div className="flex gap-2">
            <Input
              placeholder="Ketik balasan..."
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              disabled={sending}
            />
            <Button onClick={handleSend} disabled={sending || !reply.trim()}>
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>
        </div>
      </Card>

      {/* Lead Info Sidebar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Info Lead</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <User className="size-4 text-muted-foreground" />
              <span>{conversation.contactName || conversation.leadName || "-"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="size-4 text-muted-foreground" />
              <span>{conversation.waId}</span>
            </div>
            {conversation.leadEmail && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="size-4 text-muted-foreground" />
                <span>{conversation.leadEmail}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <MessageSquare className="size-4 text-muted-foreground" />
              <span>{conversation.messageCount} pesan</span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Lead Score</span>
            <Badge variant="secondary" className={`${
              conversation.leadScore === "high" ? "bg-green-100 text-green-800" :
              conversation.leadScore === "medium" ? "bg-yellow-100 text-yellow-800" :
              "bg-gray-100 text-gray-800"
            }`}>
              {conversation.leadScore || "low"}
            </Badge>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Status</span>
            <Badge variant="secondary">{conversation.leadStatus || "new"}</Badge>
          </div>

          {conversation.leadIntent && (
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">Intent</span>
              <Badge variant="outline">{conversation.leadIntent}</Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
