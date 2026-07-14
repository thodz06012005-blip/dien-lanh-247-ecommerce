import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import type { EditorialActor, EditorialContentType } from './editorial-cms.types';

interface RevisionRow {
  id: bigint;
  entityType: string;
  entityId: string;
  action: string;
  version: number;
  summary: string | null;
  snapshot: string | Record<string, unknown> | null;
  actorId: number | null;
  actorName: string | null;
  actorEmail: string | null;
  createdAt: Date;
}

@Injectable()
export class ContentRevisionService {
  constructor(private readonly prisma: PrismaService) {}

  private serializeSnapshot(snapshot: unknown) {
    if (snapshot === undefined || snapshot === null) return null;
    return JSON.stringify(snapshot, (key, value) => {
      if (/password|token|cookie|authorization/i.test(key)) return '[REDACTED]';
      return value;
    });
  }

  async record(
    entityType: EditorialContentType,
    entityId: string | number,
    action: string,
    version: number,
    snapshot: unknown,
    actor: EditorialActor,
    summary?: string,
  ) {
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO ContentRevision
        (entityType, entityId, action, version, summary, snapshot, actorId, actorName, actorEmail, createdAt)
       VALUES (?, ?, ?, ?, ?, CAST(? AS JSON), ?, ?, ?, NOW(3))`,
      entityType,
      String(entityId),
      action,
      version,
      summary?.trim() || null,
      this.serializeSnapshot(snapshot),
      actor.userId,
      actor.name?.trim() || actor.email,
      actor.email,
    );
  }

  async list(entityType: EditorialContentType, entityId: string | number, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [rows, counts] = await Promise.all([
      this.prisma.$queryRawUnsafe<RevisionRow[]>(
        `SELECT id, entityType, entityId, action, version, summary, snapshot,
                actorId, actorName, actorEmail, createdAt
         FROM ContentRevision
         WHERE entityType = ? AND entityId = ?
         ORDER BY createdAt DESC, id DESC LIMIT ? OFFSET ?`,
        entityType,
        String(entityId),
        limit,
        offset,
      ),
      this.prisma.$queryRawUnsafe<Array<{ total: bigint | number }>>(
        `SELECT COUNT(*) AS total FROM ContentRevision WHERE entityType = ? AND entityId = ?`,
        entityType,
        String(entityId),
      ),
    ]);
    const total = Number(counts[0]?.total ?? 0);
    return {
      success: true,
      data: rows.map((row) => ({
        ...row,
        id: String(row.id),
        snapshot: typeof row.snapshot === 'string' ? JSON.parse(row.snapshot) : row.snapshot,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
