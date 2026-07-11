const TELEGRAM_API_BASE = "https://api.telegram.org";

const BOT_TOKENS = [
  process.env.TELEGRAM_BOT_TOKEN_1,
  process.env.TELEGRAM_BOT_TOKEN_2,
  process.env.TELEGRAM_BOT_TOKEN_3,
  process.env.TELEGRAM_BOT_TOKEN_4,
  process.env.TELEGRAM_BOT_TOKEN_5,
].filter(Boolean) as string[];

export async function sendTelegramMessage(
  chatId: string,
  text: string
): Promise<{ ok: boolean; error?: string }> {
  if (BOT_TOKENS.length === 0) {
    return { ok: false, error: "No TELEGRAM_BOT_TOKEN configured." };
  }

  let lastError = "Unknown error";

  for (let i = 0; i < BOT_TOKENS.length; i++) {
    const token = BOT_TOKENS[i];
    try {
      const res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
      });

      const data = await res.json();

      if (data.ok) return { ok: true };

      lastError = data.description ?? "Unknown Telegram API error";
      const isBlocked =
        lastError.includes("bot was blocked") ||
        lastError.includes("Forbidden") ||
        lastError.includes("user is deactivated") ||
        lastError.includes("chat not found") ||
        lastError.includes("bot was kicked") ||
        lastError.includes("bot is not a member");

      if (!isBlocked) return { ok: false, error: lastError };
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : "Network error";
    }
  }

  return { ok: false, error: `All bots failed. Last: ${lastError}` };
}

export function computeNextRunAt(
  scheduledAt: string,
  recurring: "daily" | "weekly" | "hourly",
  intervalHours?: number
): string {
  const date = new Date(scheduledAt);
  if (recurring === "daily") {
    date.setDate(date.getDate() + 1);
  } else if (recurring === "weekly") {
    date.setDate(date.getDate() + 7);
  } else if (recurring === "hourly") {
    date.setHours(date.getHours() + (intervalHours ?? 1));
  }
  return date.toISOString();
}
