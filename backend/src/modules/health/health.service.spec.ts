import { ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  it('returns process metadata for liveness without touching the database', () => {
    const prisma = { $queryRaw: jest.fn() } as unknown as PrismaService;
    const service = new HealthService(prisma);

    expect(service.liveness()).toMatchObject({
      status: 'ok',
      service: 'dien-lanh-247-api',
      checks: { process: { status: 'up' } },
    });
    expect((prisma as unknown as { $queryRaw: jest.Mock }).$queryRaw).not.toHaveBeenCalled();
  });

  it('reports readiness when the database answers', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ ok: 1 }]),
    } as unknown as PrismaService;
    const service = new HealthService(prisma);

    await expect(service.readiness()).resolves.toMatchObject({
      status: 'ok',
      checks: { database: { status: 'up' } },
    });
  });

  it('returns service unavailable when the database is down', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockRejectedValue(new Error('database unavailable')),
    } as unknown as PrismaService;
    const service = new HealthService(prisma);

    await expect(service.readiness()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
