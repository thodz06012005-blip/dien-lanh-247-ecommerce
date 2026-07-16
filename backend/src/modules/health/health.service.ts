import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

interface DatabaseCheck {
  status: 'up' | 'down';
  latencyMs: number;
}

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  liveness() {
    const memory = process.memoryUsage();
    return {
      status: 'ok',
      service: 'dien-lanh-247-api',
      version: process.env.APP_VERSION || 'development',
      environment: process.env.NODE_ENV || 'development',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      checks: {
        process: { status: 'up' },
        memory: {
          rssMb: Math.round(memory.rss / 1024 / 1024),
          heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
        },
      },
    };
  }

  async readiness() {
    const startedAt = Date.now();
    let database: DatabaseCheck;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = { status: 'up', latencyMs: Date.now() - startedAt };
    } catch {
      database = { status: 'down', latencyMs: Date.now() - startedAt };
      throw new ServiceUnavailableException({
        success: false,
        message: 'Service is not ready',
        data: {
          status: 'error',
          service: 'dien-lanh-247-api',
          timestamp: new Date().toISOString(),
          checks: { database },
        },
      });
    }

    return {
      status: 'ok',
      service: 'dien-lanh-247-api',
      version: process.env.APP_VERSION || 'development',
      timestamp: new Date().toISOString(),
      checks: { database },
    };
  }
}
