"use client";

import { useState } from "react";
import { CreateMessagePayload, RecurringType } from "@/types";

interface Props {
  onSuccess: () => void;
}

export default function MessageForm({ onSuccess }: Props) {
  const [chatId, setChatId] = useState("");
  const [message, setMessage] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [recurring, setRecurring] = useState<RecurringType>("once");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Minimum datetime: now (local)
  const minDatetime = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!chatId.trim() || !message.trim() || !scheduledAt) {
      setError("All fields are required.");
      return;
    }

    setLoading(true);
    try {
      const payload: CreateMessagePayload = {
        chatId: chatId.trim(),
        message: message.trim(),
        scheduledAt: new Date(scheduledAt).toISOString(),
        recurring,
      };

      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to schedule message.");

      setChatId("");
      setMessage("");
      setScheduledAt("");
      setRecurring("once");
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#0f1117] border border-[#1e2433] rounded-2xl p-6 shadow-lg">
      <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
        Schedule a Message
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Chat ID */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
            Target Chat ID
          </label>
          <input
            type="text"
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder="e.g. -1001234567890 or @username"
            className="w-full bg-[#161b27] border border-[#252d3d] text-white placeholder-slate-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
          />
          <p className="text-xs text-slate-600 mt-1">
            Use a numeric ID, @username, or group/channel ID.
          </p>
        </div>

        {/* Message */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here. HTML tags are supported."
            rows={4}
            className="w-full bg-[#161b27] border border-[#252d3d] text-white placeholder-slate-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition resize-none"
          />
          <p className="text-xs text-slate-600 mt-1">
            Supports Telegram HTML: &lt;b&gt;, &lt;i&gt;, &lt;code&gt;, &lt;a&gt;
          </p>
        </div>

        {/* Scheduled At */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
            Send At
          </label>
          <input
            type="datetime-local"
            value={scheduledAt}
            min={minDatetime}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full bg-[#161b27] border border-[#252d3d] text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition [color-scheme:dark]"
          />
        </div>

        {/* Recurring */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
            Repeat
          </label>
          <div className="flex gap-2">
            {(["once", "daily", "weekly"] as RecurringType[]).map((opt) => (
              <button
                type="button"
                key={opt}
                onClick={() => setRecurring(opt)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition border ${
                  recurring === opt
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-[#161b27] border-[#252d3d] text-slate-400 hover:border-slate-500"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-950/50 border border-red-800 rounded-lg px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-2.5 text-sm transition"
        >
          {loading ? "Scheduling…" : "Schedule Message"}
        </button>
      </form>
    </div>
  );
}
