import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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
  metadata: any;
  message: string;
}

@Injectable()
export class AuditLogService {
  private logs: AuditLogEntry[] = [];
  private readonly maxLogs: number;
  private readonly trustProxy: boolean;

  constructor(private readonly configService: ConfigService) {
    this.maxLogs = Number(this.configService.get('AUDIT_LOG_MAX_ENTRIES')) || 1000;
    this.trustProxy = this.configService.get('TRUST_PROXY') === 'true';
  }

  private sanitizeValue(key: string, val: any): any {
    if (typeof key === 'string' && /password|hash|token|cookie|authorization/i.test(key)) {
      return '[REDACTED]';
    }
    return val;
  }

  sanitizeAuditMetadata(metadata: any): any {
    if (!metadata) return null;
    try {
      const serialized = JSON.stringify(metadata, (key, val) => this.sanitizeValue(key, val));
      const parsed = JSON.parse(serialized);

      const sizeStr = JSON.stringify(parsed);
      if (sizeStr.length > 5000) {
        return { warning: 'Metadata truncated due to size limit' };
      }
      return parsed;
    } catch (e) {
      return { error: 'Failed to sanitize metadata' };
    }
  }

  getClientIp(req: any): string {
    if (this.trustProxy && req.headers && req.headers['x-forwarded-for']) {
      const ips = req.headers['x-forwarded-for'].split(',');
      return ips[0].trim();
    }
    return req.ip || (req.socket && req.socket.remoteAddress) || (req.connection && req.connection.remoteAddress) || '127.0.0.1';
  }

  createAuditLog(req: any, entry: { action: string; resource: string; resourceId?: string; status?: string; metadata?: any; message?: string }): AuditLogEntry {
    const ip = req ? this.getClientIp(req) : '127.0.0.1';
    const userAgent = req && req.headers ? req.headers['user-agent'] || 'unknown' : 'unknown';

    let actorId = 'system';
    let actorEmail = 'system';
    let actorRole = 'system';

    if (req && req.user) {
      actorId = String(req.user.userId || req.user.sub || 'unknown');
      actorEmail = req.user.email || 'unknown';
      actorRole = req.user.role || 'unknown';
    }

    const logEntry: AuditLogEntry = {
      id: 'AUD-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
      timestamp: new Date().toISOString(),
      actorId,
      actorEmail,
      actorRole,
      action: entry.action,
      resource: entry.resource || 'unknown',
      resourceId: entry.resourceId ? String(entry.resourceId) : 'none',
      status: entry.status || 'success',
      ip,
      userAgent,
      metadata: this.sanitizeAuditMetadata(entry.metadata),
      message: entry.message || '',
    };

    this.logs.unshift(logEntry); // newest first

    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    return logEntry;
  }

  auditSuccess(req: any, action: string, resource: string, resourceId: string, metadata: any = null, message = ''): AuditLogEntry {
    return this.createAuditLog(req, { action, resource, resourceId, status: 'success', metadata, message });
  }

  auditFailure(req: any, action: string, resource: string, resourceId: string, metadata: any = null, message = ''): AuditLogEntry {
    return this.createAuditLog(req, { action, resource, resourceId, status: 'failure', metadata, message });
  }

  auditDenied(req: any, action: string, resource: string, resourceId: string, metadata: any = null, message = ''): AuditLogEntry {
    return this.createAuditLog(req, { action, resource, resourceId, status: 'denied', metadata, message });
  }

  auditRateLimited(req: any, action: string, resource: string, resourceId: string, metadata: any = null, message = ''): AuditLogEntry {
    return this.createAuditLog(req, { action, resource, resourceId, status: 'rate_limited', metadata, message });
  }

  listAuditLogs(query: { action?: string; actorEmail?: string; resource?: string; status?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number }) {
    let filteredLogs = [...this.logs];

    if (query.action) {
      const act = query.action.trim();
      filteredLogs = filteredLogs.filter(l => l.action === act);
    }
    if (query.actorEmail) {
      const email = query.actorEmail.trim().toLowerCase();
      filteredLogs = filteredLogs.filter(l => l.actorEmail.toLowerCase() === email);
    }
    if (query.resource) {
      const resName = query.resource.trim();
      filteredLogs = filteredLogs.filter(l => l.resource === resName);
    }
    if (query.status) {
      filteredLogs = filteredLogs.filter(l => l.status === query.status);
    }
    if (query.dateFrom) {
      const fromTime = new Date(query.dateFrom).getTime();
      filteredLogs = filteredLogs.filter(l => new Date(l.timestamp).getTime() >= fromTime);
    }
    if (query.dateTo) {
      const toTime = new Date(query.dateTo).getTime() + 86400000;
      filteredLogs = filteredLogs.filter(l => new Date(l.timestamp).getTime() <= toTime);
    }

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const paginatedLogs = filteredLogs.slice(startIndex, startIndex + limit);

    return {
      success: true,
      data: paginatedLogs,
      pagination: {
        page,
        limit,
        totalItems: filteredLogs.length,
        totalPages: Math.ceil(filteredLogs.length / limit)
      }
    };
  }

  clearAuditLogs(): void {
    this.logs = [];
  }
}
