"use client";

import { useState, useRef, useEffect } from "react";
import { CreateMessagePayload, RecurringType } from "@/types";

interface Props {
  onSuccess: () => void;
}

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
const MONTHS_SHORT = [
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

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function to12h(h24: string) {
  const n = parseInt(h24);
  if (n === 0) return "12";
  if (n > 12) return String(n - 12).padStart(2, "0");
  return String(n).padStart(2, "0");
}
function to24h(h12: string, period: "AM" | "PM") {
  let n = parseInt(h12);
  if (period === "AM") {
    if (n === 12) n = 0;
  } else {
    if (n !== 12) n += 12;
  }
  return String(n).padStart(2, "0");
}
function formatAmPm(h24: string, minute: string) {
  const n = parseInt(h24);
  const period = n < 12 ? "AM" : "PM";
  const h12 = to12h(h24);
  return `${h12}:${minute} ${period}`;
}

interface DateTimePickerProps {
  value: { date: Date | null; hour: string; minute: string };
  onChange: (v: { date: Date | null; hour: string; minute: string }) => void;
  onClose: () => void;
}

function DateTimePicker({ value, onChange, onClose }: DateTimePickerProps) {
  const now = new Date();
  const [calYear, setCalYear] = useState(
    value.date?.getFullYear() ?? now.getFullYear(),
  );
  const [calMonth, setCalMonth] = useState(
    value.date?.getMonth() ?? now.getMonth(),
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(value.date);

  const initN = parseInt(value.hour);
  const [hour12, setHour12] = useState(to12h(value.hour));
  const [minute, setMinute] = useState(value.minute);
  const [period, setPeriod] = useState<"AM" | "PM">(initN < 12 ? "AM" : "PM");

  function getHour24() {
    return to24h(hour12, period);
  }

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);
  const calCells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

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
  function isDisabled(day: number) {
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

  function clampH(v: string) {
    const n = parseInt(v);
    if (isNaN(n)) return "12";
    return String(Math.min(12, Math.max(1, n))).padStart(2, "0");
  }
  function clampM(v: string) {
    const n = parseInt(v);
    if (isNaN(n)) return "00";
    return String(Math.min(59, Math.max(0, n))).padStart(2, "0");
  }

  function handleConfirm() {
    onChange({ date: selectedDate, hour: getHour24(), minute });
    onClose();
  }

  const previewTime = formatAmPm(getHour24(), minute);

  // Quick time shortcuts (12h display, stored as 24h)
  const quickTimes = [
    { label: "12:00 PM", h: "12", m: "00", p: "PM" as const },
    { label: "12:00 AM", h: "12", m: "00", p: "AM" as const },
  ];

  return (
    <div className="w-80 bg-[#0f1117] border border-[#252d3d] rounded-2xl shadow-2xl overflow-hidden">
      {/* Calendar header */}
      <div className="bg-[#161b27] px-5 py-4 border-b border-[#252d3d]">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={prevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#252d3d] text-slate-400 hover:text-white transition text-lg"
          >
            ‹
          </button>
          <span className="text-white font-semibold text-sm">
            {MONTHS[calMonth]} {calYear}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#252d3d] text-slate-400 hover:text-white transition text-lg"
          >
            ›
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="px-4 pt-3 pb-2">
        <div className="grid grid-cols-7 mb-2">
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
                  disabled={isDisabled(day)}
                  onClick={() =>
                    setSelectedDate(new Date(calYear, calMonth, day))
                  }
                  className={`w-9 h-9 rounded-xl text-xs font-medium transition
                    ${
                      isSelected(day)
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                        : isToday(day)
                          ? "border border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                          : isDisabled(day)
                            ? "text-slate-700 cursor-not-allowed"
                            : "text-slate-300 hover:bg-[#252d3d] hover:text-white"
                    }`}
                >
                  {day}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Time picker */}
      <div className="px-4 py-3 border-t border-[#1e2433]">
        <p className="text-xs text-slate-600 uppercase tracking-wide font-medium mb-2">
          Waktu
        </p>
        <div className="flex items-center gap-2">
          {/* Hour : Minute */}
          <div className="flex items-center gap-1 bg-[#161b27] border border-[#252d3d] rounded-xl px-3 py-2 focus-within:border-blue-500 transition">
            <svg
              className="w-3.5 h-3.5 text-slate-500 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
              <path d="M12 7v5l3 3" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="number"
              min={1}
              max={12}
              value={hour12}
              onChange={(e) => setHour12(e.target.value)}
              onBlur={(e) => setHour12(clampH(e.target.value))}
              className="w-7 bg-transparent text-white text-sm font-mono text-center focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-slate-500 font-bold">:</span>
            <input
              type="number"
              min={0}
              max={59}
              value={minute}
              onChange={(e) => setMinute(e.target.value)}
              onBlur={(e) => setMinute(clampM(e.target.value))}
              className="w-7 bg-transparent text-white text-sm font-mono text-center focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          {/* AM/PM toggle */}
          <div className="flex rounded-xl overflow-hidden border border-[#252d3d]">
            {(["AM", "PM"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-3 py-2 text-xs font-semibold transition ${
                  period === p
                    ? "bg-blue-600 text-white"
                    : "bg-[#161b27] text-slate-500 hover:text-white"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Quick times */}
          <div className="flex gap-1">
            {quickTimes.map((t) => {
              const active = hour12 === t.h && minute === t.m && period === t.p;
              return (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => {
                    setHour12(t.h);
                    setMinute(t.m);
                    setPeriod(t.p);
                  }}
                  className={`text-xs px-2 py-1.5 rounded-lg transition font-medium border ${
                    active
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-[#161b27] border-[#252d3d] text-slate-500 hover:text-white hover:bg-[#252d3d]"
                  }`}
                >
                  {t.label.split(" ")[0]}
                  <br />
                  <span className="text-[10px]">{t.p}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#1e2433] flex items-center justify-between">
        <div className="text-xs text-slate-500">
          {selectedDate ? (
            <span className="text-slate-300">
              {selectedDate.getDate()} {MONTHS_SHORT[selectedDate.getMonth()]}{" "}
              {selectedDate.getFullYear()}, {previewTime}
            </span>
          ) : (
            <span>Pilih tanggal</span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-white px-3 py-1.5 rounded-lg hover:bg-[#252d3d] transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedDate}
            className="text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-4 py-1.5 rounded-lg transition"
          >
            Konfirmasi
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MessageForm({ onSuccess }: Props) {
  const [chatId, setChatId] = useState("");
  const [message, setMessage] = useState("");
  const [recurring, setRecurring] = useState<RecurringType>("once");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showPicker, setShowPicker] = useState(false);
  const [pickerValue, setPickerValue] = useState<{
    date: Date | null;
    hour: string;
    minute: string;
  }>({
    date: null,
    hour: "08",
    minute: "00",
  });
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node))
        setShowPicker(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function formatPickerDisplay() {
    if (!pickerValue.date) return null;
    const d = pickerValue.date;
    return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}, ${formatAmPm(pickerValue.hour, pickerValue.minute)}`;
  }

  function getScheduledAt(): string | null {
    if (!pickerValue.date) return null;
    const d = new Date(pickerValue.date);
    d.setHours(parseInt(pickerValue.hour), parseInt(pickerValue.minute), 0, 0);
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
      setPickerValue({ date: null, hour: "08", minute: "00" });
      setRecurring("once");
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
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

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
            Send At
          </label>
          <div className="relative" ref={pickerRef}>
            <button
              type="button"
              onClick={() => setShowPicker((v) => !v)}
              className={`w-full flex items-center gap-3 bg-[#161b27] border rounded-xl px-4 py-3 text-sm transition text-left ${
                showPicker
                  ? "border-blue-500 ring-1 ring-blue-500"
                  : "border-[#252d3d] hover:border-slate-500"
              }`}
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
                className={pickerValue.date ? "text-white" : "text-slate-600"}
              >
                {formatPickerDisplay() ?? "Pilih tanggal & waktu"}
              </span>
              {pickerValue.date && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPickerValue({ date: null, hour: "08", minute: "00" });
                  }}
                  className="ml-auto text-slate-600 hover:text-slate-400 transition"
                >
                  ✕
                </button>
              )}
            </button>

            {showPicker && (
              <div className="absolute z-50 mt-2 left-0">
                <DateTimePicker
                  value={pickerValue}
                  onChange={setPickerValue}
                  onClose={() => setShowPicker(false)}
                />
              </div>
            )}
          </div>
        </div>

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
