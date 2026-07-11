export type RecurringType = "once" | "daily" | "weekly";
export type MessageStatus = "pending" | "sent" | "failed";

export interface ScheduledMessage {
  id?: string;
  chatId: string;
  message: string;
  scheduledAt: string; // ISO string
  recurring: RecurringType;
  status: MessageStatus;
  createdAt: string;
  sentAt?: string;
  errorMessage?: string;
  nextRunAt?: string; // for recurring messages
}

export interface CreateMessagePayload {
  chatId: string;
  message: string;
  scheduledAt: string;
  recurring: RecurringType;
}
