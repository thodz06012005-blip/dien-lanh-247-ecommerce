import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { Request } from 'express';
import { PrismaService } from '../../core/database/prisma.service';
import { MailService } from '../../integrations/mail/mail.service';
import { AuditLogService } from '../audit/audit-log.service';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginRateLimitService } from './login-rate-limit.service';

interface SessionClaims {
  userId: number;
  email: string;
  role: string;
  sessionId: string;
  familyId: string;
  tokenVersion: number;
  refreshToken: string;
}

interface UserSecurityRow {
  id: number;
  email: string;
  password: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  normalizedPhone: string | null;
  role: string;
  isActive: number | boolean;
  refreshToken: string | null;
  emailVerifiedAt: Date | null;
  phoneVerifiedAt: Date | null;
  tokenVersion: number;
  passwordChangedAt: Date | null;
  lastLoginAt: Date | null;
  lockedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SessionRow {
  id: string;
  userId: number;
  familyId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

@Injectable()
export class AuthService {
  private readonly dummyHash = '$2b$10$QmV2tV07jDkw0xhiuGNYBuUQHyi8c2UYpH68QOqT7W6G6Jwzj1rjW';

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly loginRateLimitService: LoginRateLimitService,
    private readonly auditLogService: AuditLogService,
    private readonly mailService: MailService,
  ) {}

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private normalizePhone(phone?: string | null) {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    return digits.startsWith('84') ? `0${digits.slice(2)}` : digits;
  }

  private hashSecret(secret: string) {
    return createHash('sha256').update(secret).digest('hex');
  }

  private hashIp(ip?: string) {
    if (!ip) return null;
    return createHash('sha256').update(`dl247:${ip}`).digest('hex');
  }

  private getClientIp(req?: Request) {
    return req ? this.loginRateLimitService.getClientIp(req) : 'unknown';
  }

  private getSaltRounds() {
    return Math.min(15, Math.max(8, Number(this.configService.get('BCRYPT_SALT_ROUNDS')) || 10));
  }

  private getAccessExpiresIn() {
    return this.configService.get<string>('JWT_EXPIRES_IN', '15m');
  }

  private getRefreshExpiresIn() {
    return this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
  }

  private durationToMs(value: string, fallbackMs: number) {
    const match = value.trim().match(/^(\d+)(s|m|h|d)$/i);
    if (!match) return fallbackMs;
    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();
    const multiplier = unit === 's' ? 1000 : unit === 'm' ? 60_000 : unit === 'h' ? 3_600_000 : 86_400_000;
    return amount * multiplier;
  }

  private async getUserSecurityByEmail(email: string) {
    const rows = await this.prisma.$queryRawUnsafe<UserSecurityRow[]>(
      `SELECT id, email, password, firstName, lastName, phone, normalizedPhone, role,
              isActive, refreshToken, emailVerifiedAt, phoneVerifiedAt, tokenVersion,
              passwordChangedAt, lastLoginAt, lockedAt, createdAt, updatedAt
       FROM User WHERE email = ? LIMIT 1`,
      this.normalizeEmail(email),
    );
    return rows[0] ?? null;
  }

  private async getUserSecurityById(userId: number) {
    const rows = await this.prisma.$queryRawUnsafe<UserSecurityRow[]>(
      `SELECT id, email, password, firstName, lastName, phone, normalizedPhone, role,
              isActive, refreshToken, emailVerifiedAt, phoneVerifiedAt, tokenVersion,
              passwordChangedAt, lastLoginAt, lockedAt, createdAt, updatedAt
       FROM User WHERE id = ? LIMIT 1`,
      userId,
    );
    return rows[0] ?? null;
  }

  private toSafeUser(user: UserSecurityRow) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      isActive: Boolean(user.isActive),
      emailVerified: Boolean(user.emailVerifiedAt),
      phoneVerified: Boolean(user.phoneVerifiedAt),
      passwordChangedAt: user.passwordChangedAt,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private assertAccountUsable(user: UserSecurityRow) {
    if (!Boolean(user.isActive) || user.lockedAt) {
      void this.revokeAllSessions(user.id, 'ACCOUNT_LOCKED');
      throw new ForbiddenException('Tài khoản hiện không thể đăng nhập');
    }
  }

  private async generateTokens(user: UserSecurityRow, sessionId: string, familyId: string) {
    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET');
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!accessSecret || !refreshSecret) throw new Error('JWT secrets are not configured');

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sid: sessionId,
      fid: familyId,
      tv: user.tokenVersion,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: this.getAccessExpiresIn() as never,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: this.getRefreshExpiresIn() as never,
      }),
    ]);
    return { accessToken, refreshToken };
  }

  private async createSession(user: UserSecurityRow, req?: Request) {
    const sessionId = randomUUID();
    const familyId = randomUUID();
    const tokens = await this.generateTokens(user, sessionId, familyId);
    const refreshLifetime = this.durationToMs(this.getRefreshExpiresIn(), 7 * 86_400_000);

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO AuthSession
        (id, userId, familyId, refreshTokenHash, userAgent, ipHash, expiresAt, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(3))`,
      sessionId,
      user.id,
      familyId,
      this.hashSecret(tokens.refreshToken),
      req?.headers['user-agent']?.slice(0, 500) ?? null,
      this.hashIp(req?.ip),
      new Date(Date.now() + refreshLifetime),
    );

    // Clear the legacy single-token slot. Existing columns remain for compatibility.
    await this.prisma.user.update({ where: { id: user.id }, data: { refreshToken: null } });
    return { ...tokens, sessionId, familyId };
  }

  private async createNotification(
    userId: number,
    type: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ) {
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO CustomerNotification (userId, type, title, body, data, createdAt)
       VALUES (?, ?, ?, ?, ?, NOW(3))`,
      userId,
      type,
      title,
      body,
      data ? JSON.stringify(data) : null,
    );
  }

  private async linkVerifiedServiceRequests(user: UserSecurityRow) {
    const clauses: string[] = [];
    const params: unknown[] = [user.id];
    if (user.emailVerifiedAt) {
      clauses.push('customerEmail = ?');
      params.push(user.email);
    }
    if (user.phoneVerifiedAt && user.normalizedPhone) {
      clauses.push('customerPhone = ?');
      params.push(user.normalizedPhone);
    }
    if (!clauses.length) return 0;
    const affected = await this.prisma.$executeRawUnsafe(
      `UPDATE ServiceRequest SET customerUserId = ?
       WHERE customerUserId IS NULL AND (${clauses.join(' OR ')})`,
      ...params,
    );
    return Number(affected);
  }

  private async issueEmailVerification(user: UserSecurityRow) {
    if (user.emailVerifiedAt) return { verificationSent: false, debugToken: undefined as string | undefined };
    const token = randomBytes(32).toString('base64url');
    const tokenHash = this.hashSecret(token);
    const expiresAt = new Date(Date.now() + 24 * 3_600_000);
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        'UPDATE EmailVerificationToken SET usedAt = NOW(3) WHERE userId = ? AND usedAt IS NULL',
        user.id,
      );
      await tx.$executeRawUnsafe(
        `INSERT INTO EmailVerificationToken (userId, tokenHash, expiresAt, createdAt)
         VALUES (?, ?, ?, NOW(3))`,
        user.id,
        tokenHash,
        expiresAt,
      );
    });
    const frontendUrl = this.configService.get<string>('FRONTEND_USER_URL', 'http://localhost:5173');
    await this.mailService.sendEmailVerification(user.email, `${frontendUrl}/#/verify-email?token=${encodeURIComponent(token)}`);
    const debugToken = this.configService.get('NODE_ENV') === 'test' && this.configService.get('ENABLE_DEV_ENDPOINTS') === 'true'
      ? token
      : undefined;
    return { verificationSent: true, debugToken };
  }

  async register(dto: RegisterDto, req?: Request) {
    const email = this.normalizeEmail(dto.email);
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new ConflictException('Email đã được sử dụng');

    const normalizedPhone = this.normalizePhone(dto.phone);
    if (normalizedPhone) {
      const duplicate = await this.prisma.$queryRawUnsafe<Array<{ id: number }>>(
        'SELECT id FROM User WHERE normalizedPhone = ? LIMIT 1',
        normalizedPhone,
      );
      if (duplicate.length) throw new ConflictException('Số điện thoại đã được sử dụng');
    }

    const hashedPassword = await bcrypt.hash(dto.password, this.getSaltRounds());
    const created = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: dto.firstName?.trim() || null,
        lastName: dto.lastName?.trim() || null,
        phone: normalizedPhone,
      },
    });
    await this.prisma.$executeRawUnsafe(
      'UPDATE User SET normalizedPhone = ?, passwordChangedAt = NOW(3) WHERE id = ?',
      normalizedPhone,
      created.id,
    );
    const user = await this.getUserSecurityById(created.id);
    if (!user) throw new NotFoundException('Không thể tạo tài khoản');
    const tokens = await this.createSession(user, req);
    const verification = await this.issueEmailVerification(user);
    await this.createNotification(
      user.id,
      'ACCOUNT_CREATED',
      'Chào mừng đến Điện Lạnh 247',
      'Tài khoản của bạn đã được tạo. Hãy xác minh email để tự động liên kết lịch sử dịch vụ.',
    );
    return { tokens, user: this.toSafeUser(user), verification };
  }

  async login(dto: LoginDto, req?: Request) {
    const email = this.normalizeEmail(dto.email);
    const ip = this.getClientIp(req);
    this.loginRateLimitService.checkLockout(ip, email);
    const user = await this.getUserSecurityByEmail(email);
    const passwordMatches = await bcrypt.compare(dto.password, user?.password ?? this.dummyHash);

    if (!user || !passwordMatches) {
      this.loginRateLimitService.recordFailure(ip, email);
      if (req) this.auditLogService.auditFailure(req, 'CUSTOMER_LOGIN_FAILED', 'auth', 'none', { email }, 'Customer login failed');
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    this.assertAccountUsable(user);
    this.loginRateLimitService.recordSuccess(ip, email);
    await this.prisma.$executeRawUnsafe('UPDATE User SET lastLoginAt = NOW(3) WHERE id = ?', user.id);
    const refreshedUser = (await this.getUserSecurityById(user.id)) ?? user;
    const linkedCount = await this.linkVerifiedServiceRequests(refreshedUser);
    const tokens = await this.createSession(refreshedUser, req);
    if (req) this.auditLogService.auditSuccess(req, 'CUSTOMER_LOGIN_SUCCESS', 'auth', String(user.id), { linkedCount }, 'Customer login successful');
    return { tokens, user: this.toSafeUser(refreshedUser), linkedCount };
  }

  async refreshTokens(claims: SessionClaims, req?: Request) {
    const user = await this.getUserSecurityById(claims.userId);
    if (!user) throw new ForbiddenException('Phiên đăng nhập không hợp lệ');
    this.assertAccountUsable(user);
    if (claims.tokenVersion !== user.tokenVersion) throw new ForbiddenException('Phiên đăng nhập đã bị thu hồi');

    const sessions = await this.prisma.$queryRawUnsafe<SessionRow[]>(
      `SELECT id, userId, familyId, refreshTokenHash, expiresAt, revokedAt
       FROM AuthSession WHERE id = ? AND userId = ? LIMIT 1`,
      claims.sessionId,
      user.id,
    );
    const session = sessions[0];
    if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
      throw new ForbiddenException('Phiên đăng nhập đã hết hiệu lực');
    }
    if (session.familyId !== claims.familyId || session.refreshTokenHash !== this.hashSecret(claims.refreshToken)) {
      await this.prisma.$executeRawUnsafe(
        `UPDATE AuthSession SET revokedAt = COALESCE(revokedAt, NOW(3)), revokeReason = 'TOKEN_REUSE_DETECTED'
         WHERE familyId = ?`,
        session.familyId,
      );
      throw new ForbiddenException('Phát hiện refresh token không hợp lệ; toàn bộ họ phiên đã bị thu hồi');
    }

    const tokens = await this.generateTokens(user, session.id, session.familyId);
    const refreshLifetime = this.durationToMs(this.getRefreshExpiresIn(), 7 * 86_400_000);
    await this.prisma.$executeRawUnsafe(
      `UPDATE AuthSession
       SET refreshTokenHash = ?, rotatedAt = NOW(3), lastUsedAt = NOW(3), expiresAt = ?
       WHERE id = ?`,
      this.hashSecret(tokens.refreshToken),
      new Date(Date.now() + refreshLifetime),
      session.id,
    );
    return tokens;
  }

  async getUserProfile(userId: number) {
    const user = await this.getUserSecurityById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    this.assertAccountUsable(user);
    return this.toSafeUser(user);
  }

  async logout(userId: number, sessionId?: string) {
    if (sessionId) {
      await this.prisma.$executeRawUnsafe(
        `UPDATE AuthSession SET revokedAt = COALESCE(revokedAt, NOW(3)), revokeReason = 'LOGOUT'
         WHERE id = ? AND userId = ?`,
        sessionId,
        userId,
      );
    } else {
      await this.revokeAllSessions(userId, 'LOGOUT_ALL');
    }
    await this.prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
  }

  async revokeAllSessions(userId: number, reason = 'SECURITY_EVENT') {
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `UPDATE AuthSession SET revokedAt = COALESCE(revokedAt, NOW(3)), revokeReason = ?
         WHERE userId = ? AND revokedAt IS NULL`,
        reason,
        userId,
      );
      await tx.$executeRawUnsafe('UPDATE User SET tokenVersion = tokenVersion + 1, refreshToken = NULL WHERE id = ?', userId);
    });
  }

  async requestPasswordReset(dto: ForgotPasswordDto, req?: Request) {
    const email = this.normalizeEmail(dto.email);
    const user = await this.getUserSecurityByEmail(email);
    // Always return the same public response to prevent account enumeration.
    if (!user || !Boolean(user.isActive) || user.lockedAt) return { accepted: true };

    const recent = await this.prisma.$queryRawUnsafe<Array<{ total: bigint }>>(
      `SELECT COUNT(*) AS total FROM PasswordResetToken
       WHERE userId = ? AND createdAt >= DATE_SUB(NOW(3), INTERVAL 60 SECOND)`,
      user.id,
    );
    if (Number(recent[0]?.total ?? 0) > 0) return { accepted: true };

    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 30 * 60_000);
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        'UPDATE PasswordResetToken SET usedAt = NOW(3) WHERE userId = ? AND usedAt IS NULL',
        user.id,
      );
      await tx.$executeRawUnsafe(
        `INSERT INTO PasswordResetToken (userId, tokenHash, requestedIpHash, expiresAt, createdAt)
         VALUES (?, ?, ?, ?, NOW(3))`,
        user.id,
        this.hashSecret(token),
        this.hashIp(req?.ip),
        expiresAt,
      );
    });
    const frontendUrl = this.configService.get<string>('FRONTEND_USER_URL', 'http://localhost:5173');
    await this.mailService.sendPasswordReset(user.email, `${frontendUrl}/#/reset-password?token=${encodeURIComponent(token)}`);
    const debugToken = this.configService.get('NODE_ENV') === 'test' && this.configService.get('ENABLE_DEV_ENDPOINTS') === 'true'
      ? token
      : undefined;
    return { accepted: true, debugToken };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = this.hashSecret(dto.token);
    const rows = await this.prisma.$queryRawUnsafe<Array<{ id: bigint; userId: number; expiresAt: Date; usedAt: Date | null }>>(
      `SELECT id, userId, expiresAt, usedAt FROM PasswordResetToken
       WHERE tokenHash = ? LIMIT 1`,
      tokenHash,
    );
    const reset = rows[0];
    if (!reset || reset.usedAt || reset.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');
    }
    const passwordHash = await bcrypt.hash(dto.newPassword, this.getSaltRounds());
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `UPDATE User SET password = ?, passwordChangedAt = NOW(3), tokenVersion = tokenVersion + 1,
                         refreshToken = NULL
         WHERE id = ?`,
        passwordHash,
        reset.userId,
      );
      await tx.$executeRawUnsafe('UPDATE PasswordResetToken SET usedAt = NOW(3) WHERE id = ?', reset.id);
      await tx.$executeRawUnsafe(
        `UPDATE AuthSession SET revokedAt = COALESCE(revokedAt, NOW(3)), revokeReason = 'PASSWORD_RESET'
         WHERE userId = ? AND revokedAt IS NULL`,
        reset.userId,
      );
      await tx.$executeRawUnsafe(
        `INSERT INTO CustomerNotification (userId, type, title, body, createdAt)
         VALUES (?, 'PASSWORD_CHANGED', 'Mật khẩu đã được thay đổi',
                 'Mật khẩu tài khoản vừa được đặt lại. Nếu không phải bạn, hãy liên hệ hỗ trợ ngay.', NOW(3))`,
        reset.userId,
      );
    });
    return { success: true };
  }

  async resendEmailVerification(userId: number) {
    const user = await this.getUserSecurityById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản');
    return this.issueEmailVerification(user);
  }

  async verifyEmail(token: string) {
    const tokenHash = this.hashSecret(token);
    const rows = await this.prisma.$queryRawUnsafe<Array<{ id: bigint; userId: number; expiresAt: Date; usedAt: Date | null }>>(
      `SELECT id, userId, expiresAt, usedAt FROM EmailVerificationToken
       WHERE tokenHash = ? LIMIT 1`,
      tokenHash,
    );
    const verification = rows[0];
    if (!verification || verification.usedAt || verification.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Liên kết xác minh email không hợp lệ hoặc đã hết hạn');
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('UPDATE EmailVerificationToken SET usedAt = NOW(3) WHERE id = ?', verification.id);
      await tx.$executeRawUnsafe('UPDATE User SET emailVerifiedAt = COALESCE(emailVerifiedAt, NOW(3)) WHERE id = ?', verification.userId);
    });
    const user = await this.getUserSecurityById(verification.userId);
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản');
    const linkedCount = await this.linkVerifiedServiceRequests(user);
    await this.createNotification(
      user.id,
      'EMAIL_VERIFIED',
      'Email đã được xác minh',
      linkedCount > 0
        ? `Đã tự động liên kết ${linkedCount} yêu cầu dịch vụ trước đây với tài khoản.`
        : 'Email của bạn đã được xác minh thành công.',
      { linkedCount },
    );
    return { user: this.toSafeUser(user), linkedCount };
  }

  async validateAccessSession(payload: { sub: number; sid: string; tv: number }) {
    const user = await this.getUserSecurityById(Number(payload.sub));
    if (!user || !Boolean(user.isActive) || user.lockedAt || user.tokenVersion !== Number(payload.tv)) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ');
    }
    const sessions = await this.prisma.$queryRawUnsafe<Array<{ id: string; revokedAt: Date | null; expiresAt: Date }>>(
      'SELECT id, revokedAt, expiresAt FROM AuthSession WHERE id = ? AND userId = ? LIMIT 1',
      payload.sid,
      user.id,
    );
    const session = sessions[0];
    if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Phiên đăng nhập đã bị thu hồi');
    }
    return { userId: user.id, email: user.email, role: user.role, sessionId: session.id, tokenVersion: user.tokenVersion };
  }

  async loginAdmin(dto: LoginDto, req: Request) {
    const email = this.normalizeEmail(dto.email);
    const ip = this.getClientIp(req);
    this.loginRateLimitService.checkLockout(ip, email);
    const user = await this.getUserSecurityByEmail(email);
    const matches = await bcrypt.compare(dto.password, user?.password ?? this.dummyHash);
    if (!user || !matches) {
      this.loginRateLimitService.recordFailure(ip, email);
      this.auditLogService.auditFailure(req, 'AUTH_LOGIN_FAILED', 'auth', 'none', { email }, 'Admin login failed');
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }
    if (!['ADMIN', 'SUPERADMIN', 'STAFF'].includes(user.role)) throw new ForbiddenException('Truy cập bị từ chối');
    this.assertAccountUsable(user);
    this.loginRateLimitService.recordSuccess(ip, email);
    const tokens = await this.createSession(user, req);
    this.auditLogService.auditSuccess(req, 'AUTH_LOGIN_SUCCESS', 'auth', String(user.id), { email }, 'Admin login successful');
    return {
      admin: {
        id: String(user.id),
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        email: user.email,
        role: user.role.toLowerCase(),
        status: 'active',
      },
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: Date.now() + this.durationToMs(this.getAccessExpiresIn(), 15 * 60_000),
    };
  }

  async getAdminProfile(userId: number) {
    const user = await this.getUserSecurityById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return {
      admin: {
        id: String(user.id),
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        email: user.email,
        role: user.role.toLowerCase(),
        status: Boolean(user.isActive) && !user.lockedAt ? 'active' : 'inactive',
      },
    };
  }

  async logoutAdmin(userId: number, sessionId?: string) {
    await this.logout(userId, sessionId);
  }
}
