"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface NotificationLead {
  id: string;
  name: string;
  intent: string;
  score: string;
  createdAt: string;
}

export function NotificationBar() {
  const [leads, setLeads] = useState<NotificationLead[]>([]);
  const [count, setCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/leads/notifications");
      if (res.ok) {
        const data = await res.json();
        setLeads(data.unseen || []);
        setCount(data.count || 0);
        setLastUpdate(new Date());
      }
    } catch {
      // Silently fail — polling will retry
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // 10s polling
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleClick = async (leadId: string) => {
    // Mark as seen
    await fetch(`/api/leads/${leadId}/seen`, { method: "POST" });
    // Navigate to detail
    router.push(`/leads/${leadId}`);
  };

  if (count === 0) return null;

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s lalu`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m lalu`;
    return `${Math.floor(seconds / 3600)}j lalu`;
  };

  return (
    <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <span className="text-sm font-semibold text-red-700">
            🔔 {count} New Lead{count > 1 ? "s" : ""}
          </span>
          <span className="text-xs text-gray-400 ml-2">
            · Update: {lastUpdate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          {collapsed ? "▼ Show" : "▲ Hide"}
        </button>
      </div>

      {!collapsed && (
        <div className="mt-3 space-y-2">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-100 hover:border-red-300 transition-colors cursor-pointer"
              onClick={() => handleClick(lead.id)}
            >
              <div className="flex items-center gap-3">
                <span className="text-red-500 font-bold">🔴</span>
                <div>
                  <span className="text-sm font-medium text-gray-800">{lead.name}</span>
                  <span className="text-xs text-gray-400 ml-2">· {lead.intent}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {timeAgo(new Date(lead.createdAt))}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                  View →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
