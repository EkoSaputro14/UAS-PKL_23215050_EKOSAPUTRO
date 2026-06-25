"use client";

import { Flame, TrendingUp, CircleDot, MessageSquare, Clock } from "lucide-react";

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
  lastMessageAt: string | null;
  createdAt: string;
  widgetName: string | null;
  leadSummary?: string | null;
  businessInterest?: string | null;
  budget?: string | null;
  location?: string | null;
}

interface KanbanBoardProps {
  leads: LeadItem[];
  onLeadClick: (lead: LeadItem) => void;
}

const COLUMNS = [
  { key: "new",       label: "Baru",       color: "bg-red-500",      borderColor: "border-red-200 dark:border-red-900/50" },
  { key: "contacted", label: "Dihubungi",  color: "bg-yellow-500",   borderColor: "border-yellow-200 dark:border-yellow-900/50" },
  { key: "qualified", label: "Qualified",  color: "bg-blue-500",     borderColor: "border-blue-200 dark:border-blue-900/50" },
  { key: "converted", label: "Converted",  color: "bg-green-500",    borderColor: "border-green-200 dark:border-green-900/50" },
  { key: "lost",      label: "Lost",       color: "bg-gray-500",     borderColor: "border-gray-200 dark:border-gray-800" },
] as const;

const SCORE_CONFIG: Record<string, { icon: React.ElementType; label: string; badge: string }> = {
  high:   { icon: Flame,     label: "Hot",  badge: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50" },
  medium: { icon: TrendingUp, label: "Warm", badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50" },
  low:    { icon: CircleDot,  label: "Cold", badge: "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-950/30 dark:text-slate-400 dark:border-slate-800/50" },
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "-";
  const now = new Date();
  const then = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (seconds < 60) return `${seconds}d`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}j`;
  return `${Math.floor(seconds / 86400)}h`;
}

function KanbanCard({ lead, onClick }: { lead: LeadItem; onClick: () => void }) {
  const scoreKey = lead.score || "low";
  const scoreCfg = SCORE_CONFIG[scoreKey] || SCORE_CONFIG.low;
  const ScoreIcon = scoreCfg.icon;

  return (
    <div
      onClick={onClick}
      className="rounded-lg border bg-card p-3 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group"
    >
      <div className="flex items-start gap-2">
        <span
          className={`shrink-0 flex items-center justify-center size-6 rounded border ${scoreCfg.badge}`}
          title={scoreCfg.label}
        >
          <ScoreIcon className="size-3" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {lead.name || "Anonymous"}
          </p>
          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
            {lead.whatsapp || lead.email || "—"}
          </p>
        </div>
      </div>

      {lead.intent && (
        <div className="mt-2 flex flex-wrap gap-1">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground text-[10px]">
            {lead.intent}
          </span>
        </div>
      )}

      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <MessageSquare className="size-3" />
          {lead.messageCount}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="size-3" />
          {timeAgo(lead.lastMessageAt)}
        </span>
      </div>
    </div>
  );
}

export function KanbanBoard({ leads, onLeadClick }: KanbanBoardProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2 min-h-[300px]">
      {COLUMNS.map((col) => {
        const colLeads = leads.filter((l) => (l.status || "new") === col.key);
        return (
          <div
            key={col.key}
            className={`flex flex-col min-w-[260px] w-[260px] rounded-lg border bg-background/50 ${col.borderColor}`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30 rounded-t-lg">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${col.color}`} />
                <span className="text-sm font-medium text-foreground">{col.label}</span>
              </div>
              <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {colLeads.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 p-2 space-y-2 overflow-y-auto">
              {colLeads.length === 0 ? (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  Kosong
                </div>
              ) : (
                colLeads.map((lead) => (
                  <KanbanCard
                    key={lead.id}
                    lead={lead}
                    onClick={() => onLeadClick(lead)}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
