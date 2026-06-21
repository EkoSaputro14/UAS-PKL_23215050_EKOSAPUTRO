"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  MessageCircle,
  Mail,
  Phone,
  MapPin,
  Clock,
  Bot,
  User,
} from "lucide-react";

interface ConversationData {
  source: string;
  conversation: {
    id: string;
    name: string | null;
    email: string | null;
    whatsapp: string | null;
    score: string | null;
    status: string | null;
    intent: string | null;
    summary: string | null;
    businessInterest: string | null;
    budget: string | null;
    location: string | null;
    timeline: string | null;
    followUp: string | null;
    startedAt: string;
    widgetName: string | null;
  };
  messages: Array<{
    id: string;
    role: string;
    content: string;
    timestamp: string;
  }>;
  messageCount: number;
}

function ScoreBadge({ score }: { score: string | null }) {
  const config: Record<string, { emoji: string; label: string; color: string }> = {
    high: { emoji: "🔥", label: "Hot", color: "bg-red-50 text-red-600 border-red-200" },
    medium: { emoji: "⭐", label: "Warm", color: "bg-amber-50 text-amber-600 border-amber-200" },
    low: { emoji: "❄️", label: "Cold", color: "bg-gray-50 text-gray-500 border-gray-200" },
  };
  const c = config[score || "low"];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${c.color}`}>
      {c.emoji} {c.label}
    </span>
  );
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<ConversationData | null>(null);
  const [intelligence, setIntelligence] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const leadId = params?.id as string;

  useEffect(() => {
    if (!leadId) return;

    const fetchTranscript = async () => {
      try {
        const res = await fetch(`/api/leads/${leadId}/transcript`);
        if (!res.ok) throw new Error(res.status === 404 ? "Lead not found" : "Failed to load");
        const json = await res.json();
        setData(json);

        try {
          const intelRes = await fetch(`/api/leads/${leadId}/intelligence`);
          if (intelRes.ok) {
            const intelJson = await intelRes.json();
            setIntelligence(intelJson.intelligence);
          }
        } catch {}
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTranscript();
  }, [leadId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">{error || "Lead not found"}</p>
        <Button variant="outline" onClick={() => router.push("/leads")}>
          <ArrowLeft className="size-4 mr-2" /> Kembali
        </Button>
      </div>
    );
  }

  const { conversation: conv, messages } = data;

  const waLink = conv.whatsapp
    ? `https://api.whatsapp.com/send/?phone=${conv.whatsapp.replace(/[^0-9]/g, "")}&text=${encodeURIComponent(
        "Halo, saya menindaklanjuti percakapan Anda dengan chatbot kami."
      )}`
    : null;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background border-b -mx-4 -mt-4 px-4 py-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/leads")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-5" />
            </button>
            <div>
              <h1 className="font-semibold">{conv.name || "Anonymous"}</h1>
              <p className="text-xs text-muted-foreground">
                {data.source === "widget" ? "💬 Chatbot" : "📱 WhatsApp"}
                {conv.widgetName ? ` · ${conv.widgetName}` : ""}
              </p>
            </div>
          </div>

          {/* Primary CTA */}
          <div className="flex gap-2">
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  <MessageCircle className="size-4 mr-2" />
                  WhatsApp
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Lead Summary */}
        <div className="md:col-span-1 space-y-4">
          {/* Contact Card */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <ScoreBadge score={conv.score} />
              <span className="text-xs text-muted-foreground capitalize">
                {conv.status || "new"}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              {conv.whatsapp && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="size-4" />
                  <span>{conv.whatsapp}</span>
                </div>
              )}
              {conv.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="size-4" />
                  <span>{conv.email}</span>
                </div>
              )}
              {conv.location && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="size-4" />
                  <span>{conv.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="size-4" />
                <span>
                  {new Date(conv.startedAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Intelligence Card */}
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase">
              Intelligence
            </h3>

            <div className="space-y-2 text-sm">
              {conv.intent && (
                <div>
                  <span className="text-muted-foreground">Intent: </span>
                  <span className="font-medium">{conv.intent}</span>
                </div>
              )}
              {(intelligence?.budget || conv.budget) && (
                <div>
                  <span className="text-muted-foreground">Budget: </span>
                  <span className="font-medium">
                    💰 {intelligence?.budget || conv.budget}
                  </span>
                </div>
              )}
              {intelligence?.timeline && (
                <div>
                  <span className="text-muted-foreground">Timeline: </span>
                  <span className="font-medium">{intelligence.timeline}</span>
                </div>
              )}
            </div>

            {conv.summary && (
              <p className="text-xs text-muted-foreground bg-muted rounded-md p-2">
                {conv.summary}
              </p>
            )}

            {(intelligence?.followUp || conv.followUp) && (
              <div className="bg-blue-50 rounded-md p-2 border border-blue-100">
                <p className="text-xs text-blue-700">
                  💡 {intelligence?.followUp || conv.followUp}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Transcript */}
        <div className="md:col-span-2">
          <div className="rounded-lg border">
            <div className="px-4 py-3 border-b">
              <h3 className="text-sm font-semibold">
                Percakapan ({data.messageCount} pesan)
              </h3>
            </div>

            <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  Belum ada percakapan
                </p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "assistant" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl px-4 py-2.5 ${
                        msg.role === "assistant"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        {msg.role === "assistant" ? (
                          <Bot className="size-3" />
                        ) : (
                          <User className="size-3" />
                        )}
                        <span className="text-[10px] opacity-70">
                          {new Date(msg.timestamp).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
