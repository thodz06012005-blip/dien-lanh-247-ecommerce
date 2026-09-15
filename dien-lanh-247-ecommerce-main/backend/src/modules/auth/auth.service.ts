import { Injectable, UnauthorizedException, ForbiddenException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/database/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginRateLimitService } from './login-rate-limit.service';
import { AuditLogService } from '../audit/audit-log.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private loginRateLimitService: LoginRateLimitService,
    private auditLogService: AuditLogService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        ...dto,
        password: hashedPassword,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    const { password, refreshToken, ...userWithoutSecrets } = user;
    return { tokens, user: userWithoutSecrets };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Tài khoản đã bị khóa');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    const { password, refreshToken: rt, ...userWithoutSecrets } = user;
    return { tokens, user: userWithoutSecrets };
  }

  async getUserProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    const { password, refreshToken, ...userWithoutSecrets } = user;
    return userWithoutSecrets;
  }

  async refreshTokens(userId: number, oldRefreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.refreshToken) {
      throw new ForbiddenException('Truy cập bị từ chối');
    }

    const rtMatches = await bcrypt.compare(oldRefreshToken, user.refreshToken);
    if (!rtMatches) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null },
      });
      throw new ForbiddenException('Truy cập bị từ chối');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);
    return tokens;
  }

  async loginAdmin(dto: LoginDto, req: any) {
    const ip = this.loginRateLimitService.getClientIp(req);
    try {
      this.loginRateLimitService.checkLockout(ip, dto.email);
    } catch (e) {
      this.auditLogService.auditRateLimited(req, 'AUTH_LOGIN_RATE_LIMITED', 'auth', 'none', { email: dto.email }, 'Admin login blocked due to rate limit');
      throw e;
    }

    try {
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (!user || !(await bcrypt.compare(dto.password, user.password))) {
        throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
      }

      if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
        throw new ForbiddenException('Truy cập bị từ chối');
      }

      if (!user.isActive) {
        throw new ForbiddenException('Tài khoản đã bị khóa');
      }

      this.loginRateLimitService.recordSuccess(ip, dto.email);
      this.auditLogService.auditSuccess(req, 'AUTH_LOGIN_SUCCESS', 'auth', String(user.id), { email: dto.email }, 'Admin login successful');

      const tokens = await this.generateTokens(user.id, user.email, user.role);
      await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 phút

      return {
        admin: {
          id: String(user.id),
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          email: user.email,
          role: user.role.toLowerCase(),
          status: user.isActive ? 'active' : 'inactive',
        },
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        this.loginRateLimitService.recordFailure(ip, dto.email);
        this.auditLogService.auditFailure(req, 'AUTH_LOGIN_FAILED', 'auth', 'none', { email: dto.email }, 'Admin login failed');
      }
      throw error;
    }
  }

  async getAdminProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return {
      admin: {
        id: String(user.id),
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        email: user.email,
        role: user.role.toLowerCase(),
        status: user.isActive ? 'active' : 'inactive',
      },
    };
  }

  async logout(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  async logoutAdmin(userId: number) {
    await this.logout(userId);
  }

  private async generateTokens(userId: number, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET');
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');

    if (!accessSecret) {
      throw new Error('Missing required environment variable: JWT_ACCESS_SECRET');
    }
    if (!refreshSecret) {
      throw new Error('Missing required environment variable: JWT_REFRESH_SECRET');
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async updateRefreshTokenHash(userId: number, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hash },
    });
  }
}
