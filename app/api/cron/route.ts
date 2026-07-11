import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase";
import { sendTelegramMessage, computeNextRunAt } from "@/lib/telegram";
import { ScheduledMessage } from "@/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const db = getFirebaseAdmin();

  try {
    // Fetch all pending messages where scheduledAt <= now
    const snapshot = await db
      .collection("scheduled_messages")
      .where("status", "==", "pending")
      .where("scheduledAt", "<=", now.toISOString())
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ processed: 0, message: "No messages due." });
    }

    const results: Array<{ id: string; status: string; error?: string }> = [];

    for (const doc of snapshot.docs) {
      const data = doc.data() as Omit<ScheduledMessage, "id">;
      const id = doc.id;

      const { ok, error } = await sendTelegramMessage(data.chatId, data.message);

      if (ok) {
        if (data.recurring === "once") {
          // Mark as sent
          await doc.ref.update({
            status: "sent",
            sentAt: now.toISOString(),
          });
          results.push({ id, status: "sent" });
        } else {
          // Recurring: schedule next run and keep pending
          const nextRunAt = computeNextRunAt(
            data.nextRunAt ?? data.scheduledAt,
            data.recurring as "daily" | "weekly"
          );
          await doc.ref.update({
            status: "sent",
            sentAt: now.toISOString(),
          });

          // Create next occurrence
          await db.collection("scheduled_messages").add({
            chatId: data.chatId,
            message: data.message,
            scheduledAt: nextRunAt,
            recurring: data.recurring,
            status: "pending",
            createdAt: now.toISOString(),
            nextRunAt,
          });

          results.push({ id, status: "sent-recurring", });
        }
      } else {
        await doc.ref.update({
          status: "failed",
          errorMessage: error ?? "Unknown error",
        });
        results.push({ id, status: "failed", error });
      }
    }

    return NextResponse.json({
      processed: results.length,
      results,
      timestamp: now.toISOString(),
    });
  } catch (err: unknown) {
    console.error("[cron] Error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
