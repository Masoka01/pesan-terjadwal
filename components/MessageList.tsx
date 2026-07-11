"use client";

import { useEffect, useState, useCallback } from "react";
import { ScheduledMessage, MessageStatus } from "@/types";

interface Props {
  refreshKey: number;
}

const STATUS_STYLES: Record<MessageStatus, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  sent: "bg-green-500/10 text-green-400 border-green-500/30",
  failed: "bg-red-500/10 text-red-400 border-red-500/30",
};

const STATUS_DOT: Record<MessageStatus, string> = {
  pending: "bg-yellow-400",
  sent: "bg-green-400",
  failed: "bg-red-400",
};

const RECURRING_LABEL: Record<string, string> = {
  once: "Once",
  daily: "Daily",
  weekly: "Weekly",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function truncate(str: string, max = 80) {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

export default function MessageList({ refreshKey }: Props) {
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/schedule");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load messages.");
      setMessages(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchMessages();
  }, [fetchMessages, refreshKey]);

  return (
    <div className="bg-[#0f1117] border border-[#1e2433] rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-purple-500"></span>
          Scheduled Messages
        </h2>
        <button
          onClick={() => { setLoading(true); fetchMessages(); }}
          className="text-xs text-slate-500 hover:text-slate-300 transition flex items-center gap-1"
        >
          ↻ Refresh
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 text-slate-600 text-sm">
          Loading…
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-950/50 border border-red-800 rounded-lg px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && messages.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-slate-600">
          <svg className="w-10 h-10 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-sm">No messages scheduled yet.</p>
          <p className="text-xs mt-1">Schedule one using the form above.</p>
        </div>
      )}

      {!loading && !error && messages.length > 0 && (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="bg-[#161b27] border border-[#252d3d] rounded-xl p-4 hover:border-[#303a50] transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-mono truncate mb-1">
                    {truncate(msg.message)}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="font-mono">→ {msg.chatId}</span>
                    <span>·</span>
                    <span>{formatDate(msg.scheduledAt)}</span>
                    <span>·</span>
                    <span className="text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded">
                      {RECURRING_LABEL[msg.recurring] ?? msg.recurring}
                    </span>
                  </div>
                  {msg.errorMessage && (
                    <p className="text-xs text-red-400 mt-1.5">
                      Error: {msg.errorMessage}
                    </p>
                  )}
                  {msg.sentAt && (
                    <p className="text-xs text-slate-600 mt-1">
                      Sent {formatDate(msg.sentAt)}
                    </p>
                  )}
                </div>

                <span
                  className={`shrink-0 flex items-center gap-1.5 border text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[msg.status]}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[msg.status]}`}></span>
                  {msg.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
