import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

export interface DatabaseCheck {
  status: 'up' | 'down';
  latencyMs: number;
}

export interface LivenessResponse {
  status: 'ok';
  service: string;
  version: string;
  environment: string;
  uptimeSeconds: number;
  timestamp: string;
  checks: {
    process: { status: 'up' };
    memory: { rssMb: number; heapUsedMb: number };
  };
}

export interface ReadinessResponse {
  status: 'ok';
  service: string;
  version: string;
  timestamp: string;
  checks: { database: DatabaseCheck };
}

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  liveness(): LivenessResponse {
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

  async readiness(): Promise<ReadinessResponse> {
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
