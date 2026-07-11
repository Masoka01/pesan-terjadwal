export type RecurringType = "once" | "daily" | "weekly" | "hourly";
export type MessageStatus = "pending" | "sent" | "failed";

export interface ScheduledMessage {
  id?: string;
  chatId: string;
  message: string;
  scheduledAt: string; // ISO string
  recurring: RecurringType;
  intervalHours?: number; // only for "hourly"
  status: MessageStatus;
  createdAt: string;
  sentAt?: string;
  errorMessage?: string;
  nextRunAt?: string;
}

export interface CreateMessagePayload {
  chatId: string;
  message: string;
  scheduledAt: string;
  recurring: RecurringType;
  intervalHours?: number;
}
