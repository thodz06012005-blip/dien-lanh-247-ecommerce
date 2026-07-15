export type NotificationChannel = 'EMAIL' | 'ADMIN' | 'SMS' | 'ZALO';

export type NotificationSeverity = 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';

export interface QueueNotificationInput {
  idempotencyKey: string;
  eventType: string;
  channel: NotificationChannel;
  recipient?: string;
  subject?: string;
  templateKey: string;
  payload: Record<string, unknown>;
  correlationId?: string;
  maxAttempts?: number;
}

export interface CreateAdminNotificationInput {
  dedupeKey: string;
  type: string;
  severity?: NotificationSeverity;
  title: string;
  message: string;
  actionUrl?: string;
  entityType?: string;
  entityId?: string;
  expiresAt?: Date;
}

export interface NotificationTemplate {
  subject: string;
  text: string;
  html: string;
}
