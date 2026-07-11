const TELEGRAM_API_BASE = "https://api.telegram.org";

export async function sendTelegramMessage(
  chatId: string,
  text: string
): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    return { ok: false, error: "TELEGRAM_BOT_TOKEN is not set." };
  }

  try {
    const res = await fetch(
      `${TELEGRAM_API_BASE}/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
        }),
      }
    );

    const data = await res.json();

    if (!data.ok) {
      return {
        ok: false,
        error: data.description ?? "Unknown Telegram API error",
      };
    }

    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    return { ok: false, error: message };
  }
}

export function computeNextRunAt(
  scheduledAt: string,
  recurring: "daily" | "weekly"
): string {
  const date = new Date(scheduledAt);
  if (recurring === "daily") {
    date.setDate(date.getDate() + 1);
  } else if (recurring === "weekly") {
    date.setDate(date.getDate() + 7);
  }
  return date.toISOString();
}
