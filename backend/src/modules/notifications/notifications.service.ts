import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../core/database/prisma.service';
import { MailService } from '../../integrations/mail/mail.service';
import { NotificationTemplateService } from './notification-template.service';
import type { CreateAdminNotificationInput, QueueNotificationInput } from './notification.types';

type OutboxRow = {
  id: bigint;
  channel: 'EMAIL' | 'ADMIN' | 'SMS' | 'ZALO';
  recipient: string | null;
  subject: string | null;
  templateKey: string;
  payload: string | Record<string, unknown>;
  attempts: number;
  maxAttempts: number;
  correlationId: string | null;
};

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly workerId = `notification-worker-${randomUUID()}`;
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly templates: NotificationTemplateService,
  ) {}

  onModuleInit() {
    if (process.env.NOTIFICATION_WORKER_ENABLED === 'false') return;
    const intervalMs = Math.max(5_000, Number(process.env.NOTIFICATION_POLL_INTERVAL_MS || 15_000));
    this.timer = setInterval(() => void this.processBatch(), intervalMs);
    this.timer.unref();
    void this.processBatch();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async enqueue(input: QueueNotificationInput) {
    const payload = JSON.stringify(input.payload);
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO NotificationOutbox
      (idempotencyKey,eventType,channel,recipient,subject,templateKey,payload,maxAttempts,correlationId)
      VALUES (?,?,?,?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE idempotencyKey=idempotencyKey`,
      input.idempotencyKey,
      input.eventType,
      input.channel,
      input.recipient ?? null,
      input.subject ?? null,
      input.templateKey,
      payload,
      input.maxAttempts ?? 5,
      input.correlationId ?? null,
    );
    return { queued: true, idempotencyKey: input.idempotencyKey };
  }

  async createAdminNotification(input: CreateAdminNotificationInput) {
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO AdminNotification
      (dedupeKey,type,severity,title,message,actionUrl,entityType,entityId,expiresAt)
      VALUES (?,?,?,?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE dedupeKey=dedupeKey`,
      input.dedupeKey,
      input.type,
      input.severity ?? 'INFO',
      input.title,
      input.message,
      input.actionUrl ?? null,
      input.entityType ?? null,
      input.entityId ?? null,
      input.expiresAt ?? null,
    );
    return { created: true, dedupeKey: input.dedupeKey };
  }

  async listAdminNotifications(limit = 30, unreadOnly = false) {
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 30));
    const where = unreadOnly ? 'WHERE isRead = false AND (expiresAt IS NULL OR expiresAt > NOW(3))' : 'WHERE expiresAt IS NULL OR expiresAt > NOW(3)';
    return this.prisma.$queryRawUnsafe(
      `SELECT id,type,severity,title,message,actionUrl,entityType,entityId,isRead,readAt,createdAt
       FROM AdminNotification ${where}
       ORDER BY createdAt DESC LIMIT ${safeLimit}`,
    );
  }

  async markRead(id: string) {
    await this.prisma.$executeRawUnsafe(
      'UPDATE AdminNotification SET isRead=true, readAt=COALESCE(readAt,NOW(3)) WHERE id=?',
      id,
    );
    return { updated: true };
  }

  async processBatch() {
    if (this.running) return;
    this.running = true;
    try {
      const rows = await this.prisma.$queryRawUnsafe<OutboxRow[]>(
        `SELECT id,channel,recipient,subject,templateKey,payload,attempts,maxAttempts,correlationId
         FROM NotificationOutbox
         WHERE status IN ('PENDING','FAILED') AND nextAttemptAt <= NOW(3)
         ORDER BY createdAt ASC LIMIT 20`,
      );
      for (const row of rows) await this.processOne(row);
    } catch (error) {
      this.logger.error('Notification worker cycle failed', error instanceof Error ? error.stack : undefined);
    } finally {
      this.running = false;
    }
  }

  private async processOne(row: OutboxRow) {
    const claimed = await this.prisma.$executeRawUnsafe(
      `UPDATE NotificationOutbox SET status='PROCESSING',lockedAt=NOW(3),lockedBy=?
       WHERE id=? AND status IN ('PENDING','FAILED')`,
      this.workerId,
      row.id,
    );
    if (!claimed) return;

    const started = Date.now();
    const attempt = row.attempts + 1;
    try {
      const payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
      if (row.channel === 'EMAIL') {
        if (!row.recipient) throw new Error('EMAIL_RECIPIENT_MISSING');
        const template = this.templates.render(row.templateKey, payload);
        await this.mail.sendTemplated(row.recipient, row.subject || template.subject, template.text, template.html);
      } else if (row.channel === 'ADMIN') {
        await this.createAdminNotification({
          dedupeKey: String(payload.dedupeKey || `outbox:${row.id}`),
          type: String(payload.type || row.templateKey),
          severity: (payload.severity as CreateAdminNotificationInput['severity']) || 'INFO',
          title: String(payload.title || 'Thông báo mới'),
          message: String(payload.message || ''),
          actionUrl: payload.actionUrl ? String(payload.actionUrl) : undefined,
          entityType: payload.entityType ? String(payload.entityType) : undefined,
          entityId: payload.entityId ? String(payload.entityId) : undefined,
        });
      } else {
        await this.sendOptionalProvider(row.channel, row.recipient, payload);
      }

      await this.prisma.$executeRawUnsafe(
        `UPDATE NotificationOutbox SET status='SENT',attempts=?,sentAt=NOW(3),lockedAt=NULL,lockedBy=NULL,lastErrorCode=NULL,lastErrorMessage=NULL WHERE id=?`,
        attempt,
        row.id,
      );
      await this.writeLog(row, true, attempt, Date.now() - started);
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 500) : 'UNKNOWN_DELIVERY_ERROR';
      const terminal = attempt >= row.maxAttempts;
      const delaySeconds = Math.min(3600, 30 * 2 ** Math.max(0, attempt - 1));
      await this.prisma.$executeRawUnsafe(
        `UPDATE NotificationOutbox SET status=?,attempts=?,nextAttemptAt=DATE_ADD(NOW(3),INTERVAL ? SECOND),lockedAt=NULL,lockedBy=NULL,lastErrorCode='DELIVERY_FAILED',lastErrorMessage=? WHERE id=?`,
        terminal ? 'DEAD' : 'FAILED',
        attempt,
        delaySeconds,
        message,
        row.id,
      );
      await this.writeLog(row, false, attempt, Date.now() - started, message);
      this.logger.warn(`Notification ${row.id.toString()} failed on attempt ${attempt}: ${message}`);
    }
  }

  private async sendOptionalProvider(channel: 'SMS' | 'ZALO', recipient: string | null, payload: Record<string, unknown>) {
    const endpoint = channel === 'SMS' ? process.env.SMS_PROVIDER_URL : process.env.ZALO_OA_PROVIDER_URL;
    const token = channel === 'SMS' ? process.env.SMS_PROVIDER_TOKEN : process.env.ZALO_OA_ACCESS_TOKEN;
    if (!endpoint || !token) throw new Error(`${channel}_PROVIDER_NOT_CONFIGURED`);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ recipient, ...payload }),
      signal: AbortSignal.timeout(Number(process.env.INTEGRATION_TIMEOUT_MS || 8_000)),
    });
    if (!response.ok) throw new Error(`${channel}_HTTP_${response.status}`);
  }

  private async writeLog(row: OutboxRow, success: boolean, attempt: number, durationMs: number, errorMessage?: string) {
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO IntegrationDeliveryLog
       (outboxId,provider,channel,success,attempt,durationMs,errorCode,errorMessage,correlationId)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      row.id,
      row.channel,
      row.channel,
      success,
      attempt,
      durationMs,
      success ? null : 'DELIVERY_FAILED',
      errorMessage ?? null,
      row.correlationId,
    );
  }
}
