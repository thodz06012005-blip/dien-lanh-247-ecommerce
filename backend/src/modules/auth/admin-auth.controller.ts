import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import type { Request, Response } from 'express';
import { ADMIN_PERMISSIONS, getAdminPermissions } from '../../common/auth/admin-permissions';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuditLogService } from '../audit/audit-log.service';
import { AdminAccountService } from './admin-account.service';
import { AuthService } from './auth.service';
import { ChangeAdminPasswordDto, UpdateAdminProfileDto } from './dto/admin-profile.dto';
import { LoginDto } from './dto/login.dto';

interface AdminSessionUser {
  userId: number;
  email: string;
  role: string;
  sessionId: string;
  familyId?: string;
  tokenVersion: number;
  refreshToken?: string;
}

@Controller('admin/auth')
export class AdminAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly adminAccountService: AdminAccountService,
    private readonly auditLogService: AuditLogService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async loginAdmin(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const result = await this.authService.loginAdmin(loginDto, req);
    this.setAdminCookies(res, { accessToken: result.token, refreshToken: result.refreshToken });
    return {
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        admin: { ...result.admin, permissions: getAdminPermissions(result.admin.role) },
        permissions: getAdminPermissions(result.admin.role),
        expiresAt: result.expiresAt,
      },
    };
  }

  @UseGuards(AuthGuard('jwt-admin-refresh'))
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshAdmin(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user as AdminSessionUser;
    const role = user.role.toUpperCase();
    if (!['ADMIN', 'SUPERADMIN', 'STAFF'].includes(role)) {
      this.clearAdminCookies(res);
      throw new Error('Admin role required');
    }
    const tokens = await this.authService.refreshTokens(
      {
        userId: user.userId,
        email: user.email,
        role: user.role,
        sessionId: user.sessionId,
        familyId: user.familyId ?? '',
        tokenVersion: user.tokenVersion,
        refreshToken: user.refreshToken ?? '',
      },
      req,
    );
    this.setAdminCookies(res, tokens);
    const admin = await this.adminAccountService.getProfile(user.userId);
    return {
      success: true,
      message: 'Phiên quản trị đã được làm mới',
      data: {
        admin,
        permissions: admin.permissions,
        expiresAt: Date.now() + 15 * 60_000,
      },
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logoutAdmin(
    @CurrentUser() user: AdminSessionUser,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    await this.authService.logoutAdmin(user.userId, user.sessionId);
    this.auditLogService.auditSuccess(req, 'AUTH_LOGOUT', 'auth', String(user.userId), { sessionId: user.sessionId }, 'Admin logout successful');
    this.clearAdminCookies(res);
    return { success: true, message: 'Đăng xuất thành công' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Permissions(ADMIN_PERMISSIONS.PROFILE_VIEW)
  @Get('me')
  async getAdminProfile(@CurrentUser() user: AdminSessionUser) {
    const admin = await this.adminAccountService.getProfile(user.userId);
    return { success: true, data: { admin, permissions: admin.permissions } };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Permissions(ADMIN_PERMISSIONS.PROFILE_MANAGE)
  @Patch('profile')
  async updateProfile(
    @CurrentUser() user: AdminSessionUser,
    @Body() dto: UpdateAdminProfileDto,
    @Req() req: Request,
  ) {
    const admin = await this.adminAccountService.updateProfile(user.userId, dto);
    this.auditLogService.auditSuccess(req, 'ADMIN_PROFILE_UPDATED', 'admin-profile', String(user.userId), null, 'Admin profile updated');
    return { success: true, message: 'Hồ sơ quản trị đã được cập nhật', data: { admin, permissions: admin.permissions } };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Permissions(ADMIN_PERMISSIONS.PROFILE_MANAGE)
  @Post('change-password')
  async changePassword(
    @CurrentUser() user: AdminSessionUser,
    @Body() dto: ChangeAdminPasswordDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const data = await this.adminAccountService.changePassword(user.userId, dto);
    this.clearAdminCookies(res);
    this.auditLogService.auditSuccess(req, 'ADMIN_PASSWORD_CHANGED', 'admin-profile', String(user.userId), null, 'Admin password changed');
    return { success: true, message: 'Mật khẩu đã đổi. Vui lòng đăng nhập lại.', data };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Permissions(ADMIN_PERMISSIONS.PROFILE_VIEW)
  @Get('sessions')
  async sessions(@CurrentUser() user: AdminSessionUser) {
    return {
      success: true,
      data: await this.adminAccountService.listSessions(user.userId, user.sessionId),
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Permissions(ADMIN_PERMISSIONS.PROFILE_MANAGE)
  @Delete('sessions/:id')
  async revokeSession(
    @CurrentUser() user: AdminSessionUser,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.adminAccountService.revokeSession(user.userId, id);
    if (id === user.sessionId) this.clearAdminCookies(res);
    return { success: true, message: 'Phiên đăng nhập đã được thu hồi', data };
  }

  private cookieSecure() {
    const configured = this.configService.get<string>('COOKIE_SECURE');
    return configured === 'true' || (configured !== 'false' && this.configService.get('NODE_ENV') === 'production');
  }

  private setAdminCookies(res: Response, tokens: { accessToken: string; refreshToken: string }) {
    const secure = this.cookieSecure();
    const sameSite = this.configService.get<'strict' | 'lax' | 'none'>('COOKIE_SAME_SITE', 'strict');
    res.cookie('adminAccessToken', tokens.accessToken, {
      httpOnly: true,
      secure,
      sameSite,
      path: '/api/v1/admin',
      maxAge: 15 * 60_000,
    });
    res.cookie('adminRefreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure,
      sameSite,
      path: '/api/v1/admin/auth/refresh',
      maxAge: 7 * 24 * 60 * 60_000,
    });
  }

  private clearAdminCookies(res: Response) {
    const secure = this.cookieSecure();
    const sameSite = this.configService.get<'strict' | 'lax' | 'none'>('COOKIE_SAME_SITE', 'strict');
    res.clearCookie('adminAccessToken', { httpOnly: true, secure, sameSite, path: '/api/v1/admin' });
    res.clearCookie('adminRefreshToken', { httpOnly: true, secure, sameSite, path: '/api/v1/admin/auth/refresh' });
  }
}
