import { HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoginRateLimitService } from './login-rate-limit.service';

describe('LoginRateLimitService', () => {
  const values: Record<string, unknown> = {
    LOGIN_RATE_LIMIT_WINDOW_MS: 60_000,
    LOGIN_RATE_LIMIT_MAX_PER_EMAIL: 3,
    LOGIN_RATE_LIMIT_MAX_PER_IP: 10,
    LOGIN_RATE_LIMIT_MAX_PER_IP_EMAIL: 3,
    LOGIN_RATE_LIMIT_LOCK_MS: 120_000,
    TRUST_PROXY: 'true',
  };

  const createService = () =>
    new LoginRateLimitService({
      get: (key: string) => values[key],
    } as ConfigService);

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-16T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('normalizes email and trusts only the first forwarded address', () => {
    const service = createService();
    expect(service.normalizeEmail('  Admin@Example.COM ')).toBe('admin@example.com');
    expect(
      service.getClientIp({
        headers: { 'x-forwarded-for': '203.0.113.7, 10.0.0.2' },
      }),
    ).toBe('203.0.113.7');
  });

  it('locks the email and IP combination after the configured failures', () => {
    const service = createService();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      service.recordFailure('203.0.113.7', 'ADMIN@example.com');
    }

    expect(() => service.checkLockout('203.0.113.7', 'admin@example.com')).toThrow(
      HttpException,
    );

    try {
      service.checkLockout('203.0.113.7', 'admin@example.com');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(429);
      expect((error as HttpException).getResponse()).toMatchObject({
        retryAfterSeconds: 120,
      });
    }
  });

  it('clears matching failures after a successful login', () => {
    const service = createService();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      service.recordFailure('203.0.113.7', 'admin@example.com');
    }

    service.recordSuccess('203.0.113.7', 'admin@example.com');
    expect(() => service.checkLockout('203.0.113.7', 'admin@example.com')).not.toThrow();
  });
});
