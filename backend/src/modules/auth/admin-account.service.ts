import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { getAdminPermissions } from '../../common/auth/admin-permissions';
import { PrismaService } from '../../core/database/prisma.service';
import { ChangeAdminPasswordDto, UpdateAdminProfileDto } from './dto/admin-profile.dto';

interface AdminRow {
  id: number;
  email: string;
  password: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: string;
  isActive: number | boolean;
  lockedAt: Date | null;
  lastLoginAt: Date | null;
  passwordChangedAt: Date | null;
}

@Injectable()
export class AdminAccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private async getAdmin(userId: number) {
    const rows = await this.prisma.$queryRawUnsafe<AdminRow[]>(
      `SELECT id, email, password, firstName, lastName, phone, role, isActive,
              lockedAt, lastLoginAt, passwordChangedAt
       FROM User WHERE id = ? LIMIT 1`,
      userId,
    );
    const user = rows[0];
    if (!user || !['ADMIN', 'SUPERADMIN', 'STAFF'].includes(user.role)) {
      throw new NotFoundException('Không tìm thấy tài khoản quản trị');
    }
    if (!user.isActive || user.lockedAt) {
      throw new ForbiddenException('Tài khoản quản trị đã bị khóa');
    }
    return user;
  }

  private safeProfile(user: AdminRow) {
    return {
      id: String(user.id),
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      email: user.email,
      phone: user.phone,
      role: user.role.toLowerCase(),
      status: 'active',
      permissions: getAdminPermissions(user.role),
      lastLoginAt: user.lastLoginAt,
      passwordChangedAt: user.passwordChangedAt,
    };
  }

  async getProfile(userId: number) {
    return this.safeProfile(await this.getAdmin(userId));
  }

  async updateProfile(userId: number, dto: UpdateAdminProfileDto) {
    await this.getAdmin(userId);
    const phone = dto.phone?.replace(/\D/g, '') || null;
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        phone,
      },
    });
    return this.getProfile(userId);
  }

  async changePassword(userId: number, dto: ChangeAdminPasswordDto) {
    const user = await this.getAdmin(userId);
    const matches = await bcrypt.compare(dto.currentPassword, user.password);
    if (!matches) throw new ForbiddenException('Mật khẩu hiện tại không đúng');
    if (await bcrypt.compare(dto.newPassword, user.password)) {
      throw new ForbiddenException('Mật khẩu mới phải khác mật khẩu hiện tại');
    }
    const rounds = Math.min(15, Math.max(8, Number(this.configService.get('BCRYPT_SALT_ROUNDS')) || 10));
    const passwordHash = await bcrypt.hash(dto.newPassword, rounds);
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `UPDATE User SET password = ?, passwordChangedAt = NOW(3), tokenVersion = tokenVersion + 1,
                         refreshToken = NULL WHERE id = ?`,
        passwordHash,
        userId,
      );
      await tx.$executeRawUnsafe(
        `UPDATE AuthSession SET revokedAt = COALESCE(revokedAt, NOW(3)), revokeReason = 'ADMIN_PASSWORD_CHANGED'
         WHERE userId = ? AND revokedAt IS NULL`,
        userId,
      );
    });
    return { revokedAllSessions: true };
  }

  async listSessions(userId: number, currentSessionId: string) {
    await this.getAdmin(userId);
    const rows = await this.prisma.$queryRawUnsafe<Array<{
      id: string;
      userAgent: string | null;
      createdAt: Date;
      lastUsedAt: Date | null;
      rotatedAt: Date | null;
      expiresAt: Date;
      revokedAt: Date | null;
    }>>(
      `SELECT id, userAgent, createdAt, lastUsedAt, rotatedAt, expiresAt, revokedAt
       FROM AuthSession WHERE userId = ? ORDER BY createdAt DESC LIMIT 30`,
      userId,
    );
    return rows.map((session) => ({
      ...session,
      current: session.id === currentSessionId,
      active: !session.revokedAt && session.expiresAt.getTime() > Date.now(),
    }));
  }

  async revokeSession(userId: number, sessionId: string) {
    await this.getAdmin(userId);
    const affected = await this.prisma.$executeRawUnsafe(
      `UPDATE AuthSession SET revokedAt = COALESCE(revokedAt, NOW(3)), revokeReason = 'ADMIN_SESSION_REVOKED'
       WHERE id = ? AND userId = ?`,
      sessionId,
      userId,
    );
    if (!Number(affected)) throw new NotFoundException('Không tìm thấy phiên đăng nhập');
    return { revoked: true, sessionId };
  }
}
