import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'node:crypto';
import {
  appendFileSync,
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { sanitizeForLog } from '../../common/security/redaction.util';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  resource: string;
  resourceId: string;
  status: string;
  ip: string;
  userAgent: string;
  metadata: unknown;
  message: string;
  previousHash: string;
  integrityHash: string;
}

interface AuditIntegrityResult {
  valid: boolean;
  entriesChecked: number;
  firstBrokenId?: string;
}

@Injectable()
export class AuditLogService {
  private logs: AuditLogEntry[] = [];
  private readonly maxLogs: number;
  private readonly trustProxy: boolean;
  private readonly enabled: boolean;
  private readonly filePath: string;
  private readonly hashSalt: string;
  private lastHash = 'GENESIS';

  constructor(private readonly configService: ConfigService) {
    this.maxLogs = Number(this.configService.get('AUDIT_LOG_MAX_ENTRIES')) || 5_000;
    this.trustProxy = String(this.configService.get('TRUST_PROXY')) === 'true';
    this.enabled = String(this.configService.get('AUDIT_LOG_ENABLED', 'true')) !== 'false';
    this.filePath = this.configService.get<string>(
      'AUDIT_LOG_PATH',
      join(process.cwd(), 'var', 'audit', 'security-audit.jsonl'),
    );
    this.hashSalt =
      this.configService.get<string>('AUDIT_LOG_HASH_SALT') ||
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      'dl247-audit-local-development';
    this.initializeStore();
  }

  private initializeStore() {
    if (!this.enabled) return;
    try {
      mkdirSync(dirname(this.filePath), { recursive: true, mode: 0o700 });
      if (!existsSync(this.filePath)) {
        writeFileSync(this.filePath, '', { encoding: 'utf8', mode: 0o600 });
      }
      chmodSync(this.filePath, 0o600);
      const entries = readFileSync(this.filePath, 'utf8')
        .split('\n')
        .filter(Boolean)
        .flatMap((line) => {
          try {
            return [JSON.parse(line) as AuditLogEntry];
          } catch {
            return [];
          }
        });
      this.lastHash = entries.at(-1)?.integrityHash || 'GENESIS';
      this.logs = entries.slice(-this.maxLogs).reverse();
    } catch (error) {
      console.error('Audit log store initialization failed', sanitizeForLog(error));
    }
  }

  sanitizeAuditMetadata(metadata: unknown): unknown {
    if (metadata === undefined || metadata === null) return null;
    const sanitized = sanitizeForLog(metadata);
    const serialized = JSON.stringify(sanitized);
    if (serialized.length > 5_000) {
      return { warning: 'Metadata truncated due to size limit' };
    }
    return sanitized;
  }

  private hashIp(ip: string) {
    return createHash('sha256')
      .update(`${this.hashSalt}:${ip}`)
      .digest('hex');
  }

  getClientIp(req: any): string {
    if (this.trustProxy && req?.headers?.['x-forwarded-for']) {
      const ips = String(req.headers['x-forwarded-for']).split(',');
      return ips[0].trim();
    }
    return (
      req?.ip ||
      req?.socket?.remoteAddress ||
      req?.connection?.remoteAddress ||
      '127.0.0.1'
    );
  }

  private calculateHash(entry: Omit<AuditLogEntry, 'integrityHash'>) {
    return createHash('sha256')
      .update(`${this.hashSalt}:${JSON.stringify(entry)}`)
      .digest('hex');
  }

  private persist(entry: AuditLogEntry) {
    if (!this.enabled) return;
    try {
      appendFileSync(this.filePath, `${JSON.stringify(entry)}\n`, {
        encoding: 'utf8',
        mode: 0o600,
      });
    } catch (error) {
      console.error('Audit log append failed', sanitizeForLog(error));
    }
  }

  createAuditLog(
    req: any,
    entry: {
      action: string;
      resource: string;
      resourceId?: string;
      status?: string;
      metadata?: unknown;
      message?: string;
    },
  ): AuditLogEntry {
    const rawIp = req ? this.getClientIp(req) : '127.0.0.1';
    const userAgent = String(req?.headers?.['user-agent'] || 'unknown').slice(0, 500);
    const user = req?.user as
      | { userId?: number | string; sub?: number | string; email?: string; role?: string }
      | undefined;

    const withoutIntegrity: Omit<AuditLogEntry, 'integrityHash'> = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      actorId: String(user?.userId || user?.sub || 'system'),
      actorEmail: String(user?.email || 'system').slice(0, 320),
      actorRole: String(user?.role || 'system').slice(0, 50),
      action: String(entry.action || 'UNKNOWN').slice(0, 120),
      resource: String(entry.resource || 'unknown').slice(0, 120),
      resourceId: String(entry.resourceId || 'none').slice(0, 160),
      status: String(entry.status || 'success').slice(0, 40),
      ip: this.hashIp(rawIp),
      userAgent,
      metadata: this.sanitizeAuditMetadata(entry.metadata),
      message: String(sanitizeForLog(entry.message || '')).slice(0, 1_000),
      previousHash: this.lastHash,
    };
    const logEntry: AuditLogEntry = {
      ...withoutIntegrity,
      integrityHash: this.calculateHash(withoutIntegrity),
    };

    this.lastHash = logEntry.integrityHash;
    this.logs.unshift(logEntry);
    if (this.logs.length > this.maxLogs) this.logs.length = this.maxLogs;
    this.persist(logEntry);
    return logEntry;
  }

  auditSuccess(
    req: any,
    action: string,
    resource: string,
    resourceId: string,
    metadata: unknown = null,
    message = '',
  ) {
    return this.createAuditLog(req, {
      action,
      resource,
      resourceId,
      status: 'success',
      metadata,
      message,
    });
  }

  auditFailure(
    req: any,
    action: string,
    resource: string,
    resourceId: string,
    metadata: unknown = null,
    message = '',
  ) {
    return this.createAuditLog(req, {
      action,
      resource,
      resourceId,
      status: 'failure',
      metadata,
      message,
    });
  }

  auditDenied(
    req: any,
    action: string,
    resource: string,
    resourceId: string,
    metadata: unknown = null,
    message = '',
  ) {
    return this.createAuditLog(req, {
      action,
      resource,
      resourceId,
      status: 'denied',
      metadata,
      message,
    });
  }

  auditRateLimited(
    req: any,
    action: string,
    resource: string,
    resourceId: string,
    metadata: unknown = null,
    message = '',
  ) {
    return this.createAuditLog(req, {
      action,
      resource,
      resourceId,
      status: 'rate_limited',
      metadata,
      message,
    });
  }

  verifyIntegrity(): AuditIntegrityResult {
    if (!this.enabled || !existsSync(this.filePath)) {
      return { valid: true, entriesChecked: 0 };
    }
    let previousHash = 'GENESIS';
    let entriesChecked = 0;
    const lines = readFileSync(this.filePath, 'utf8').split('\n').filter(Boolean);
    for (const line of lines) {
      let entry: AuditLogEntry;
      try {
        entry = JSON.parse(line) as AuditLogEntry;
      } catch {
        return { valid: false, entriesChecked };
      }
      const { integrityHash, ...withoutIntegrity } = entry;
      const valid =
        entry.previousHash === previousHash &&
        integrityHash === this.calculateHash(withoutIntegrity);
      if (!valid) {
        return { valid: false, entriesChecked, firstBrokenId: entry.id };
      }
      previousHash = integrityHash;
      entriesChecked += 1;
    }
    return { valid: true, entriesChecked };
  }

  listAuditLogs(query: {
    action?: string;
    actorEmail?: string;
    resource?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) {
    let filteredLogs = [...this.logs];
    if (query.action) filteredLogs = filteredLogs.filter((log) => log.action === query.action?.trim());
    if (query.actorEmail) {
      const email = query.actorEmail.trim().toLowerCase();
      filteredLogs = filteredLogs.filter((log) => log.actorEmail.toLowerCase() === email);
    }
    if (query.resource) filteredLogs = filteredLogs.filter((log) => log.resource === query.resource?.trim());
    if (query.status) filteredLogs = filteredLogs.filter((log) => log.status === query.status);
    if (query.dateFrom) {
      const fromTime = new Date(query.dateFrom).getTime();
      if (!Number.isNaN(fromTime)) {
        filteredLogs = filteredLogs.filter((log) => new Date(log.timestamp).getTime() >= fromTime);
      }
    }
    if (query.dateTo) {
      const toTime = new Date(query.dateTo).getTime() + 86_400_000;
      if (!Number.isNaN(toTime)) {
        filteredLogs = filteredLogs.filter((log) => new Date(log.timestamp).getTime() <= toTime);
      }
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const startIndex = (page - 1) * limit;
    return {
      success: true,
      data: filteredLogs.slice(startIndex, startIndex + limit),
      pagination: {
        page,
        limit,
        totalItems: filteredLogs.length,
        totalPages: Math.ceil(filteredLogs.length / limit),
      },
      integrity: this.verifyIntegrity(),
    };
  }

  clearAuditLogs(): void {
    if (this.configService.get('NODE_ENV') !== 'test') {
      throw new Error('Audit logs can only be cleared in the test environment.');
    }
    this.logs = [];
    this.lastHash = 'GENESIS';
    if (this.enabled) writeFileSync(this.filePath, '', { encoding: 'utf8', mode: 0o600 });
  }
}
