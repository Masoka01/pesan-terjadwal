import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase";
import { computeNextRunAt } from "@/lib/telegram";
import { ScheduledMessage } from "@/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BOT_TOKENS = [
  process.env.TELEGRAM_BOT_TOKEN_1,
  process.env.TELEGRAM_BOT_TOKEN_2,
  process.env.TELEGRAM_BOT_TOKEN_3,
  process.env.TELEGRAM_BOT_TOKEN_4,
  process.env.TELEGRAM_BOT_TOKEN_5,
].filter(Boolean) as string[];

async function sendWithFallback(chatId: string, text: string): Promise<{
  ok: boolean;
  botIndex?: number;
  error?: string;
}> {
  for (let i = 0; i < BOT_TOKENS.length; i++) {
    const token = BOT_TOKENS[i];
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
      });
      const data = await res.json() as { ok: boolean; description?: string };

      if (data.ok) {
        return { ok: true, botIndex: i + 1 };
      }

      const err = data.description ?? "Unknown error";
      const isBlocked = err.includes("bot was blocked") || err.includes("user is deactivated") || err.includes("chat not found") || err.includes("Forbidden");

      console.warn(`[cron] Bot ${i + 1} failed: ${err}`);

      // Only fallback if blocked/forbidden, stop immediately on other errors
      if (!isBlocked) {
        return { ok: false, error: `Bot ${i + 1}: ${err}` };
      }

      // Blocked — try next bot
    } catch (err) {
      console.warn(`[cron] Bot ${i + 1} network error:`, err);
      // Network error — try next bot
    }
  }

  return { ok: false, error: "All bots failed or are blocked." };
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const db = getFirebaseAdmin();

  try {
    const snapshot = await db
      .collection("scheduled_messages")
      .where("status", "==", "pending")
      .where("scheduledAt", "<=", now.toISOString())
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ processed: 0, message: "No messages due." });
    }

    const results: Array<{ id: string; status: string; botUsed?: number; error?: string }> = [];

    for (const doc of snapshot.docs) {
      const data = doc.data() as Omit<ScheduledMessage, "id">;
      const id = doc.id;

      const { ok, botIndex, error } = await sendWithFallback(data.chatId, data.message);

      if (ok) {
        if (data.recurring === "once") {
          await doc.ref.update({ status: "sent", sentAt: now.toISOString(), sentByBot: botIndex });
          results.push({ id, status: "sent", botUsed: botIndex });
        } else {
          const nextRunAt = computeNextRunAt(
            data.nextRunAt ?? data.scheduledAt,
            data.recurring as "daily" | "weekly"
          );
          await doc.ref.update({ status: "sent", sentAt: now.toISOString(), sentByBot: botIndex });
          await db.collection("scheduled_messages").add({
            chatId: data.chatId,
            message: data.message,
            scheduledAt: nextRunAt,
            recurring: data.recurring,
            status: "pending",
            createdAt: now.toISOString(),
            nextRunAt,
          });
          results.push({ id, status: "sent-recurring", botUsed: botIndex });
        }
      } else {
        await doc.ref.update({ status: "failed", errorMessage: error ?? "All bots failed." });
        results.push({ id, status: "failed", error });
      }
    }

    return NextResponse.json({ processed: results.length, results, timestamp: now.toISOString() });
  } catch (err: unknown) {
    console.error("[cron] Error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
