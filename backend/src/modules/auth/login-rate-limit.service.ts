import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface FailedAttempt {
  timestamp: number;
  ip: string;
  email: string;
}

@Injectable()
export class LoginRateLimitService {
  private failedAttempts: FailedAttempt[] = [];

  private readonly windowMs: number;
  private readonly maxPerEmail: number;
  private readonly maxPerIp: number;
  private readonly maxPerIpEmail: number;
  private readonly lockMs: number;
  private readonly trustProxy: boolean;

  constructor(private readonly configService: ConfigService) {
    this.windowMs = Number(this.configService.get('LOGIN_RATE_LIMIT_WINDOW_MS')) || 900000;
    this.maxPerEmail = Number(this.configService.get('LOGIN_RATE_LIMIT_MAX_PER_EMAIL')) || 5;
    this.maxPerIp = Number(this.configService.get('LOGIN_RATE_LIMIT_MAX_PER_IP')) || 20;
    this.maxPerIpEmail = Number(this.configService.get('LOGIN_RATE_LIMIT_MAX_PER_IP_EMAIL')) || 5;
    this.lockMs = Number(this.configService.get('LOGIN_RATE_LIMIT_LOCK_MS')) || 900000;
    this.trustProxy = this.configService.get('TRUST_PROXY') === 'true';
  }

  normalizeEmail(email: string): string {
    if (typeof email !== 'string') return '';
    return email.trim().toLowerCase();
  }

  getClientIp(req: any): string {
    if (this.trustProxy && req.headers && req.headers['x-forwarded-for']) {
      const ips = req.headers['x-forwarded-for'].split(',');
      return ips[0].trim();
    }
    return req.ip || (req.socket && req.socket.remoteAddress) || (req.connection && req.connection.remoteAddress) || '127.0.0.1';
  }

  private clearExpiredAttempts(): void {
    const now = Date.now();
    const maxKeepAge = Math.max(this.windowMs, this.lockMs);
    this.failedAttempts = this.failedAttempts.filter(
      (attempt) => now - attempt.timestamp < maxKeepAge,
    );
  }

  checkLockout(ip: string, email: string): void {
    this.clearExpiredAttempts();
    const normEmail = this.normalizeEmail(email);
    const now = Date.now();

    const emailAttempts = this.failedAttempts.filter(
      (a) => a.email === normEmail && now - a.timestamp < this.windowMs,
    );
    const ipAttempts = this.failedAttempts.filter(
      (a) => a.ip === ip && now - a.timestamp < this.windowMs,
    );
    const comboAttempts = this.failedAttempts.filter(
      (a) => a.ip === ip && a.email === normEmail && now - a.timestamp < this.windowMs,
    );

    let isLocked = false;
    let latestTimestamp = 0;

    if (emailAttempts.length >= this.maxPerEmail) {
      isLocked = true;
      latestTimestamp = Math.max(latestTimestamp, ...emailAttempts.map((a) => a.timestamp));
    }
    if (ipAttempts.length >= this.maxPerIp) {
      isLocked = true;
      latestTimestamp = Math.max(latestTimestamp, ...ipAttempts.map((a) => a.timestamp));
    }
    if (comboAttempts.length >= this.maxPerIpEmail) {
      isLocked = true;
      latestTimestamp = Math.max(latestTimestamp, ...comboAttempts.map((a) => a.timestamp));
    }

    if (isLocked) {
      const elapsed = now - latestTimestamp;
      if (elapsed < this.lockMs) {
        const retryAfterSeconds = Math.ceil((this.lockMs - elapsed) / 1000);
        throw new HttpException(
          {
            success: false,
            message: 'Too many login attempts. Please try again later.',
            retryAfterSeconds,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }
  }

  recordFailure(ip: string, email: string): void {
    const normEmail = this.normalizeEmail(email);
    this.failedAttempts.push({
      timestamp: Date.now(),
      ip,
      email: normEmail,
    });
    this.clearExpiredAttempts();
  }

  recordSuccess(ip: string, email: string): void {
    const normEmail = this.normalizeEmail(email);
    this.failedAttempts = this.failedAttempts.filter(
      (a) => a.email !== normEmail && !(a.ip === ip && a.email === normEmail),
    );
    this.clearExpiredAttempts();
  }
}
