"use client";

import { useState, useRef, useEffect } from "react";
import { CreateMessagePayload, RecurringType } from "@/types";

interface Props {
  onSuccess: () => void;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];
const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, "0"),
);

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function MessageForm({ onSuccess }: Props) {
  const [chatId, setChatId] = useState("");
  const [message, setMessage] = useState("");
  const [recurring, setRecurring] = useState<RecurringType>("once");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [showCal, setShowCal] = useState(false);
  const [hour, setHour] = useState("08");
  const [minute, setMinute] = useState("00");

  const calRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (calRef.current && !calRef.current.contains(e.target as Node)) {
        setShowCal(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function prevMonth() {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else setCalMonth((m) => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else setCalMonth((m) => m + 1);
  }
  function selectDay(day: number) {
    setSelectedDate(new Date(calYear, calMonth, day));
    setShowCal(false);
  }
  function isDisabledDay(day: number) {
    const d = new Date(calYear, calMonth, day);
    d.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  }
  function isToday(day: number) {
    return (
      new Date(calYear, calMonth, day).toDateString() === now.toDateString()
    );
  }
  function isSelected(day: number) {
    if (!selectedDate) return false;
    return (
      new Date(calYear, calMonth, day).toDateString() ===
      selectedDate.toDateString()
    );
  }
  function formatDisplay() {
    if (!selectedDate) return null;
    return `${selectedDate.getDate()} ${MONTHS[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
  }
  function getScheduledAt(): string | null {
    if (!selectedDate) return null;
    const d = new Date(selectedDate);
    d.setHours(parseInt(hour), parseInt(minute), 0, 0);
    return d.toISOString();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const scheduledAt = getScheduledAt();
    if (!chatId.trim() || !message.trim() || !scheduledAt) {
      setError("Semua field wajib diisi, termasuk tanggal & jam.");
      return;
    }
    if (new Date(scheduledAt) <= new Date()) {
      setError("Waktu pengiriman harus di masa depan.");
      return;
    }
    setLoading(true);
    try {
      const payload: CreateMessagePayload = {
        chatId: chatId.trim(),
        message: message.trim(),
        scheduledAt,
        recurring,
      };
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menjadwalkan pesan.");
      setChatId("");
      setMessage("");
      setSelectedDate(null);
      setHour("08");
      setMinute("00");
      setRecurring("once");
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);
  const calCells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const selectClass =
    "bg-[#161b27] border border-[#252d3d] text-white text-sm rounded-lg px-2 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition appearance-none cursor-pointer";

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
            placeholder="e.g. 8159992897 atau -1001234567890"
            className="w-full bg-[#161b27] border border-[#252d3d] text-white placeholder-slate-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
          />
          <p className="text-xs text-slate-600 mt-1">
            Gunakan numeric ID dari getUpdates, bukan @username.
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
            placeholder="Ketik pesan di sini. Tag HTML didukung."
            rows={4}
            className="w-full bg-[#161b27] border border-[#252d3d] text-white placeholder-slate-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition resize-none"
          />
          <p className="text-xs text-slate-600 mt-1">
            Mendukung HTML Telegram: &lt;b&gt;, &lt;i&gt;, &lt;code&gt;,
            &lt;a&gt;
          </p>
        </div>

        {/* Date + Time */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
            Send At
          </label>
          <div className="flex gap-2">
            {/* Date picker */}
            <div className="relative flex-1" ref={calRef}>
              <button
                type="button"
                onClick={() => setShowCal((v) => !v)}
                className={`w-full flex items-center gap-2 bg-[#161b27] border rounded-lg px-4 py-2.5 text-sm transition text-left ${showCal ? "border-blue-500 ring-1 ring-blue-500" : "border-[#252d3d] hover:border-slate-500"}`}
              >
                <svg
                  className="w-4 h-4 text-slate-500 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect
                    x="3"
                    y="4"
                    width="18"
                    height="18"
                    rx="2"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M16 2v4M8 2v4M3 10h18"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <span
                  className={selectedDate ? "text-white" : "text-slate-600"}
                >
                  {formatDisplay() ?? "Pilih tanggal"}
                </span>
              </button>

              {showCal && (
                <div className="absolute z-50 mt-2 w-72 bg-[#161b27] border border-[#252d3d] rounded-xl shadow-2xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={prevMonth}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#252d3d] text-slate-400 hover:text-white transition"
                    >
                      ‹
                    </button>
                    <span className="text-sm font-semibold text-white">
                      {MONTHS[calMonth]} {calYear}
                    </span>
                    <button
                      type="button"
                      onClick={nextMonth}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#252d3d] text-slate-400 hover:text-white transition"
                    >
                      ›
                    </button>
                  </div>
                  <div className="grid grid-cols-7 mb-1">
                    {DAYS.map((d) => (
                      <div
                        key={d}
                        className="text-center text-xs text-slate-600 font-medium py-1"
                      >
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-y-1">
                    {calCells.map((day, i) => (
                      <div key={i} className="flex items-center justify-center">
                        {day === null ? null : (
                          <button
                            type="button"
                            disabled={isDisabledDay(day)}
                            onClick={() => selectDay(day)}
                            className={`w-8 h-8 rounded-lg text-xs font-medium transition
                              ${
                                isSelected(day)
                                  ? "bg-blue-600 text-white"
                                  : isToday(day)
                                    ? "border border-blue-500 text-blue-400 hover:bg-blue-500/20"
                                    : isDisabledDay(day)
                                      ? "text-slate-700 cursor-not-allowed"
                                      : "text-slate-300 hover:bg-[#252d3d]"
                              }`}
                          >
                            {day}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Time — dropdown select */}
            <div className="flex items-center gap-1.5 bg-[#161b27] border border-[#252d3d] rounded-lg px-3 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition">
              <svg
                className="w-4 h-4 text-slate-500 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
                <path d="M12 7v5l3 3" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <select
                value={hour}
                onChange={(e) => setHour(e.target.value)}
                className={selectClass}
                style={{ WebkitAppearance: "none" }}
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              <span className="text-slate-500 font-bold text-sm">:</span>
              <select
                value={minute}
                onChange={(e) => setMinute(e.target.value)}
                className={selectClass}
                style={{ WebkitAppearance: "none" }}
              >
                {MINUTES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedDate && (
            <p className="text-xs text-slate-500 mt-1.5">
              Akan dikirim:{" "}
              <span className="text-slate-300">
                {formatDisplay()} pukul {hour}:{minute}
              </span>
            </p>
          )}
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

        {error && (
          <div className="bg-red-950/50 border border-red-800 rounded-lg px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-2.5 text-sm transition"
        >
          {loading ? "Menjadwalkan…" : "Schedule Message"}
        </button>
      </form>
    </div>
  );
}
