"use client";

import { useState } from "react";
import MessageForm from "@/components/MessageForm";
import MessageList from "@/components/MessageList";

export default function HomePage() {
  const [refreshKey, setRefreshKey] = useState(0);

  function handleSuccess() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="min-h-screen bg-[#080b12]">
      {/* Header */}
      <header className="border-b border-[#1e2433] bg-[#0a0d14]/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.247l-2.044 9.637c-.152.68-.556.845-1.127.527l-3.113-2.294-1.503 1.445c-.166.166-.305.305-.624.305l.223-3.164 5.751-5.196c.25-.222-.054-.346-.388-.124L7.44 14.289l-3.063-.958c-.664-.208-.678-.664.141-.984l11.969-4.615c.554-.2 1.039.134.858.515z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-white font-semibold text-sm">Telegram Scheduler</h1>
            <p className="text-slate-600 text-xs">Automate messages with precision</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-600 bg-[#0f1117] border border-[#1e2433] px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            Cron active
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-white tracking-tight mb-2">
            Schedule Telegram Messages
          </h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Jadwalkan pesan sekali, harian, mingguan, atau per jam — otomatis.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MessageForm onSuccess={handleSuccess} />
          <MessageList refreshKey={refreshKey} />
        </div>
      </main>
    </div>
  );
}
